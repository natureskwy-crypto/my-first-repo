/**
 * @fileoverview Google Cloud Function to fetch data from Fassto API and log it to a Google Sheet.
 * This function is triggered by an HTTP POST request from Google Apps Script.
 */

const axios = require('axios');
const { google } = require('googleapis');

// --- Configuration ---
// ✅ Fassto API Endpoint: Base URL for the Fassto API.
const FASSTO_API_BASE_URL = 'https://fmsapi.fassto.ai'; 
// ✅ Fassto API CD: Provided API CD for authentication.
const API_CD = 'de2353d8-6eae-11f0-afa6-0a3424c9a26b';
// ✅ Fassto API Key: Provided API Key for authentication.
const API_KEY = 'de2353e36eae11f0afa60a3424c9a26b';
// --- End Configuration ---

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

    console.log('Fassto Auth Response:', authResponse);

    if (authResponse.data && authResponse.data.accessToken) {
      return authResponse.data.accessToken;
    } else {
      throw new Error('Access token not found in authentication response. Please verify the API response structure.');
    }
  } catch (error) {
    console.error('Error getting access token:', error.response ? error.response.data : error.message);
    throw new Error('Failed to obtain access token: ' + (error.response ? JSON.stringify(error.response.data) : error.message));
  }
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
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Origin', '*'); // Or restrict to your Apps Script origin
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Max-Age', '3600');
    return res.status(204).send('');
  }
  // Set CORS headers for the main request
  res.set('Access-Control-Allow-Origin', '*'); // Or restrict to your Apps Script origin

  try {
    // 1. Get spreadsheetId and sheetName from the Apps Script request body
    const { spreadsheetId, sheetName } = req.body;

    if (!spreadsheetId || !sheetName) {
      return res.status(400).send({ status: 'error', message: 'Missing spreadsheetId or sheetName in request body.' });
    }

    // 2. Obtain the access token from Fassto API
    const accessToken = await getFasstoAccessToken();

    // 3. Prepare parameters for Fassto Delivery API
    const deliveryApiPath = '/api/v1/delivery';
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');

    const startDate = `${yyyy}-${mm}-${dd}`;
    const endDate = `${yyyy}-${mm}-${dd}`;
    const deliveryStatus = 'ALL'; 
    const outboundDivision = '1'; 

    const fullDeliveryUrl = `${FASSTO_API_BASE_URL}${deliveryApiPath}/${API_CD}/${startDate}/${endDate}/${deliveryStatus}/${outboundDivision}`;

    // 4. Fetch data from Fassto Delivery API
    const fasstoResponse = await axios.get(fullDeliveryUrl, {
      headers: {
        'accessToken': accessToken, // Use the obtained access token
        'Content-Type': 'application/json'
      }
    });
    const apiResponse = fasstoResponse.data;
    const data = apiResponse.data; // Assuming 'data' field contains the actual results

    if (!data || !Array.isArray(data)) {
      console.warn('Fassto API response "data" field is empty or not an array:', apiResponse);
      return res.status(200).send({ status: 'warning', message: 'Fassto API에서 가져올 데이터가 없거나 형식이 예상과 다릅니다.', fasstoResponse: apiResponse });
    }

    // 5. Authenticate to Google Sheets API using the Cloud Function's default service account
    const auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const authClient = await auth.getClient();
    google.options({auth: authClient});
    const sheets = google.sheets({version: 'v4'});

    // 6. Prepare data for appending to Google Sheet
    const rows = data.map(item => [
      new Date().toISOString(), // Timestamp in ISO format
      item.outDlvNo || item.trackingNo || '',
      item.custNm || item.receiverName || '',
      item.status || ''
    ]);

    // 7. Append data to the sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId,
      range: `${sheetName}!A:Z`, // Append to column A, any row
      valueInputOption: 'RAW',
      resource: {
        values: rows,
      },
    });

    console.log('Data successfully logged to Google Sheet.');
    res.status(200).send({ status: 'success', message: 'Fassto 데이터가 스프레드시트에 성공적으로 기록되었습니다.' });

  } catch (error) {
    console.error('Cloud Function 실행 중 오류 발생:', error);
    res.status(500).send({ status: 'error', message: 'Cloud Function 실행 중 오류가 발생했습니다: ' + error.message });
  }
};
```

**`package.json`** (올바른 JSON 형식)
```json
{
  "name": "fassto-data-fetcher",
  "version": "1.0.0",
  "description": "Google Cloud Function to fetch data from Fassto API and log it to Google Sheets.",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "googleapis": "^128.0.0"
  },
  "engines": {
    "node": "18"
  }
}