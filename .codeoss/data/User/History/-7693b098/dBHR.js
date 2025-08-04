const axios = require('axios');
const { google } = require('googleapis');
const { v4: uuidv4 } = require('uuid'); // 추가: uuid dependency 필요

const API_CD = process.env.API_CD;
const API_KEY = process.env.API_KEY;
const BASE_URL = 'https://fmsapi.fassto.ai';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://script.google.com,https://script.googleusercontent.com').split(',');

// 환경변수 기본 검증
if (!API_CD || !API_KEY) {
  console.error('❌ 환경변수 누락:', { API_CD: !!API_CD, API_KEY: !!API_KEY });
  throw new Error('환경변수(API_CD/API_KEY)가 누락되었습니다.');
}
if (typeof API_CD !== 'string' || typeof API_KEY !== 'string' || API_KEY.length < 10) {
  console.warn('⚠️ 환경변수 형식이 비정상일 수 있습니다.', { API_CD, API_KEY: API_KEY ? '****' : null });
}

// Google Sheets client
const auth = new google.auth.GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

// helper
function getTodayAESTDate() {
  const now = new Date();
  const aestOffsetMs = 10 * 60 * 60000;
  return new Date(now.getTime() + aestOffsetMs).toISOString().slice(0, 10);
}
function isValidDateFormat(dateStr) {
  return typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Fassto 인증 + 재시도 (지수 백오프)
async function getAccessToken() {
  const url = `${BASE_URL}/api/v1/auth/connect?apiCd=${API_CD}&apiKey=${API_KEY}`;
  let attempt = 0;
  const maxAttempts = 3;
  while (attempt < maxAttempts) {
    try {
      const res = await axios.post(url, {}, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      });
      console.log('✅ [Auth] response:', JSON.stringify(res.data, null, 2));
      const token = res.data?.data?.accessToken;
      if (!token) throw new Error('accessToken 누락');
      return token;
    } catch (err) {
      attempt++;
      const wait = 500 * Math.pow(2, attempt - 1);
      console.warn(`⚠️ [Auth] 실패 시도 ${attempt}/${maxAttempts}`, { message: err.message, status: err.response?.status });
      if (attempt >= maxAttempts) {
        const apiMsg = err.response?.data?.header?.msg || err.message;
        throw new Error(`Fassto 인증 실패 after ${attempt} attempts: ${apiMsg}`);
      }
      await sleep(wait);
    }
  }
}

exports.fasstoDataFetcher = async (req, res) => {
  const traceId = uuidv4();
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  } else {
    res.set('Access-Control-Allow-Origin', 'null');
  }
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).send('');

  try {
    console.log(`[${traceId}] payload received`, JSON.stringify(req.body, null, 2));
    const { spreadsheetId, sheetName, startDate, endDate } = req.body || {};
    if (!spreadsheetId || !sheetName) {
      return res.status(400).json({
        traceId,
        status: 'error',
        message: 'spreadsheetId 또는 sheetName이 누락되었습니다.',
        received: { spreadsheetId, sheetName },
      });
    }
    if (typeof sheetName !== 'string' || sheetName.length > 100) {
      return res.status(400).json({ traceId, status: 'error', message: 'sheetName이 비정상적입니다.' });
    }

    const start = isValidDateFormat(startDate) ? startDate : getTodayAESTDate();
    const end = isValidDateFormat(endDate) ? endDate : getTodayAESTDate();
    const usedFallbackDates = (!isValidDateFormat(startDate) || !isValidDateFormat(endDate));

    const token = await getAccessToken();

    // Delivery API 재시도 간단 구현
    const deliveryUrl = `${BASE_URL}/api/v1/delivery/${API_CD}/${start}/${end}/ALL/1`;
    let deliveryRes;
    let attempt = 0;
    const maxDeliveryAttempts = 2;
    while (attempt < maxDeliveryAttempts) {
      try {
        attempt++;
        deliveryRes = await axios.get(deliveryUrl, {
          headers: { accessToken: token, 'Content-Type': 'application/json' },
          timeout: 15000,
        });
        break;
      } catch (err) {
        console.warn(`[${traceId}] [Delivery] 실패 시도 ${attempt}`, { status: err.response?.status, message: err.message });
        if (attempt >= maxDeliveryAttempts) {
          throw new Error(`Fassto 배송 조회 실패: ${err.message}`);
        }
        await sleep(300 * attempt);
      }
    }
    console.log(`[${traceId}] Delivery API response`, JSON.stringify(deliveryRes.data, null, 2));
    const items = Array.isArray(deliveryRes.data?.data) ? deliveryRes.data.data : [];
    if (items.length === 0) {
      return res.status(200).json({
        traceId,
        status: 'info',
        message: 'Fassto 데이터가 없습니다.',
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
    const safeRange = sheetName.includes('!') ? sheetName : `${sheetName}!A:D`;

    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: safeRange,
        valueInputOption: 'RAW',
        resource: { values: rows },
      });
    } catch (sheetErr) {
      console.error(`[${traceId}] Sheets append 실패`, {
        error: sheetErr.message,
        spreadsheetId,
        range: safeRange,
        rowCount: rows.length,
      });
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
      message: `출고 데이터 ${rows.length}건 기록 완료`,
      count: rows.length,
      spreadsheetId,
      range: safeRange,
      usedFallbackDates,
    });
  } catch (err) {
    console.error('전체 처리 실패:', err);
    return res.status(500).json({
      status: 'error',
      message: err.message,
      raw: err.response?.data,
    });
  }
};
