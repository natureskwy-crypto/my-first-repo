/**
 * @fileoverview Fassto API에서 데이터를 가져와 Google Sheets에 기록하는 Google Cloud Function
 * @version 2.3.0
 * @description 오류 추적을 위한 상세 로깅 기능이 대폭 강화되었습니다.
 */

const axios = require('axios');
const { google } = require('googleapis');

// --- Configuration ---
const FASSTO_API_BASE_URL = 'https://fmsapi.fassto.ai';
const ALLOWED_ORIGIN = 'https://script.google.com'; // CORS 허용 출처

// 🚨 중요: 아래 두 값은 Cloud Function 배포 시 '환경 변수'로 반드시 설정해야 합니다.
const API_CD = process.env.API_CD;
const API_KEY = process.env.API_KEY;

// 함수 시작 시 환경 변수 유효성 검사
if (!API_CD || !API_KEY) {
  const errorMsg = "환경 변수 API_CD 또는 API_KEY가 설정되지 않았습니다. 함수 배포 설정을 확인하세요.";
  console.error("❌ FATAL: " + errorMsg);
  throw new Error(errorMsg);
}

/**
 * Google Sheets API 인증을 설정합니다. (함수 핸들러 외부에서 한번만 실행)
 */
const auth = new google.auth.GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });


/**
 * Fassto API에서 Access Token을 발급받습니다.
 * @returns {Promise<string>} 발급된 Access Token
 * @throws {Error} 토큰 발급 실패 시
 */
async function getAccessToken() {
  const authUrl = `${FASSTO_API_BASE_URL}/api/v1/auth/connect?apiCd=${API_CD}&apiKey=${API_KEY}`;
  console.log("ℹ️ [1/4] Fassto 인증 토큰 발급을 시도합니다...");

  try {
    // ❗ 중요: POST 요청 시 반드시 비어있는 객체 '{}'를 body로 전달해야 합니다.
    const response = await axios.post(authUrl, {}, {
      headers: { 'Content-Type': 'application/json' }
    });

    const accessToken = response.data?.data?.accessToken;

    if (accessToken) {
      console.log("✅ [1/4] Fassto 인증 토큰 발급 성공.");
      return accessToken;
    } else {
      console.error("❌ [1/4] Fassto 응답에 accessToken이 없습니다. 응답 전문:", JSON.stringify(response.data, null, 2));
      throw new Error("Fassto API 응답에 accessToken 필드가 누락되었습니다.");
    }
  } catch (error) {
    console.error("❌ [1/4] Fassto 인증 토큰 발급 실패!", {
        message: error.message,
        url: authUrl,
        responseStatus: error.response?.status,
        responseData: error.response?.data,
    });
    // Apps Script로 더 명확한 에러 메시지 전달
    const status = error.response?.status || 'UNKNOWN';
    const fasstoMsg = error.response?.data?.header?.msg || error.message;
    throw new Error(`Fassto 인증 실패 (HTTP ${status}): ${fasstoMsg}`);
  }
}

/**
 * Cloud Function의 메인 핸들러 함수
 * @param {import('express').Request} req HTTP 요청 객체
 * @param {import('express').Response} res HTTP 응답 객체
 */
exports.fasstoDataFetcher = async (req, res) => {
  // --- CORS Preflight 요청 처리 ---
  res.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Max-Age', '3600');
    return res.status(204).send('');
  }

  // --- 메인 로직 실행 ---
  try {
    console.log("ℹ️ Cloud Function 실행 시작. 요청 Body:", JSON.stringify(req.body, null, 2));

    const { spreadsheetId, sheetName, startDate, endDate } = req.body || {};
    if (!spreadsheetId || !sheetName) {
      console.error("❌ 필수 파라미터 누락 (spreadsheetId 또는 sheetName).");
      return res.status(400).json({
        status: 'error',
        message: '필수 파라미터 (spreadsheetId, sheetName)가 요청에 포함되지 않았습니다.',
      });
    }

    // 1. Fassto Access Token 받기
    const accessToken = await getAccessToken();

    // 2. Fassto API로 출고 데이터 요청
    const today = new Date(new Date().getTime() + 10 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const start = /^\d{4}-\d{2}-\d{2}$/.test(startDate) ? startDate : today;
    const end = /^\d{4}-\d{2}-\d{2}$/.test(endDate) ? endDate : today;
    const deliveryUrl = `${FASSTO_API_BASE_URL}/api/v1/delivery/${API_CD}/${start}/${end}/ALL/1`;

    console.log(`ℹ️ [2/4] Fassto 출고 데이터를 요청합니다... (기간: ${start} ~ ${end})`);
    const response = await axios.get(deliveryUrl, {
      headers: { 'accessToken': accessToken, 'Content-Type': 'application/json' }
    });

    const items = response.data?.data || [];
    console.log(`✅ [2/4] Fassto 데이터 수신 성공. 아이템 ${items.length}개.`);

    if (items.length === 0) {
      return res.status(200).json({ status: 'success', message: '가져올 데이터가 없습니다.', count: 0 });
    }

    // 3. Google Sheets에 쓸 데이터 포맷으로 변경
    console.log("ℹ️ [3/4] Google Sheets에 기록할 데이터를 준비합니다...");
    const rows = items.map(item => [
      new Date().toISOString(),
      item.outDlvNo || item.trackingNo || '', // 출고 운송장 번호
      item.custNm || item.receiverName || '', // 고객명
      item.itemList?.[0]?.itemNm || '', // 품목명 (첫번째)
      item.status || '' // 배송 상태
    ]);

    // 4. Google Sheets에 데이터 추가
    const range = `${sheetName}!A:E`;
    console.log(`ℹ️ [4/4] Google Sheets에 데이터를 기록합니다. (ID: ${spreadsheetId}, Range: ${range})`);
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
    // --- 최종 에러 처리 ---
    console.error("❌ Cloud Function 실행 중 심각한 오류 발생:", {
        errorMessage: error.message,
        errorStack: error.stack,
        axiosRequestConfig: error.config, // Axios 에러 시, 요청 정보 전체를 로그로 남김
        fullError: error
    });
    return res.status(500).json({
      status: 'error',
      message: `Cloud Function 내부 오류: ${error.message}`,
    });
  }
};