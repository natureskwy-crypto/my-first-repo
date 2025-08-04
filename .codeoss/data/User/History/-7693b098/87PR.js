/**
 * @fileoverview Fassto API 게이트웨이 역할을 하는 Google Cloud Function
 * @version 3.0.0
 * @description Apps Script에서 API 경로와 파라미터를 동적으로 받아 처리합니다.
 */

const axios = require('axios');
const { google } = require('googleapis');

// --- 기본 설정 ---
const FASSTO_API_BASE_URL = 'https://fmsapi.fassto.ai';
const ALLOWED_ORIGIN = 'https://script.google.com';

// --- 환경 변수 로드 (배포 시 반드시 설정) ---
const API_CD = process.env.API_CD;
const API_KEY = process.env.API_KEY;

if (!API_CD || !API_KEY) {
  const errorMsg = "환경 변수 API_CD 또는 API_KEY가 설정되지 않았습니다.";
  console.error("❌ FATAL: " + errorMsg);
  throw new Error(errorMsg);
}

// --- Google Sheets API 클라이언트 초기화 ---
const auth = new google.auth.GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

/**
 * Fassto API에서 Access Token을 발급받습니다. (캐싱 기능 추가 고려 가능)
 * @returns {Promise<string>} 발급된 Access Token
 */
async function getAccessToken() {
  const authUrl = `${FASSTO_API_BASE_URL}/api/v1/auth/connect?apiCd=${API_CD}&apiKey=${API_KEY}`;
  console.log("ℹ️ 인증 토큰 발급을 시도합니다...");
  try {
    const response = await axios.post(authUrl, {}, { headers: { 'Content-Type': 'application/json' } });
    const accessToken = response.data?.data?.accessToken;
    if (accessToken) {
      console.log("✅ 인증 토큰 발급 성공.");
      return accessToken;
    }
    throw new Error("Fassto API 응답에 accessToken 필드가 누락되었습니다.");
  } catch (error) {
    const status = error.response?.status || 'UNKNOWN';
    const fasstoMsg = error.response?.data?.header?.msg || error.message;
    console.error(`❌ 인증 토큰 발급 실패 (HTTP ${status}): ${fasstoMsg}`, error.response?.data);
    throw new Error(`Fassto 인증 실패 (HTTP ${status}): ${fasstoMsg}`);
  }
}

/**
 * 메인 핸들러 함수: Apps Script의 요청을 받아 Fassto API를 호출하고 결과를 시트에 기록합니다.
 */
exports.fasstoApiGateway = async (req, res) => {
  // CORS Preflight 요청 처리
  res.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Max-Age', '3600');
    return res.status(204).send('');
  }

  try {
    // 1. Apps Script에서 보낸 요청 파라미터 추출
    const {
      spreadsheetId,
      sheetName,
      apiPath, // 예: "/api/v1/delivery/{cstCd}/{start}/{end}/{status}/{outDiv}"
      pathParams, // 예: { cstCd: API_CD, start: '2025-07-01', ... }
      queryParams, // 예: { ordNo: '12345' }
      method = 'GET', // 기본값 GET
    } = req.body || {};

    console.log("ℹ️ Cloud Function 실행 시작. 요청 Body:", JSON.stringify(req.body, null, 2));

    if (!spreadsheetId || !sheetName || !apiPath) {
      return res.status(400).json({ status: 'error', message: '필수 파라미터 (spreadsheetId, sheetName, apiPath) 누락.' });
    }

    // 2. 인증 토큰 발급
    const accessToken = await getAccessToken();

    // 3. 동적으로 API URL 생성
    let finalPath = apiPath;
    // URL 경로의 {placeholder}를 실제 값으로 교체
    if (pathParams) {
      for (const key in pathParams) {
        finalPath = finalPath.replace(`{${key}}`, encodeURIComponent(pathParams[key]));
      }
    }
    
    const requestUrl = new URL(FASSTO_API_BASE_URL + finalPath);
    
    // 쿼리 파라미터 추가
    if (queryParams) {
      for (const key in queryParams) {
        requestUrl.searchParams.append(key, queryParams[key]);
      }
    }

    console.log(`ℹ️ Fassto API 요청 실행...`, { method, url: requestUrl.href });

    // 4. Fassto API 호출
    const apiResponse = await axios({
      method: method.toLowerCase(),
      url: requestUrl.href,
      headers: {
        'accessToken': accessToken,
        'Content-Type': 'application/json',
      },
    });

    const items = apiResponse.data?.data || [];
    console.log(`✅ Fassto 데이터 수신 성공. 아이템 ${items.length}개.`);

    if (items.length === 0) {
      return res.status(200).json({ status: 'success', message: 'API에서 반환된 데이터가 없습니다.', count: 0 });
    }

    // 5. Google Sheets에 기록 (가장 일반적인 형태의 데이터로 가정)
    // 첫 번째 데이터의 키들을 헤더로 사용
    const headers = Object.keys(items[0]);
    const values = items.map(item => headers.map(header => {
        const value = item[header];
        // 객체나 배열이면 JSON 문자열로 변환
        if (typeof value === 'object' && value !== null) {
            return JSON.stringify(value);
        }
        return value;
    }));

    // 헤더와 값을 합쳐서 시트에 기록
    const sheetData = [headers, ...values];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1`, // A1 셀부터 덮어쓰기
      valueInputOption: 'RAW',
      resource: { values: sheetData },
    });

    console.log(`✅ 성공! ${items.length}개의 데이터를 스프레드시트에 기록했습니다.`);
    return res.status(200).json({
      status: 'success',
      message: `Fassto 데이터 ${items.length}개 기록 성공`,
      count: items.length,
    });

  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.header?.msg || error.message;
    console.error(`❌ Cloud Function 실행 중 오류 발생 (HTTP ${status}): ${message}`, {
      errorMessage: error.message,
      fullError: error.response?.data || error.stack,
    });
    return res.status(status).json({
      status: 'error',
      message: `Cloud Function 내부 오류: ${message}`,
      rawError: error.response?.data,
    });
  }
};
