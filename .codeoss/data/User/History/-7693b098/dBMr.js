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
if (!API_CD || !API_KEY) {
  const errorMessage = "Environment variables API_CD or API_KEY are not set. Please configure them during Cloud Function deployment.";
  console.error("❌ " + errorMessage);
  throw new Error(errorMessage); 
}

/**
 * Fetches an access token from the Fassto API using the provided API CD and Key.
 * This token is required for subsequent authenticated API calls.
 *
 * @returns {string} The obtained access token.
 * @throws {Error} If the access token cannot be obtained.
 */
async function getAccessToken() {
  const authApiPath = '/api/v1/auth/connect';
  const fullAuthUrl = `${FASSTO_API_BASE_URL}${authApiPath}?apiCd=${API_CD}&apiKey=${API_KEY}`;

  try {
    // IMPORTANT: Explicitly sending an empty JSON body {} as some APIs require it for POST requests with query parameters.
    const response = await axios.post(fullAuthUrl, {}, { // <-- 핵심 수정 부분: {} 빈 본문 추가
      headers: {
        'Content-Type': 'application/json' // Explicitly set content type for the POST request
      }
    }); 
    const authResponse = response.data;

    // Log the full authentication response for detailed debugging in Cloud Logging.
    console.log('✅ Fassto Auth Response (Success):', JSON.stringify(authResponse, null, 2)); 

    if (authResponse.data && authResponse.data.accessToken) {
      return authResponse.data.accessToken;
    } else {
      // Provide more context if accessToken is not found.
      const apiErrorMsg = authResponse.header?.msg || 'Unknown authentication error (no specific message from Fassto).';
      throw new Error(`Access token not found in authentication response. Fassto message: "${apiErrorMsg}". Full response: ${JSON.stringify(authResponse)}`);
    }
  } catch (error) {
    // Log the full error object for comprehensive debugging.
    console.error('❌ Error getting access token:', error); 
    const apiErrorMessage = error.response?.data?.header?.msg || error.message;
    const statusCode = error.response?.status || 'N/A';
    throw new Error(`Failed to obtain access token (HTTP ${statusCode}). Fassto message: "${apiErrorMessage}". Raw response: ${JSON.stringify(error.response?.data || {})}`);
  }
}

// Google Sheets API authentication setup (outside the handler for efficiency)
const auth = new google.auth.GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

// Helper function for AEST date
function getTodayAESTDate() {
  const now = new Date();
  // AEST is UTC+10 (Australian Eastern Standard Time)
  const aestOffsetMs = 10 * 60 * 60 * 1000; 
  return new Date(now.getTime() + aestOffsetMs).toISOString().slice(0, 10);
}

// Helper function for date format validation
function isValidDateFormat(dateStr) {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

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
  const ALLOWED_ORIGIN = 'https://script.google.com'; 
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Max-Age', '3600');
    return res.status(204).send('');
  }
  res.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN);

  try {
    // 1. Get spreadsheetId and sheetName from the Apps Script request body
    const { spreadsheetId, sheetName, startDate, endDate } = req.body || {}; 

    if (!spreadsheetId || !sheetName) {
      console.error('❌ Missing spreadsheetId or sheetName in request body:', req.body);
      return res.status(400).json({
        status: 'error',
        message: '필수 인자 (spreadsheetId 또는 sheetName)가 누락되었습니다.',
      });
    }

    // Determine dates for API call (use provided dates or default to today AEST)
    const start = isValidDateFormat(startDate) ? startDate : getTodayAESTDate();
    const end = isValidDateFormat(endDate) ? endDate : getTodayAESTDate();

    // 2. Obtain the access token from Fassto API
    const token = await getAccessToken();

    // 3. Prepare parameters for Fassto Delivery API
    const deliveryApiPath = '/api/v1/delivery';
    const deliveryStatus = 'ALL'; 
    const outboundDivision = '1'; 

    const fullDeliveryUrl = `${FASSTO_API_BASE_URL}${deliveryApiPath}/${API_CD}/${start}/${end}/${deliveryStatus}/${outboundDivision}`;

    // 4. Fetch data from Fassto Delivery API
    const response = await axios.get(fullDeliveryUrl, {
      headers: {
        'accessToken': token, 
        'Content-Type': 'application/json'
      }
    });
    const apiResponse = response.data;
    const items = apiResponse.data || []; // Assuming 'data' field contains the actual results array

    // Log the full API response for delivery data for debugging.
    console.log('✅ Fassto Delivery API Response (Success):', JSON.stringify(apiResponse, null, 2));

    if (items.length === 0) {
      console.log('ℹ️ Fassto API에서 가져올 데이터가 없습니다. 응답:', JSON.stringify(apiResponse, null, 2));
      return res.status(200).json({
        status: 'info',
        message: 'Fassto API에서 가져올 데이터가 없습니다.',
        count: 0,
        fasstoResponse: apiResponse.header // Include header for context
      });
    }

    // 5. Prepare data for appending to Google Sheet
    const rows = items.map(item => {
      // IMPORTANT: Verify these field names from Fassto Swagger documentation for Delivery API response.
      // Example fields based on previous Swagger screenshots: 'outDlvNo', 'custNm', 'status'.
      // Added item.itemList?.[0]?.itemNm based on user's provided code.
      return [
        new Date().toISOString(), // Timestamp in ISO format
        item.outDlvNo || item.trackingNo || '', // outDlvNo (출고 운송장 번호) 예상. fallback for robustness.
        item.custNm || item.receiverName || '', // custNm (고객명) 예상. fallback for robustness.
        item.itemList?.[0]?.itemNm || '', // 새로운 필드: 품목명 (첫 번째 품목의 이름)
        item.status || '' // status (상태) 예상.
      ];
    });

    // 6. Append data to the sheet
    // Determine the range for appending. If sheetName already includes a range (e.g., "Sheet1!A:Z"), use it.
    // Otherwise, append to a default range (e.g., "Sheet1!A:E" assuming 5 columns now).
    const appendRange = sheetName.includes('!') ? sheetName : `${sheetName}!A:E`; // Range updated to A:E for 5 columns

    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: appendRange,
        valueInputOption: 'RAW',
        resource: { values: rows },
      });
    } catch (sheetErr) {
      console.error('❌ Google Sheets 기록 오류:', sheetErr); // Log full error object
      return res.status(500).json({
        status: 'error',
        message: 'Google Sheets에 데이터 기록 실패',
        error: sheetErr.message,
      });
    }

    console.log(`✅ Fassto 데이터 ${rows.length}개 스프레드시트에 성공적으로 기록.`);
    return res.status(200).json({
      status: 'success',
      message: `Fassto 출고 데이터 ${rows.length}개 기록 성공`,
      count: rows.length,
      spreadsheetId,
      range: appendRange,
    });

  } catch (err) {
    // Log the full error object for comprehensive debugging.
    console.error('❌ Cloud Function 전체 처리 실패:', err); 
    const apiErrorMessage = err.response?.data?.header?.msg || err.message;
    const statusCode = err.response?.status || 'N/A';
    return res.status(500).json({
      status: 'error',
      message: `Cloud Function 실행 중 오류 발생 (HTTP ${statusCode}): ${apiErrorMessage}`,
      rawResponse: err.response?.data, // Include raw API response for debugging
    });
  }
};
