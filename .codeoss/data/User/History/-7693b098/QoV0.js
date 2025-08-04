cat <<'EOF' > index.js
const axios = require('axios');
const { google } = require('googleapis');
const { v4: uuidv4 } = require('uuid');
const express = require('express');
const bodyParser = require('body-parser');

// --- 설정 ---
const API_CD = process.env.API_CD;
const API_KEY = process.env.API_KEY;
const BASE_URL = 'https://fmsapi.fassto.ai';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://script.google.com,https://script.googleusercontent.com').split(',');

// 검증
if (!API_CD || !API_KEY) {
  console.error('❌ 환경변수 누락:', { hasAPI_CD: !!API_CD, hasAPI_KEY: !!API_KEY });
  throw new Error('환경변수(API_CD/API_KEY)가 설정되지 않았습니다.');
}

// Google Sheets 클라이언트 (재사용)
const auth = new google.auth.GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

// 헬퍼
function getTodayAESTDate() {
  const now = new Date();
  const aestOffsetMs = 10 * 60 * 60000; // UTC+10
  return new Date(now.getTime() + aestOffsetMs).toISOString().slice(0, 10);
}
function isValidDateFormat(d) {
  return typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);
}
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Fassto 인증 (재시도 포함)
async function getAccessToken() {
  const url = \`\${BASE_URL}/api/v1/auth/connect?apiCd=\${API_CD}&apiKey=\${API_KEY}\`;
  let attempt = 0;
  const max = 3;
  while (attempt < max) {
    try {
      const res = await axios.post(url, {}, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      });
      console.log('✅ [Auth] response:', JSON.stringify(res.data, null, 2));
      const token = res.data?.data?.accessToken;
      if (!token) throw new Error('accessToken 없음');
      return token;
    } catch (e) {
      attempt++;
      console.warn(\`⚠️ [Auth] 실패 시도 \${attempt}/\${max}\`, e.response?.data || e.message);
      if (attempt >= max) {
        const apiMsg = e.response?.data?.header?.msg || e.message;
        throw new Error(\`Fassto 인증 실패 after \${attempt} attempts: \${apiMsg}\`);
      }
      await sleep(300 * attempt);
    }
  }
}

// 핵심 핸들러 (Cloud Function도 여기로)
async function fasstoDataFetcherImpl(req, res) {
  const traceId = uuidv4();
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  } else {
    res.set('Access-Control-Allow-Origin', 'null');
  }
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  try {
    console.log(\`[\${traceId}] payload:\`, JSON.stringify(req.body || {}, null, 2));
    const { spreadsheetId, sheetName, startDate, endDate } = req.body || {};

    if (!spreadsheetId || !sheetName) {
      return res.status(400).json({
        traceId,
        status: 'error',
        message: 'spreadsheetId 또는 sheetName이 누락되었습니다.',
        received: { spreadsheetId, sheetName },
      });
    }

    const start = isValidDateFormat(startDate) ? startDate : getTodayAESTDate();
    const end = isValidDateFormat(endDate) ? endDate : getTodayAESTDate();
    const usedFallbackDates = (!isValidDateFormat(startDate) || !isValidDateFormat(endDate));

    // 인증
    const token = await getAccessToken();

    // 배송 조회 (간단 재시도)
    const deliveryUrl = \`\${BASE_URL}/api/v1/delivery/\${API_CD}/\${start}/\${end}/ALL/1\`;
    let deliveryRes;
    let attempt = 0;
    const maxDelivery = 2;
    while (attempt < maxDelivery) {
      try {
        attempt++;
        deliveryRes = await axios.get(deliveryUrl, {
          headers: {
            accessToken: token,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        });
        break;
      } catch (e) {
        console.warn(\`[\${traceId}] [Delivery] 실패 시도 \${attempt}\`, e.response?.data || e.message);
        if (attempt >= maxDelivery) {
          throw new Error(\`Fassto 배송 조회 실패: \${e.message} | detail: \${JSON.stringify(e.response?.data || {})}\`);
        }
        await sleep(200 * attempt);
      }
    }

    console.log(\`[\${traceId}] Delivery API response:\`, JSON.stringify(deliveryRes.data, null, 2));
    const items = Array.isArray(deliveryRes.data?.data) ? deliveryRes.data.data : [];

    if (items.length === 0) {
      return res.status(200).json({
        traceId,
        status: 'info',
        message: 'Fassto 데이터 없음',
        count: 0,
        usedFallbackDates,
        deliveryRaw: deliveryRes.data,
      });
    }

    const rows = items.map(item => [
      new Date().toISOString(),
      item.outDlvNo || item.trackingNo || '',
      item.custNm || item.receiverName || '',
      item.status || '',
    ]);
    const safeRange = sheetName.includes('!') ? sheetName : \`\${sheetName}!A:D\`;

    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: safeRange,
        valueInputOption: 'RAW',
        resource: { values: rows },
      });
    } catch (sheetErr) {
      console.error(\`[\${traceId}] Sheets append 실패:\`, sheetErr.message);
      return res.status(500).json({
        traceId,
        status: 'error',
        message: 'Google Sheets 기록 실패',
        error: sheetErr.message,
      });
    }

    return res.status(200).json({
      traceId,
      status: 'success',
      message: \`출고 데이터 \${rows.length}건 기록 성공\`,
      count: rows.length,
      spreadsheetId,
      range: safeRange,
      usedFallbackDates,
    });
  } catch (err) {
    console.error('❌ 전체 처리 실패:', err);
    const apiMsg = err.response?.data?.header?.msg || err.message;
    return res.status(500).json({
      status: 'error',
      message: \`Cloud Function 오류: \${apiMsg}\`,
      raw: err.response?.data || null,
    });
  }
}

// Cloud Function entry point (2nd gen)
exports.fasstoDataFetcher = fasstoDataFetcherImpl;

// Express server for Cloud Run / 통합 실행
if (require.main === module) {
  const app = express();
  app.use(bodyParser.json({ limit: '1mb' }));

  app.options('*', (req, res) => {
    const origin = req.headers.origin || '*';
    if (ALLOWED_ORIGINS.includes(origin)) {
      res.set('Access-Control-Allow-Origin', origin);
    } else {
      res.set('Access-Control-Allow-Origin', '*');
    }
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Max-Age', '3600');
    res.sendStatus(204);
  });

  app.post('/', (req, res) => {
    fasstoDataFetcherImpl(req, res);
  });

  const port = process.env.PORT || 8080;
  app.listen(port, () => {
    console.log(\`🚀 Server listening on port \${port}\`);
  });
}
EOF
