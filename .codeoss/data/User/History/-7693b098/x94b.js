const axios = require('axios');
const { google } = require('googleapis');

// --- 환경변수 로딩 ---
const API_CD = process.env.API_CD;
const API_KEY = process.env.API_KEY;
const BASE_URL = 'https://fmsapi.fassto.ai';

if (!API_CD || !API_KEY) {
  const errorMessage = "❌ 환경변수(API_CD 또는 API_KEY)가 설정되지 않았습니다.";
  console.error(errorMessage);
  throw new Error(errorMessage);
}

// --- Google Sheets API 클라이언트 설정 ---
const sheets = google.sheets({
  version: 'v4',
  auth: new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  }),
});

/**
 * 액세스 토큰 가져오기
 */
async function getAccessToken() {
  const url = `${BASE_URL}/api/v1/auth/connect?apiCd=${API_CD}&apiKey=${API_KEY}`;

  try {
    const res = await axios.post(url);
    console.log('✅ 액세스 토큰 응답:', JSON.stringify(res.data, null, 2));

    const token = res.data?.data?.accessToken;
    if (!token) {
      throw new Error('Fassto 응답에 accessToken 없음');
    }
    return token;

  } catch (err) {
    console.error('❌ 액세스 토큰 오류:', err?.response?.data || err.message);
    throw new Error(`Fassto 인증 실패: ${err?.response?.data?.header?.msg || err.message}`);
  }
}

/**
 * 메인 함수
 */
exports.fasstoDataFetcher = async (req, res) => {
  // CORS 설정
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
    const { spreadsheetId, sheetName, startDate, endDate } = req.body || {};

    if (!spreadsheetId || !sheetName) {
      return res.status(400).send({ status: 'error', message: 'spreadsheetId 또는 sheetName이 누락되었습니다.' });
    }

    const today = new Date().toISOString().slice(0, 10);
    const start = startDate || today;
    const end = endDate || today;

    const token = await getAccessToken();

    const deliveryUrl = `${BASE_URL}/api/v1/delivery/${API_CD}/${start}/${end}/ALL/1`;

    const deliveryRes = await axios.get(deliveryUrl, {
      headers: {
        accessToken: token,
        'Content-Type': 'application/json',
      },
    });

    const deliveryData = deliveryRes.data?.data;
    console.log('📦 Fassto 배송 응답:', JSON.stringify(deliveryRes.data, null, 2));

    if (!Array.isArray(deliveryData)) {
      return res.status(200).send({
        status: 'warning',
        message: '데이터가 배열이 아닙니다.',
        rawResponse: deliveryRes.data,
      });
    }

    const rows = deliveryData.map(item => [
      new Date().toISOString(), // 타임스탬프
      item.outDlvNo || item.trackingNo || '',
      item.custNm || item.receiverName || '',
      item.status || '',
    ]);

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: sheetName,
      valueInputOption: 'RAW',
      resource: { values: rows },
    });

    console.log('✅ Google Sheet 기록 완료');
    return res.status(200).send({ status: 'success', message: '스프레드시트에 기록 완료' });

  } catch (err) {
    console.error('❌ 전체 처리 오류:', err?.response?.data || err.message);
    return res.status(500).send({
      status: 'error',
      message: 'Cloud Function 실행 중 오류: ' + (err?.response?.data?.header?.msg || err.message),
    });
  }
};
