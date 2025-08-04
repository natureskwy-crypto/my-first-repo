/**
 * @fileoverview Google Cloud Function to fetch data from Fassto API and log it to a Google Sheet.
 * This function is triggered by an HTTP POST request from Google Apps Script.
 */

const axios = require('axios');
const { google } = require('googleapis');

// --- Configuration ---
// ✅ Fassto API Endpoint: Base URL for the Fassto API.
const FASSTO_API_BASE_URL = 'https://fmsapi.fassto.ai'; 

// IMPORTANT: API_CD and API_KEY are now loaded from environment variables for security.
// You MUST set these environment variables when deploying your Cloud Function.
// Example: --set-env-vars API_CD=YOUR_API_CD_VALUE,API_KEY=YOUR_API_KEY_VALUE
const API_CD = process.env.API_CD; 
const API_KEY = process.env.API_KEY;
// --- End Configuration ---

// Validate environment variables on function startup
// If critical environment variables are missing, terminate early with an error.
if (!API_CD || !API_KEY) {
  const errorMessage = "Environment variables API_CD or API_KEY are not set. Please configure them during Cloud Function deployment.";
  console.error(errorMessage);
  // Throwing an error here will prevent the function from proceeding with invalid credentials.
  // For HTTP functions, this error will be caught by the outer try/catch and returned as a 500.
  throw new Error(errorMessage); 
}

/**
 * Fetches an access token from the Fassto API using the provided API CD and Key.
 * This token is required for subsequent authenticated API calls.
 *
 * @returns {string} The obtained access token.
 * @throws {Error} If the access token cannot be obtained.
 */
async function getFasstoAccessToken() {
  const authApiPath = '/api/v1/auth/connect';
  const fullAuthUrl = `${FASSTO_API_BASE_URL}${authApiPath}?apiCd=${API_CD}&apiKey=${API_KEY}`;

  try {
    const response = await axios.post(fullAuthUrl); // POST request with query parameters
    const authResponse = response.data;

    // Log the full authentication response for detailed debugging in Cloud Logging.
    console.log('Fassto Auth Response:', JSON.stringify(authResponse, null, 2)); 

    if (authResponse.data && authResponse.data.accessToken) {
      return authResponse.data.accessToken;
    } else {
      // Provide more context if accessToken is not found.
      const apiErrorMsg = authResponse.header?.msg || 'Unknown authentication error';
      throw new Error(`Access token not found in authentication response. API message: "${apiErrorMsg}". Full response: ${JSON.stringify(authResponse)}`);
    }
  } catch (error) {
    // Log the full error object for comprehensive debugging.
    console.error('Error getting access token:', error); 
    const apiErrorMessage = error.response?.data?.header?.msg || error.message;
    throw new Error(`Failed to obtain access token: ${apiErrorMessage}. Please check your API CD/Key or Fassto API status.`);
  }
}

/**
 * Google Sheets API client.
 * Initialized globally to be reused across function invocations (for warm starts).
 * It authenticates using the function's default service account.
 */
const sheets = google.sheets({
  version: 'v4',
  auth: new google.auth.GoogleAuth({ scopes: ['https://www.googleapis.com/auth/spreadsheets'] })
});

/**
 * Main Cloud Function entry point.
 * This function is triggered by an HTTP POST request. It fetches Fassto data
 * and logs it to the specified Google Sheet.
 *
 * @param {object} req The HTTP request object.
 * @param {object} res The HTTP response object.
 */
exports.fasstoDataFetcher = async (req, res) => {
  // Set CORS headers for preflight requests
  // Restricting to Apps Script origin for better security.
  // If calling from other Google Workspace contexts (e.g., directly from Sheets UI),
  // you might need to add their origins here as well.
  const ALLOWED_ORIGIN = 'https://script.google.com'; 
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Max-Age', '3600');
    return res.status(204).send('');
  }
  // Set CORS headers for the main request
  res.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN);

  try {
    // 1. Get spreadsheetId and sheetName from the Apps Script request body
    // Also, accept optional startDate and endDate from the payload for flexibility.
    const { spreadsheetId, sheetName, startDate: reqStartDate, endDate: reqEndDate } = req.body;

    if (!spreadsheetId || !sheetName) {
      return res.status(400).send({ status: 'error', message: 'Missing spreadsheetId or sheetName in request body.' });
    }

    // Use provided dates from Apps Script payload, or default to today's date in YYYY-MM-DD format (UTC).
    const todayUTC = new Date().toISOString().slice(0, 10);
    const startDate = reqStartDate || todayUTC;
    const endDate = reqEndDate || todayUTC;

    // 2. Obtain the access token from Fassto API
    const accessToken = await getFasstoAccessToken();

    // 3. Prepare parameters for Fassto Delivery API
    const deliveryApiPath = '/api/v1/delivery';
    const deliveryStatus = 'ALL'; // ALL:전체, ORDER:출고요청, WORKING:출고작업중, DONE:출고완료, PARTDONE:부분출고, CANCEL:출고요청취소, SHORTAGE:재고부족결품
    const outboundDivision = '1'; // 1:택배, 2:차량배송

    const fullDeliveryUrl = `${FASSTO_API_BASE_URL}${deliveryApiPath}/${API_CD}/${startDate}/${endDate}/${deliveryStatus}/${outboundDivision}`;

    // 4. Fetch data from Fassto Delivery API
    const fasstoResponse = await axios.get(fullDeliveryUrl, {
      headers: {
        'accessToken': accessToken, 
        'Content-Type': 'application/json'
      }
    });
    const apiResponse = fasstoResponse.data;
    const data = apiResponse.data; // Assuming 'data' field contains the actual results

    // Log the full API response for delivery data for debugging.
    console.log('Fassto Delivery API Response:', JSON.stringify(apiResponse, null, 2));

    if (!data || !Array.isArray(data)) {
      console.warn('Fassto API response "data" field is empty or not an array:', JSON.stringify(apiResponse, null, 2));
      return res.status(200).send({ status: 'warning', message: 'Fassto API에서 가져올 데이터가 없거나 형식이 예상과 다릅니다.', fasstoResponse: apiResponse });
    }

    // 5. The Google Sheets client is already authenticated globally.
    // Ensure the service account has the 'Google Sheets Editor' role.
    // 6. Prepare data for appending to Google Sheet
    const rows = data.map(item => {
      // IMPORTANT: Verify these field names from Fassto Swagger documentation for Delivery API response.
      // Example fields based on previous Swagger screenshots: 'outDlvNo', 'custNm', 'status'.
      return [
        new Date().toISOString(), // Timestamp in ISO format
        item.outDlvNo || item.trackingNo || '', // outDlvNo (출고 운송장 번호) 예상. fallback for robustness.
        item.custNm || item.receiverName || '', // custNm (고객명) 예상. fallback for robustness.
        item.status || '' // status (상태) 예상.
      ];
    });

    // 7. Append data to the sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId,
      range: sheetName, // Appending to just the sheet name is sufficient and more robust.
      valueInputOption: 'RAW',
      resource: {
        values: rows,
      },
    });

    console.log('Data successfully logged to Google Sheet.');
    res.status(200).send({ status: 'success', message: 'Fassto 데이터가 스프레드시트에 성공적으로 기록되었습니다.' });

  } catch (error) {
    // Log the full error object for comprehensive debugging.
    console.error('Cloud Function 실행 중 오류 발생:', error); 
    const errorMessage = error.response?.data?.header?.msg || error.message;
    res.status(500).send({ status: 'error', message: `Cloud Function 실행 중 오류가 발생했습니다: ${errorMessage}` });
  }
};