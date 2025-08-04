const axios = require('axios');
const { google } = require('googleapis');

const API_CD = process.env.API_CD;
const API_KEY = process.env.API_KEY;
const BASE_URL = 'https://fmsapi.fassto.ai';

if (!API_CD || !API_KEY) {
  console.error("❌ API_CD 또는 API_KEY 환경변수가 없습니다.");
  throw new Error("API 환경변수가 누락되었습니다.");
}

const sheets = google.sheets({
  version: 'v4',
  auth: new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  }),
});

async function getAccessToken() {
  const url = `${BASE_URL}/api/v1/auth/connect?apiCd=${API_CD}&apiKey=${API_KEY}`;
  try {
    const res = await axios.post(url);
    console.log('✅ 인증 성공:', JSON.stringify(res.data, null, 2));
    const token = res.data?.data?.accessToken;
    if (!token) throw new Error('응답에 accessToken 없음');
    return token;
  } catch (err) {
    console.error('❌ 인증 오류:', err?.response?.data || err.message);
    throw new Error('Access Token 가져오기 실패');
  }
}

exports.fasstoDataFetcher = async (req, res) => {
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
      return res.status(400).send({ status: 'error', message: 'spreadsheetId 또는 sheetName 누락됨' });
    }

    const today = new Date().toISOString().slice(0, 10);
    const start = startDate || today;
    const end = endDate || today;

    const token = await getAccessToken();
    const url = `${BASE_URL}/api/v1/delivery/${API_CD}/${start}/${end}/ALL/1`;

    const response = await axios.get(url, {
      headers: {
        accessToken: token,
        'Content-Type': 'application/json',
      },
    });

    const items = response.data?.data;
    if (!Array.isArray(items)) {
      return res.status(200).send({ status: 'warning', message: '데이터 없음', raw: response.data });
    }

    const rows = items.map(item => [
      new Date().toISOString(),
      item.trackingNo || item.outDlvNo || '',
      item.receiverName || item.custNm || '',
      item.itemList?.[0]?.itemNm || '',
      item.status || ''
    ]);

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: sheetName,
      valueInputOption: 'RAW',
      resource: { values: rows },
    });

    res.status(200).send({ status: 'success', message: '스프레드시트 기록 완료' });

  } catch (err) {
    console.error('❌ 처리 실패:', err);
    res.status(500).send({ status: 'error', message: err.message });
  }
};
