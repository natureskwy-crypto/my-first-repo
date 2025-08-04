const axios = require('axios');
const { google } = require('googleapis');

// 환경 변수
const API_CD = process.env.API_CD;
const API_KEY = process.env.API_KEY;
const BASE_URL = 'https://fmsapi.fassto.ai';

if (!API_CD || !API_KEY) {
  const msg = '❌ API_CD 또는 API_KEY 환경변수가 설정되지 않았습니다.';
  console.error(msg);
  throw new Error(msg);
}

// Google Sheets API 클라이언트
const sheets = google.sheets({
  version: 'v4',
  auth: new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  }),
});

// AEST 기준 오늘 날짜 (YYYY-MM-DD)
function getTodayAESTDate() {
  const now = new Date();
  const offsetMs = 10 * 60 * 60000; // UTC+10
  const aestDate = new Date(now.getTime() + offsetMs);
  return aestDate.toISOString().slice(0, 10);
}

// 날짜 유효성 검사
function isValidDateFormat(dateStr) {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

// 필드 우선순위 기반 데이터 추출
function extractField(obj, keys) {
  return keys.map(k => obj[k]).find(v => !!v) || '';
}

// Fassto API 토큰 요청
async function getAccessToken() {
  const url = `${BASE_URL}/api/v1/auth/connect?apiCd=${API_CD}&apiKey=${API_KEY}`;
  try {
    const res = await axios.post(url);
    const token = res.data?.data?.accessToken;
    if (!token) throw new Error('응답에 accessToken 없음');
    console.log('✅ 인증 성공 (토큰은 생략)');
    return token;
  } catch (err) {
    console.error('❌ 인증 실패:', err?.response?.data || err.message);
    throw new Error(`Fassto 인증 실패: ${err?.response?.data?.header?.msg || err.message}`);
  }
}

// 클라우드 함수
exports.fasstoDataFetcher = async (req, res) => {
  const ALLOWED_ORIGIN = 'https://script.google.com';

  // CORS 사전 요청 처리
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Max-Age', '3600');
    return res.status(204).send('');
  }

  res.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN);

  try {
    const { spreadsheetId, sheetName, startDate, endDate } = req.body || {};

    if (!spreadsheetId || !sheetName) {
      return res.status(400).send({ status: 'error', message: 'spreadsheetId 또는 sheetName이 누락되었습니다.' });
    }

    // 날짜 유효성 검사
    const today = getTodayAESTDate();
    const start = startDate || today;
    const end = endDate || today;

    if (!isValidDateFormat(start) || !isValidDateFormat(end)) {
      return res.status(400).send({
        status: 'error',
        message: '날짜 형식은 YYYY-MM-DD 여야 합니다.',
      });
    }

    // 인증 토큰
    const token = await getAccessToken();

    // 배송 데이터 요청
    const deliveryUrl = `${BASE_URL}/api/v1/delivery/${API_CD}/${start}/${end}/ALL/1`;
    const deliveryRes = await axios.get(deliveryUrl, {
      headers: {
        accessToken: token,
        'Content-Type': 'application/json',
      },
    });

    const deliveryData = deliveryRes.data?.data;
    if (!Array.isArray(deliveryData)) {
      return res.status(200).send({
        status: 'warning',
        message: 'Fassto 응답에 배열 형식의 데이터가 없습니다.',
        rawResponse: deliveryRes.data,
      });
    }

    // 응답 필드 매핑
    const FIELD_MAP = {
      trackingNumber: ['outDlvNo', 'trackingNo'],
      customerName: ['custNm', 'receiverName'],
      status: ['status'],
    };

    // 시트에 기록할 행 구성
    const rows = deliveryData.map(item => [
      new Date().toISOString(),
      extractField(item, FIELD_MAP.trackingNumber),
      extractField(item, FIELD_MAP.customerName),
      extractField(item, FIELD_MAP.status),
    ]);

    // 시트 기록
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:D`,
      valueInputOption: 'RAW',
      resource: { values: rows },
    });

    console.log('✅ 스프레드시트 기록 성공');
    return res.status(200).send({
      status: 'success',
      message: 'Fassto 출고 데이터가 성공적으로 저장되었습니다.',
      count: rows.length,
    });

  } catch (err) {
    const status = err.response?.status || 500;
    const msg = err.message || '알 수 없는 오류';
    const body = JSON.stringify(err.response?.data || {}, null, 2);

    console.error('❌ 처리 중 오류:', msg);
    console.error('응답 본문:', body);

    return res.status(500).send({
      status: 'error',
      message: `Cloud Function 오류: ${msg}`,
      details: body,
    });
  }
};
