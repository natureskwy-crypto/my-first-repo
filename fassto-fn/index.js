/**
 * @fileoverview Fassto API 게이트웨이 역할을 하는 Google Cloud Function
 * @version 3.5.0
 * @description 요청에 따라 '종합 주문 내역' 또는 '재고 현황' 등 맞춤형 데이터를 생성하여 반환합니다. '주문일시', '발송일시'를 표시하도록 수정되었습니다.
 */

const axios = require('axios');
const { google } = require('googleapis');

// --- 기본 설정 ---
const FASSTO_API_BASE_URL = 'https://fmsapi.fassto.ai';
const ALLOWED_ORIGIN = 'https://script.google.com';

// --- 환경 변수 로드 (배포 시 반드시 설정) ---
const API_CD = process.env.API_CD;
const API_KEY = process.env.API_KEY;
// 파스토에서 받은 '고객사코드'를 위한 새로운 환경 변수
const CST_CD = process.env.CST_CD; 

if (!API_CD || !API_KEY || !CST_CD) {
  const errorMsg = "환경 변수 API_CD, API_KEY 또는 CST_CD가 설정되지 않았습니다.";
  console.error("❌ FATAL: " + errorMsg);
  throw new Error(errorMsg);
}

// --- Google Sheets API 클라이언트 초기화 ---
const auth = new google.auth.GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

/**
 * Fassto API에서 Access Token을 발급받습니다.
 * @returns {Promise<string>} 발급된 Access Token
 */
async function getAccessToken() {
  // 인증 토큰 발급 시에는 apiCd와 apiKey를 사용합니다.
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
 * 메인 핸들러 함수: Apps Script의 요청을 받아 Fassto API를 호출하고 결과를 반환합니다.
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
    const {
      apiPath,
      pathParams = {},
      queryParams = {},
      method = 'GET',
      reportType // 'COMBINED_ORDER_REPORT' 또는 'STOCK_REPORT'
    } = req.body || {};

    console.log("ℹ️ Cloud Function 실행 시작. 요청 Body:", JSON.stringify(req.body, null, 2));

    if (!apiPath) {
      return res.status(400).json({ status: 'error', message: '필수 파라미터 (apiPath) 누락.' });
    }

    const accessToken = await getAccessToken();

    // cstCd 파라미터가 필요한 경우, API_CD 대신 CST_CD 환경 변수를 사용합니다.
    // 기존 코드: pathParams.cstCd = API_CD;
    // 수정 코드:
    if (apiPath.includes('{cstCd}')) {
        pathParams.cstCd = CST_CD;
    }

    let finalPath = apiPath;
    for (const key in pathParams) {
      finalPath = finalPath.replace(`{${key}}`, encodeURIComponent(pathParams[key]));
    }
    
    const requestUrl = new URL(FASSTO_API_BASE_URL + finalPath);
    for (const key in queryParams) {
      requestUrl.searchParams.append(key, queryParams[key]);
    }

    console.log(`ℹ️ Fassto API 요청 실행...`, { method, url: requestUrl.href });

    const apiResponse = await axios({
      method: method.toLowerCase(),
      url: requestUrl.href,
      headers: { 'accessToken': accessToken, 'Content-Type': 'application/json' },
    });

    const items = apiResponse.data?.data || [];
    console.log(`✅ Fassto 데이터 수신 성공. 아이템 ${items.length}개.`);

    if (items.length === 0) {
      return res.status(200).json({ status: 'success', message: 'API에서 반환된 데이터가 없습니다.', data: [] });
    }

    // --- 요청 유형에 따라 데이터 가공 ---
    let processedData;

    if (reportType === 'COMBINED_ORDER_REPORT') {
      // '종합 주문 내역'을 위한 데이터 가공
      processedData = items.map(item => ({
        // API 응답의 packDt를 '주문일시'와 '발송일시'로 사용합니다.
        '주문일시': item.packDt || '',
        '발송일시': item.packDt || '',
        '운송장번호': item.invoiceNo || '',
        '주문자 성함': item.custNm || '',
        '주문자 전화번호': item.custTelNo || '',
        '주문자 주소': item.custAddr || '',
        '상품명': item.godNm || '',
        '주문 수량': item.packQty || 0,
      }));
    } else {
      // 그 외의 경우, 원본 데이터를 그대로 반환
      processedData = items;
    }
    
    console.log(`✅ 성공! ${processedData.length}개의 데이터를 가공했습니다.`);
    return res.status(200).json({
      status: 'success',
      message: `Fassto 데이터 ${processedData.length}개 처리 성공`,
      data: processedData,
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