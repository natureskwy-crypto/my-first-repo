cat <<'EOF' > index.js
const axios = require('axios');
const { google } = require('googleapis');
const { v4: uuidv4 } = require('uuid');

// --- configuration ---
const API_CD = process.env.API_CD;
const API_KEY = process.env.API_KEY;
const BASE_URL = 'https://fmsapi.fassto.ai';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://script.google.com,https://script.googleusercontent.com')
  .split(',')
  .map(o => o.trim());

// Validate env
if (!API_CD || !API_KEY) {
  console.error(JSON.stringify({
    stage: 'startup',
    severity: 'ERROR',
    message: 'Missing environment variables API_CD or API_KEY',
    hasAPI_CD: !!API_CD,
    hasAPI_KEY: !!API_KEY
  }));
  throw new Error('Environment variables API_CD and API_KEY must be set.');
}

// Google Sheets client
const auth = new google.auth.GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});
const sheets = google.sheets({ version: 'v4', auth });

// helpers
function getTodayAESTDate() {
  const now = new Date();
  const aestOffsetMs = 10 * 60 * 60000; // UTC+10
  return new Date(now.getTime() + aestOffsetMs).toISOString().slice(0, 10);
}
function isValidDateFormat(d) {
  return typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);
}
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
function structuredLog(obj) {
  console.log(JSON.stringify(obj));
}
function maskToken(token) {
  if (!token || token.length < 8) return '****';
  return \`\${token.slice(0,4)}****\${token.slice(-4)}\`;
}

// Fassto auth with retry
async function getAccessToken() {
  const traceId = uuidv4();
  const url = \`\${BASE_URL}/api/v1/auth/connect?apiCd=\${API_CD}&apiKey=\${API_KEY}\`;
  let attempt = 0;
  const maxAttempts = 3;
  while (attempt < maxAttempts) {
    try {
      attempt++;
      const res = await axios.post(url, {}, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });
      const token = res.data?.data?.accessToken;
      structuredLog({
        traceId,
        stage: 'auth',
        attempt,
        status: 'success',
        token_masked: maskToken(token)
      });
      if (!token) throw new Error('accessToken missing in Fassto response');
      return token;
    } catch (err) {
      const apiMsg = err.response?.data?.header?.msg || err.message;
      structuredLog({
        traceId,
        stage: 'auth',
        attempt,
        status: 'failure',
        message: apiMsg,
        raw: err.response?.data || null
      });
      if (attempt >= maxAttempts) {
        throw new Error(\`Fassto authentication failed after \${attempt} attempts: \${apiMsg}\`);
      }
      await sleep(200 * attempt);
    }
  }
  throw new Error('Unexpected authentication failure');
}

// core handler
exports.fasstoDataFetcher = async (req, res) => {
  const traceId = uuidv4();
  const origin = req.headers.origin || '';
  if (!ALLOWED_ORIGINS.includes(origin)) {
    structuredLog({ traceId, stage: 'cors', severity: 'WARN', message: 'Origin not allowed', origin });
    return res.status(403).json({ status: 'error', message: 'CORS: origin not permitted' });
  }
  res.set('Access-Control-Allow-Origin', origin);
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(204).send('');

  try {
    structuredLog({ traceId, stage: 'request_received', body: req.body });

    const { spreadsheetId, sheetName, startDate, endDate } = req.body || {};
    if (!spreadsheetId || !sheetName) {
      return res.status(400).json({
        traceId,
        status: 'error',
        message: 'spreadsheetId or sheetName is missing',
        received: { spreadsheetId, sheetName }
      });
    }

    const start = isValidDateFormat(startDate) ? startDate : getTodayAESTDate();
    const end = isValidDateFormat(endDate) ? endDate : getTodayAESTDate();
    const usedFallbackDates = (!isValidDateFormat(startDate) || !isValidDateFormat(endDate));

    const token = await getAccessToken();

    const deliveryUrl = \`\${BASE_URL}/api/v1/delivery/\${API_CD}/\${start}/\${end}/ALL/1\`;
    let deliveryRes = null;
    let attempt = 0;
    const maxDeliveryAttempts = 2;
    while (attempt < maxDeliveryAttempts) {
      try {
        attempt++;
        deliveryRes = await axios.get(deliveryUrl, {
          headers: {
            accessToken: token,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        });
        structuredLog({
          traceId,
          stage: 'delivery_fetch',
          attempt,
          status: 'success',
          url: deliveryUrl
        });
        break;
      } catch (err) {
        const apiMsg = err.response?.data?.header?.msg || err.message;
        structuredLog({
          traceId,
          stage: 'delivery_fetch',
          attempt,
          status: 'failure',
          message: apiMsg,
          raw: err.response?.data || null
        });
        if (attempt >= maxDeliveryAttempts) {
          throw new Error(\`Fassto delivery fetch failed: \${apiMsg}\`);
        }
        await sleep(150 * attempt);
      }
    }

    const items = Array.isArray(deliveryRes.data?.data) ? deliveryRes.data.data : [];
    if (items.length === 0) {
      return res.status(200).json({
        traceId,
        status: 'info',
        message: 'No Fassto data',
        count: 0,
        usedFallbackDates,
        deliveryRaw: deliveryRes.data
      });
    }

    const rows = items.map(item => [
      new Date().toISOString(),
      item.outDlvNo || item.trackingNo || '',
      item.custNm || item.receiverName || '',
      item.status || ''
    ]);
    const safeRange = sheetName.includes('!') ? sheetName : \`\${sheetName}!A:D\`;

    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: safeRange,
        valueInputOption: 'RAW',
        resource: { values: rows }
      });
      structuredLog({
        traceId,
        stage: 'sheet_append',
        status: 'success',
        spreadsheetId,
        range: safeRange,
        rowCount: rows.length
      });
    } catch (sheetErr) {
      structuredLog({
        traceId,
        stage: 'sheet_append',
        status: 'failure',
        error: sheetErr.message
      });
      return res.status(500).json({
        traceId,
        status: 'error',
        message: 'Google Sheets write failed',
        error: sheetErr.message
      });
    }

    return res.status(200).json({
      traceId,
      status: 'success',
      message: \`Recorded \${rows.length} items\`,
      count: rows.length,
      spreadsheetId,
      range: safeRange,
      usedFallbackDates
    });
  } catch (err) {
    const apiMsg = err.response?.data?.header?.msg || err.message || 'Unknown';
    structuredLog({
      traceId: err.traceId || 'n/a',
      stage: 'fatal',
      message: apiMsg,
      raw: err.response?.data || null
    });
    return res.status(500).json({
      status: 'error',
      message: \`Internal error: \${apiMsg.length > 200 ? apiMsg.slice(0,200) + '...' : apiMsg}\`
    });
  }
};
EOF
