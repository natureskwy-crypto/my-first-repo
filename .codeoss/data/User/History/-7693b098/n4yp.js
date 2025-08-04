/**
 * @fileoverview Fassto API에서 데이터를 가져와 Google Sheets에 기록하는 Google Cloud Function
 * @version 2.4.0 (Test with fixed date)
 */

const axios = require('axios');
const { google } = require('googleapis');

const FASSTO_API_BASE_URL = 'https://fmsapi.fassto.ai';
const ALLOWED_ORIGIN = 'https://script.google.com';

const API_CD = process.env.API_CD;
const API_KEY = process.env.API_KEY;

if (!API_CD || !API_KEY) {
  const errorMsg = "환경 변수 API_CD 또는 API_KEY가 설정되지 않았습니다.";
  console.error("❌ FATAL: " + errorMsg);
  throw new Error(errorMsg);
}

const auth = new google.auth.GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

async function getAccessToken() {
  const authUrl = `${FASSTO_API_BASE_URL}/api/v1/auth/connect?apiCd=${API_CD}&apiKey=${API_KEY}`;
  console.log("ℹ️ [1/4] Fassto 인증 토큰 발급 시도...");
  try {
    const response = await axios.post(authUrl, {}, { headers: { 'Content-Type': 'application/json' } });
    const accessToken = response.data?.data?.accessToken;
    if (accessToken) {
      console.log("✅ [1/4] Fassto 인증 토큰 발급 성공.");
      return accessToken;
    } else {
      throw new Error("Fassto API 응답에 accessToken 필드가 누락되었습니다.");
    }
  } catch (error) {
    console.error("❌ [1/4] Fassto 인증 토큰 발급 실패!", {
        message: error.message,
        responseStatus: error.response?.status,
        responseData: error.response?.data,
    });
    const status = error.response?.status || 'UNKNOWN';
    const fasstoMsg = error.response?.data?.header?.msg || error.message;
    throw new Error(`Fassto 인증 실패 (HTTP ${status}): ${fasstoMsg}`);
  }
}

exports.fasstoDataFetcher = async (req, res) => {
  res.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Max-Age', '3600');
    return res.status(204).send('');
  }

  try {
    console.log("ℹ️ Cloud Function 실행 시작. 요청 Body:", JSON.stringify(req.body, null, 2));
    const { spreadsheetId, sheetName } = req.body || {};
    if (!spreadsheetId || !sheetName) {
      return res.status(400).json({ status: 'error', message: '필수 파라미터 (spreadsheetId, sheetName) 누락.' });
    }

    const accessToken = await getAccessToken();

    // --- 테스트를 위해 날짜를 어제로 고정 ---
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstNow = new Date(now.getTime() + kstOffset);
    const yesterday = new Date(kstNow.getTime() - 24 * 60 * 60 * 1000);
    const testDate = yesterday.toISOString().slice(0, 10);

    console.log(`[TESTING] 날짜를 어제(${testDate})로 고정하여 테스트합니다.`);
    const start = testDate;
    const end = testDate;
    // --- 테스트 코드 끝 ---

    const deliveryUrl = `${FASSTO_API_BASE_URL}/api/v1/delivery/${API_CD}/${start}/${end}/ALL/1`;

    console.log(`ℹ️ [2/4] Fassto 출고 데이터를 요청합니다: ${deliveryUrl}`);
    const response = await axios.get(deliveryUrl, {
      headers: { 'accessToken': accessToken, 'Content-Type': 'application/json' }
    });

    const items = response.data?.data || [];
    console.log(`✅ [2/4] Fassto 데이터 수신 성공. 아이템 ${items.length}개.`);

    if (items.length === 0) {
      return res.status(200).json({ status: 'success', message: '가져올 데이터가 없습니다.', count: 0 });
    }

    console.log("ℹ️ [3/4] Google Sheets에 기록할 데이터를 준비합니다...");
    const rows = items.map(item => [
      new Date().toISOString(),
      item.outDlvNo || item.trackingNo || '',
      item.custNm || item.receiverName || '',
      item.itemList?.[0]?.itemNm || '',
      item.status || ''
    ]);

    const range = `${sheetName}!A:E`;
    console.log(`ℹ️ [4/4] Google Sheets에 데이터를 기록합니다.`);
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'RAW',
      resource: { values: rows },
    });

    console.log(`✅ [4/4] 성공! ${rows.length}개의 데이터를 스프레드시트에 기록했습니다.`);
    return res.status(200).json({
      status: 'success',
      message: `Fassto 출고 데이터 ${rows.length}개 기록 성공`,
      count: rows.length,
    });

  } catch (error) {
    console.error("❌ Cloud Function 실행 중 심각한 오류 발생:", {
        errorMessage: error.message,
        errorStack: error.stack,
        axiosRequestConfig: error.config,
        fullError: error
    });
    return res.status(500).json({
      status: 'error',
      message: `Cloud Function 내부 오류: ${error.message}`,
    });
  }
};