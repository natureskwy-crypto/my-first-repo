const axios = require('axios');
const { google } = require('googleapis');

const API_CD = process.env.API_CD;
const API_KEY = process.env.API_KEY;
const BASE_URL = 'https://fmsapi.fassto.ai';

// 환경변수 체크
if (!API_CD || !API_KEY) {
  console.error('❌ API_CD 또는 API_KEY가 설정되지 않았습니다.');
  throw new Error('환경변수(API_CD/API_KEY)가 누락되었습니다.');
}

// Google Sheets client (재사용)
const auth = new google.auth.GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

// Helpers
function getTodayAESTDate() {
  const now = new Date();
  const aestOffsetMs = 10 * 60 * 60000; // UTC+10
  return new Date(now.getTime() + aestOffsetMs).toISOString().slice(0, 10);
}
function isValidDateFormat(dateStr) {
  return typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

async function getAccessToken() {
  const url = `${BASE_URL}/api/v1/auth/connect?apiCd=${API_CD}&apiKey=${API_KEY}`;
  try {
    // 일부 API는 빈 body를 요구할 수 있으니 {}로 보내고 Content-Type 명시
    const res = await axios.post(url, {}, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    });
    console.log('✅ Auth response:', JSON.stringify(res.data, null, 2));
    const token = res.data?.data?.accessToken;
    if (!token) {
      throw new Error('응답에 accessToken이 없습니다.');
    }
    return token;
  } catch (err) {
    console.error('❌ getAccessToken 실패:', {
      status: err.response?.status,
      data: err.response?.data,
      message: err.message,
    });
    const apiMsg = err.response?.data?.header?.msg || err.message;
    const statusCode = err.response?.status || 'N/A';
    throw new Error(`Fassto 인증 실패 (HTTP ${statusCode}): ${apiMsg}`);
  }
}

exports.fasstoDataFetcher = async (req, res) => {
  // CORS: Apps Script 쓰는 경우 두 도메인 허용해주면 안전
  const allowedOrigins = ['https://script.google.com', 'https://script.googleusercontent.com'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  } else {
    res.set('Access-Control-Allow-Origin', '*'); // 필요시 제한
  }
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  try {
    // Payload 로그 (디버깅용)
    console.log('▶ Payload received:', JSON.stringify(req.body, null, 2));
    const { spreadsheetId, sheetName, startDate, endDate } = req.body || {};

    if (!spreadsheetId || !sheetName) {
      return res.status(400).json({
        status: 'error',
        message: 'spreadsheetId 또는 sheetName이 누락되었습니다.',
        received: { spreadsheetId, sheetName },
      });
    }

    // 날짜 결정
    const start = isValidDateFormat(startDate) ? startDate : getTodayAESTDate();
    const end = isValidDateFormat(endDate) ? endDate : getTodayAESTDate();
    const usedFallback = (!isValidDateFormat(startDate) || !isValidDateFormat(endDate));

    // 인증
    const token = await getAccessToken();

    // 배송 데이터 조회
    const deliveryUrl = `${BASE_URL}/api/v1/delivery/${API_CD}/${start}/${end}/ALL/1`;
    console.log('📡 Delivery API URL:', deliveryUrl);
    const deliveryRes = await axios.get(deliveryUrl, {
      headers: {
        accessToken: token,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });
    console.log('✅ Delivery API response:', JSON.stringify(deliveryRes.data, null, 2));

    const items = Array.isArray(deliveryRes.data?.data) ? deliveryRes.data.data : [];

    if (items.length === 0) {
      return res.status(200).json({
        status: 'info',
        message: 'Fassto 데이터가 없습니다.',
        count: 0,
        usedFallbackDates: usedFallback,
        deliveryRaw: deliveryRes.data,
      });
    }

    // Rows 구성
    const rows = items.map(item => [
      new Date().toISOString(),
      item.outDlvNo || item.trackingNo || '',
      item.custNm || item.receiverName || '',
      item.status || '',
    ]);

    // Range 방어
    const safeRange = sheetName.includes('!') ? sheetName : `${sheetName}!A:D`;

    // Google Sheets 기록
    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: safeRange,
        valueInputOption: 'RAW',
        resource: { values: rows },
      });
    } catch (sheetErr) {
      console.error('❌ Sheets append 실패:', {
        error: sheetErr.message,
        spreadsheetId,
        range: safeRange,
        rowCount: rows.length,
      });
      return res.status(500).json({
        status: 'error',
        message: 'Google Sheets 기록 실패',
        error: sheetErr.message,
      });
    }

    return res.status(200).json({
      status: 'success',
      message: `출고 데이터 ${rows.length}건 기록 완료`,
      count: rows.length,
      spreadsheetId,
      range: safeRange,
      usedFallbackDates: usedFallback,
    });
  } catch (err) {
    console.error('❌ 전체 처리 실패:', err);
    return res.status(500).json({
      status: 'error',
      message: err.message,
      raw: err.response?.data,
    });
  }
};
