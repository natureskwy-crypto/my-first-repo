gcloud run deploy fasstoshippingfunction --source . --region asia-northeast3
gcloud compute networks vpc-access connectors create serverless-connector --network fassto-vpc --region asia-northeast3 --subnet fassto-subnet
gcloud compute networks vpc-access connectors create serverless-connector --network fassto-vpc --region asia-northeast3 --subnet fassto-subnet
gcloud compute networks vpc-access connectors create serverless-connector --network fassto-vpc --region asia-northeast3 --subnet fassto-subnet
gcloud compute networks vpc-access connectors create serverless-connector --network fassto-vpc --region asia-northeast3 --subnet fassto-subnet
gcloud compute networks vpc-access connectors create serverless-connector --network fassto-vpc --region asia-northeast3 --subnet fassto-subnet
gcloud compute networks vpc-access connectors create serverless-connector   --region asia-northeast3   --subnet fassto-subnet
gcloud compute networks subnets create fassto-serverless-subnet   --network=fassto-vpc   --region=asia-northeast3   --range=10.8.0.0/28
gcloud compute networks subnets create fassto-serverless-subnet   --network=fassto-vpc   --region=asia-northeast3   --range=10.8.0.0/28
gcloud compute networks vpc-access connectors create serverless-connector   --region=asia-northeast3   --subnet=fassto-serverless-subnet
gcloud compute addresses create fassto-static-ip   --region=asia-northeast3
gcloud compute routers create fassto-router   --network=fassto-vpc   --region=asia-northeast3
gcloud compute routers nats create fassto-nat   --router=fassto-router   --region=asia-northeast3   --nat-custom-subnet-ip-ranges=fassto-serverless-subnet   --nat-external-ip-pool=fassto-static-ip   --enable-endpoint-independent-mapping
gcloud compute routers nats delete fassto-nat   --router=fassto-router   --region=asia-northeast3
gcloud compute routers describe fassto-router   --region=asia-northeast3   --format="json"
gcloud compute routers list   --region=asia-northeast3
gcloud compute routers list   --region=asia-northeast3
gcloud compute routers list --filter="region:(asia-northeast3)"
gcloud compute routers describe [라우터이름]   --region=asia-northeast3   --format="json"
gcloud compute routers list --filter="region:(asia-northeast3)"
gcloud compute routers describe fassto-router-seoul   --region=asia-northeast3   --format="json"
gcloud compute routers nats delete fassto-nat   --router=fassto-router-seoul   --region=asia-northeast3
gcloud compute routers nats create fassto-nat   --router=fassto-router   --region=asia-northeast3   --nat-custom-subnet-ip-ranges=fassto-serverless-subnet   --nat-external-ip-pool=fassto-static-ip   --enable-endpoint-independent-mapping
gcloud compute networks vpc-access connectors create
gcloud compute networks vpc-access connectors create [CONNECTOR_NAME] --region=asia-northeast3 --network=[NETWORK_NAME] --range=[IP_RANGE]
gcloud functions deploy [YOUR_FUNCTION_NAME]   --gen2   --runtime=nodejs16   --region=[YOUR_REGION]   --source=.   --entry-point=fasstoDataFetcher   --trigger-http   --allow-unauthenticated   --vpc-connector=projects/[YOUR_PROJECT_ID]/locations/[YOUR_REGION]/connectors/[YOUR_VPC_CONNECTOR_NAME]   --egress-settings=all   --service-account=[YOUR_SERVICE_ACCOUNT_EMAIL]
gcloud functions deploy fassto-data-fetcher   --gen2   --runtime=nodejs16   --region=[YOUR_REGION]   --source=.   --entry-point=fasstoDataFetcher   --trigger-http   --allow-unauthenticated   --vpc-connector=projects/[YOUR_PROJECT_ID]/locations/[YOUR_REGION]/connectors/[YOUR_VPC_CONNECTOR_NAME]   --egress-settings=all   --service-account=[YOUR_SERVICE_ACCOUNT_EMAIL]
gcloud auth login
gcloud functions deploy fassto-data-fetcher   --gen2   --runtime=nodejs16   --region=[YOUR_REGION]   --source=.   --entry-point=fasstoDataFetcher   --trigger-http   --allow-unauthenticated   --vpc-connector=projects/[YOUR_PROJECT_ID]/locations/[YOUR_REGION]/connectors/[YOUR_VPC_CONNECTOR_NAME]   --egress-settings=all   --service-account=[YOUR_SERVICE_ACCOUNT_EMAIL]
gcloud config list
gcloud config set account [ACCOUNT_EMAIL]
gcloud projects describe fassto-467707 --format="value(projectNumber)"
gcloud functions deploy fassto-data-fetcher   --gen2   --runtime=nodejs16   --region=asia-northeast3   --source=.   --entry-point=fasstoDataFetcher   --trigger-http   --allow-unauthenticated   --vpc-connector=projects/fassto-467707/locations/asia-northeast3/connectors/[YOUR_VPC_CONNECTOR_NAME]   --egress-settings=all   --service-account=[YOUR_PROJECT_NUMBER]-compute@developer.gserviceaccount.com
YOUR_PROJECT_NUMBER
gcloud functions deploy fassto-data-fetcher \
gcloud projects describe fassto-467707 --format="value(projectNumber)"
gcloud functions deploy fassto-data-fetcher   --gen2   --runtime=nodejs16   --region=asia-northeast3   --source=.   --entry-point=fasstoDataFetcher   --trigger-http   --allow-unauthenticated   --vpc-connector=projects/fassto-467707/locations/asia-northeast3/connectors/serverless-connector2   --egress-settings=all   --service-account=86959409290-compute@developer.gserviceaccount.com
gcloud functions deploy fassto-data-fetcher   --gen2   --runtime=nodejs16   --region=asia-northeast3   --source=.   --entry-point=fasstoDataFetcher   --trigger-http   --allow-unauthenticated   --vpc-connector=projects/fassto-467707/locations/asia-northeast3/connectors/serverless-connector2   --egress-settings=all   --service-account=86959409290-compute@developer.gserviceaccount.com
gcloud functions deploy fassto-data-fetcher \ --gen2 \ --runtime=nodejs16 \ --region=asia-northeast3 \ --source=. \ --entry-point=fasstoDataFetcher \ --trigger-http \ --allow-unauthenticated \ --vpc-connector=projects/fassto-467707/locations/asia-northeast3/connectors/serverless-connector2 \ --egress-settings=all \ --service-account=86959409290-compute@developer.gserviceaccount.com
gcloud components update
sudo apt-get update && sudo apt-get --only-upgrade install google-cloud-cli-gke-gcloud-auth-plugin google-cloud-cli-kpt google-cloud-cli-minikube google-cloud-cli-local-extract google-cloud-cli-bigtable-emulator google-cloud-cli-pubsub-emulator google-cloud-cli-config-connector google-cloud-cli-firestore-emulator google-cloud-cli-app-engine-python google-cloud-cli-cbt google-cloud-cli-managed-flink-client google-cloud-cli-istioctl google-cloud-cli-app-engine-java google-cloud-cli-spanner-migration-tool google-cloud-cli-nomos google-cloud-cli google-cloud-cli-docker-credential-gcr google-cloud-cli-app-engine-python-extras google-cloud-cli-anthos-auth google-cloud-cli-cloud-build-local google-cloud-cli-log-streaming google-cloud-cli-run-compose google-cloud-cli-skaffold google-cloud-cli-datastore-emulator google-cloud-cli-cloud-run-proxy google-cloud-cli-kubectl-oidc google-cloud-cli-package-go-module google-cloud-cli-spanner-cli google-cloud-cli-enterprise-certificate-proxy kubectl google-cloud-cli-app-engine-grpc google-cloud-cli-anthoscli google-cloud-cli-terraform-tools google-cloud-cli-app-engine-go google-cloud-cli-spanner-emulator
gcloud functions deploy fassto-data-fetcher   --gen2   --runtime=nodejs16   --region=asia-northeast3   --source=.   --entry-point=fasstoDataFetcher   --trigger-http   --allow-unauthenticated   --vpc-connector=projects/fassto-467707/locations/asia-northeast3/connectors/serverless-connector2   --egress-settings=all   --service-account=86959409290-compute@developer.gserviceaccount.com
gcloud functions deploy fassto-data-fetcher   --gen2   --runtime=nodejs16   --region=asia-northeast3   --source=.   --entry-point=fasstoDataFetcher   --trigger-http   --allow-unauthenticated   --vpc-connector=projects/fassto-467707/locations/asia-northeast3/connectors/serverless-connector2   --egress-settings=all   --service-account=86959409290-compute@developer.gserviceaccount.com
gcloud init
gcloud functions deploy fassto-data-fetcher   --gen2   --runtime=nodejs16   --region=asia-northeast3   --source=.   --entry-point=fasstoDataFetcher   --trigger-http   --allow-unauthenticated   --vpc-connector=projects/fassto-467707/locations/asia-northeast3/connectors/serverless-connector2   --egress-settings=all   --service-account=86959409290-compute@developer.gserviceaccount.com
gcloud functions deploy fassto-data-fetcher   --gen2   --runtime=nodejs18   --region=asia-northeast3   --source=.   --entry-point=fasstoDataFetcher   --trigger-http   --allow-unauthenticated   --vpc-connector=projects/fassto-467707/locations/asia-northeast3/connectors/serverless-connector2   --egress-settings=all   --service-account=86959409290-compute@developer.gserviceaccount.com
gcloud functions deploy fassto-data-fetcher   --gen2   --runtime=nodejs18   --region=asia-northeast3   --source=.   --entry-point=fasstoDataFetcher   --trigger-http   --allow-unauthenticated   --vpc-connector=projects/fassto-467707/locations/asia-northeast3/connectors/serverless-connector2   --egress-settings=all   --service-account=86959409290-compute@developer.gserviceaccount.com
gcloud functions deploy fassto-data-fetcher   --gen2   --runtime=nodejs18   --region=asia-northeast3   --source=.   --entry-point=fasstoDataFetcher   --trigger-http   --allow-unauthenticated   --vpc-connector=projects/fassto-467707/locations/asia-northeast3/connectors/serverless-connector2   --egress-settings=all   --service-account=86959409290-compute@developer.gserviceaccount.com   --set-env-vars API_CD=de2353d8-6eae-11f0-afa6-0a3424c9a26b,API_KEY=de2353e36eae11f0afa60a3424c9a26b
gcloud functions deploy fassto-data-fetcher   --gen2   --runtime=nodejs18   --region=asia-northeast3   --source=.   --entry-point=fasstoDataFetcher   --trigger-http   --allow-unauthenticated   --vpc-connector=projects/fassto-467707/locations/asia-northeast3/connectors/serverless-connector2   --egress-settings=all   --service-account=86959409290-compute@developer.gserviceaccount.com   --set-env-vars API_CD=de2353d8-6eae-11f0-afa6-0a3424c9a26b,API_KEY=de2353e36eae11f0afa60a3424c9a26b
gcloud functions deploy fassto-api-client   --region=asia-northeast3   --runtime=nodejs20   --trigger-http   --vpc-connector=serverless-connector   --egress-settings=all-traffic   --entry-point=main   --source=./your-source-code-directory
gcloud functions deploy fassto-api-client   --region=asia-northeast3   --runtime=nodejs20   --trigger-http   --vpc-connector=serverless-connector   --egress-settings=all   --entry-point=main   --source=./your-source-code-directory
mkdir fassto-fn
cd fassto-fn
gcloud functions deploy fassto-api-client   --region=asia-northeast3   --runtime=nodejs20   --trigger-http   --vpc-connector=serverless-connector   --egress-settings=all   --entry-point=fasstoDataFetcher   --source=.   --gen2   --set-env-vars=API_CD=de2353d8-6eae-11f0-afa6-0a3424c9a26b,API_KEY=de2353e36eae11f0afa60a3424c9a26b
cat <<EOF > package.json
{
  "name": "fassto-api-client",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "axios": "^1.6.0"
  }
}
EOF

cat <<EOF > package.json
{
  "name": "fassto-api-client",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "axios": "^1.6.0"
  }
}
EOF

cat <<EOF > package.json
{
  "name": "fassto-api-client",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "axios": "^1.6.0"
  }
}
EOF

cat <<EOF > package.json
{
  "name": "fassto-api-client",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "axios": "^1.6.0"
  }
}
EOF

gcloud functions deploy fassto-api-client   --region=asia-northeast3   --runtime=nodejs20   --trigger-http   --vpc-connector=serverless-connector   --egress-settings=all   --entry-point=fasstoDataFetcher   --source=.   --gen2   --set-env-vars=API_CD=de2353d8-6eae-11f0-afa6-0a3424c9a26b,API_KEY=de2353e36eae11f0afa60a3424c9a26b
ls -l
cat <<EOF > index.js
const axios = require('axios');
const { google } = require('googleapis');

const FASSTO_API_BASE_URL = 'https://fmsapi.fassto.ai'; 
const API_CD = process.env.API_CD;
const API_KEY = process.env.API_KEY;

if (!API_CD || !API_KEY) {
  throw new Error("API_CD 또는 API_KEY 환경변수가 설정되지 않았습니다.");
}

async function getFasstoAccessToken() {
  const url = \`\${FASSTO_API_BASE_URL}/api/v1/auth/connect?apiCd=\${API_CD}&apiKey=\${API_KEY}\`;
  const response = await axios.post(url);
  return response.data?.data?.accessToken;
}

const sheets = google.sheets({
  version: 'v4',
  auth: new google.auth.GoogleAuth({ scopes: ['https://www.googleapis.com/auth/spreadsheets'] })
});

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
    const { spreadsheetId, sheetName, startDate, endDate } = req.body;
    if (!spreadsheetId || !sheetName) {
      return res.status(400).send({ status: 'error', message: '필수 인자가 누락되었습니다.' });
    }

    const today = new Date().toISOString().slice(0, 10);
    const start = startDate || today;
    const end = endDate || today;

    const token = await getFasstoAccessToken();
    const url = \`\${FASSTO_API_BASE_URL}/api/v1/delivery/\${API_CD}/\${start}/\${end}/ALL/1\`;
    const result = await axios.get(url, {
      headers: { 'accessToken': token, 'Content-Type': 'application/json' }
    });

    const rows = result.data?.data?.map(item => [
      new Date().toISOString(),
      item.outDlvNo || item.trackingNo || '',
      item.custNm || item.receiverName || '',
      item.status || ''
    ]) || [];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: sheetName,
      valueInputOption: 'RAW',
      resource: { values: rows }
    });

    res.status(200).send({ status: 'success', message: 'Fassto 데이터 기록 완료' });

  } catch (err) {
    console.error('오류 발생:', err);
    res.status(500).send({ status: 'error', message: err.message });
  }
};
EOF

cat <<EOF > index.js
const axios = require('axios');
const { google } = require('googleapis');

const FASSTO_API_BASE_URL = 'https://fmsapi.fassto.ai'; 
const API_CD = process.env.API_CD;
const API_KEY = process.env.API_KEY;

if (!API_CD || !API_KEY) {
  throw new Error("API_CD 또는 API_KEY 환경변수가 설정되지 않았습니다.");
}

async function getFasstoAccessToken() {
  const url = \`\${FASSTO_API_BASE_URL}/api/v1/auth/connect?apiCd=\${API_CD}&apiKey=\${API_KEY}\`;
  const response = await axios.post(url);
  return response.data?.data?.accessToken;
}

const sheets = google.sheets({
  version: 'v4',
  auth: new google.auth.GoogleAuth({ scopes: ['https://www.googleapis.com/auth/spreadsheets'] })
});

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
    const { spreadsheetId, sheetName, startDate, endDate } = req.body;
    if (!spreadsheetId || !sheetName) {
      return res.status(400).send({ status: 'error', message: '필수 인자가 누락되었습니다.' });
    }

    const today = new Date().toISOString().slice(0, 10);
    const start = startDate || today;
    const end = endDate || today;

    const token = await getFasstoAccessToken();
    const url = \`\${FASSTO_API_BASE_URL}/api/v1/delivery/\${API_CD}/\${start}/\${end}/ALL/1\`;
    const result = await axios.get(url, {
      headers: { 'accessToken': token, 'Content-Type': 'application/json' }
    });

    const rows = result.data?.data?.map(item => [
      new Date().toISOString(),
      item.outDlvNo || item.trackingNo || '',
      item.custNm || item.receiverName || '',
      item.status || ''
    ]) || [];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: sheetName,
      valueInputOption: 'RAW',
      resource: { values: rows }
    });

    res.status(200).send({ status: 'success', message: 'Fassto 데이터 기록 완료' });

  } catch (err) {
    console.error('오류 발생:', err);
    res.status(500).send({ status: 'error', message: err.message });
  }
};
EOF

ls -l
gcloud functions deploy fassto-api-client   --region=asia-northeast3   --runtime=nodejs20   --trigger-http   --vpc-connector=serverless-connector   --egress-settings=all   --entry-point=fasstoDataFetcher   --source=.   --gen2   --set-env-vars=API_CD=de2353d8-6eae-11f0-afa6-0a3424c9a26b,API_KEY=de2353e36eae11f0afa60a3424c9a26b
gcloud compute networks vpc-access connectors list   --region=asia-northeast3
gcloud functions deploy fassto-api-client   --region=asia-northeast3   --runtime=nodejs20   --trigger-http   --vpc-connector=serverless-connector2   --egress-settings=all   --entry-point=fasstoDataFetcher   --source=.   --gen2   --set-env-vars=API_CD=de2353d8-6eae-11f0-afa6-0a3424c9a26b,API_KEY=de2353e36eae11f0afa60a3424c9a26b
gcloud functions deploy fasstoDataFetcher   --region=asia-northeast3   --runtime=nodejs20   --trigger-http   --vpc-connector=serverless-connector2   --egress-settings=all   --entry-point=fasstoDataFetcher   --source=.   --no-gen2   --set-env-vars=API_CD=de2353d8-6eae-11f0-afa6-0a3424c9a26b,API_KEY=de2353e36eae11f0afa60a3424c9a26b
gcloud functions deploy fasstoDataFetcher   --region=asia-northeast3   --runtime=nodejs20   --trigger-http   --vpc-connector=serverless-connector2   --egress-settings=all   --entry-point=fasstoDataFetcher   --source=.   --no-gen2   --set-env-vars=API_CD=de2353d8-6eae-11f0-afa6-0a3424c9a26b,API_KEY=de2353e36eae11f0afa60a3424c9a26b
ㅛy
gcloud functions deploy fasstoDataFetcher   --region=asia-northeast3   --runtime=nodejs20   --trigger-http   --vpc-connector=serverless-connector2   --egress-settings=all   --entry-point=fasstoDataFetcher   --source=.   --no-gen2   --set-env-vars=API_CD=de2353d8-6eae-11f0-afa6-0a3424c9a26b,API_KEY=de2353e36eae11f0afa60a3424c9a26b
"dependencies": {
}
ls node_modules
npm install axios googleapis
gcloud functions deploy fasstoDataFetcher   --region=asia-northeast3   --runtime=nodejs20   --trigger-http   --vpc-connector=serverless-connector2   --egress-settings=all   --entry-point=fasstoDataFetcher   --source=.   --no-gen2   --set-env-vars=API_CD=de2353d8-6eae-11f0-afa6-0a3424c9a26b,API_KEY=de2353e36eae11f0afa60a3424c9a26b
gcloud functions add-iam-policy-binding fasstoDataFetcher   --region=asia-northeast3   --member="allUsers"   --role="roles/cloudfunctions.invoker"
gcloud functions deploy fasstoDataFetcher   --runtime=nodejs20   --trigger-http   --allow-unauthenticated   --set-env-vars=API_CD=de2353d8-6eae-11f0-afa6-0a3424c9a26b,API_KEY=de2353e36eae11f0afa60a3424c9a26b   --region=asia-northeast1   --vpc-connector=my-vpc-connector   --egress-settings=all-traffic
gcloud functions deploy fasstoDataFetcher   --runtime=nodejs20   --trigger-http   --allow-unauthenticated   --set-env-vars=API_CD=de2353d8-6eae-11f0-afa6-0a3424c9a26b,API_KEY=de2353e36eae11f0afa60a3424c9a26b   --region=asia-northeast3   --vpc-connector=serverless-connector2   --egress-settings=all
gcloud functions deploy fasstoDataFetcher   --runtime=nodejs20   --trigger-http   --allow-unauthenticated   --set-env-vars=API_CD=de2353d8-6eae-11f0-afa6-0a3424c9a26b,API_KEY=de2353e36eae11f0afa60a3424c9a26b   --region=asia-northeast3   --vpc-connector=o4-mini-high   --egress-settings=all
gcloud functions deploy fasstoDataFetcher   --runtime=nodejs20   --trigger-http   --allow-unauthenticated   --set-env-vars=API_CD=de2353d8-6eae-11f0-afa6-0a3424c9a26b,API_KEY=de2353e36eae11f0afa60a3424c9a26b   --region=asia-northeast3   --vpc-connector=serverless-connector2   --egress-settings=all
gcloud functions deploy fasstoDataFetcher   --runtime=nodejs20   --trigger-http   --allow-unauthenticated   --set-env-vars=API_CD=de2353d8-6eae-11f0-afa6-0a3424c9a26b,API_KEY=de2353e36eae11f0afa60a3424c9a26b   --region=asia-northeast3   --vpc-connector=serverless-connector2   --egress-settings=all-traffic
gcloud functions deploy fasstoDataFetcher   --runtime=nodejs20   --trigger-http   --allow-unauthenticated   --set-env-vars=API_CD=de2353d8-6eae-11f0-afa6-0a3424c9a26b,API_KEY=de2353e36eae11f0afa60a3424c9a26b   --region=asia-northeast3   --vpc-connector=serverless-connector2   --egress-settings=all-traffic
rm -rf node_modules package-lock.json
npm install
gcloud functions deploy fasstoDataFetcher   --runtime=nodejs20   --trigger-http   --allow-unauthenticated   --set-env-vars=API_CD=de2353d8-6eae-11f0-afa6-0a3424c9a26b,API_KEY=de2353e36eae11f0afa60a3424c9a26b   --region=asia-northeast3   --vpc-connector=serverless-connector2   --egress-settings=all
gcloud functions deploy fassto-data-fetcher   --gen2   --runtime=nodejs18   --region=asia-northeast3   --source=.   --entry-point=fasstoDataFetcher   --trigger-http   --allow-unauthenticated   --vpc-connector=projects/fassto-467707/locations/asia-northeast3/connectors/serverless-connector2   --egress-settings=all   --service-account=86959409290-compute@developer.gserviceaccount.com   --set-env-vars API_CD=de2353d8-6eae-11f0-afa6-0a3424c9a26b,API_KEY=de2353e36eae11f0afa60a3424c9a26b
gcloud functions deploy fassto-data-fetcher   --gen2   --runtime=nodejs20   --region=asia-northeast3   --source=.   --entry-point=fasstoDataFetcher   --trigger-http   --allow-unauthenticated   --vpc-connector=projects/fassto-467707/locations/asia-northeast3/connectors/serverless-connector2   --egress-settings=all   --service-account=86959409290-compute@developer.gserviceaccount.com   --set-env-vars API_CD=de2353d8-6eae-11f0-afa6-0a3424c9a26b,API_KEY=de2353e36eae11f0afa60a3424c9a26b
cat package.json
rm package-lock.json
gcloud functions deploy fassto-data-fetcher   --gen2   --runtime=nodejs20   --region=asia-northeast3   --source=.   --entry-point=fasstoDataFetcher   --trigger-http   --allow-unauthenticated   --vpc-connector=projects/fassto-467707/locations/asia-northeast3/connectors/serverless-connector2   --egress-settings=all   --service-account=86959409290-compute@developer.gserviceaccount.com   --set-env-vars API_CD=de2353d8-6eae-11f0-afa6-0a3424c9a26b,API_KEY=de2353e36eae11f0afa60a3424c9a26b
npm install uuid
rm -rf node_modules package-lock.json
npm install
gcloud functions deploy fasstoDataFetcher   --runtime=nodejs20   --trigger-http   --allow-unauthenticated   --set-env-vars=API_CD=de2353d8-6eae-11f0-afa6-0a3424c9a26b,API_KEY=de2353e36eae11f0afa60a3424c9a26b   --region=asia-northeast3   --vpc-connector=serverless-connector2   --egress-settings=all
gcloud functions describe fasstoDataFetcher --region=asia-northeast3 --format="value(environmentVariables.API_CD,environmentVariables.API_KEY)"
rm -rf node_modules package-lock.json
npm install
gcloud functions deploy fasstoDataFetcher   --runtime=nodejs20   --trigger-http   --allow-unauthenticated   --set-env-vars=API_CD=de2353d8-6eae-11f0-afa6-0a3424c9a26b,API_KEY=de2353e36eae11f0afa60a3424c9a26b   --region=asia-northeast3   --vpc-connector=serverless-connector2   --egress-settings=all
FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
CMD ["node", "index.js"]
cat <<'EOF' > Dockerfile
FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
CMD ["node", "index.js"]
EOF

PROJECT=fassto-467707
REGION=asia-northeast3
REPO=fassto-repo
IMAGE=fassto-data-fetcher
TAG=latest
gcloud artifacts repositories create $REPO   --repository-format=docker   --location=$REGION   --description="Docker repo for Fassto data fetcher"
gcloud builds submit --region=$REGION   --tag=${REGION}-docker.pkg.dev/${PROJECT}/${REPO}/${IMAGE}:${TAG}
gcloud auth configure-docker asia-northeast3-docker.pkg.dev
docker build -t asia-northeast3-docker.pkg.dev/${PROJECT}/${REPO}/${IMAGE}:${TAG} .
docker push asia-northeast3-docker.pkg.dev/${PROJECT}/${REPO}/${IMAGE}:${TAG}
gcloud run deploy fassto-data-fetcher   --image=asia-northeast3-docker.pkg.dev/${PROJECT}/${REPO}/${IMAGE}:${TAG}   --region=asia-northeast3   --allow-unauthenticated   --vpc-connector=serverless-connector2   --set-env-vars=API_CD=de2353d8-6eae-11f0-afa6-0a3424c9a26b,API_KEY=de2353e36eae11f0afa60a3424c9a26b   --ingress=all   --egress-settings=all   --platform=managed
gcloud run deploy fassto-data-fetcher   --image=asia-northeast3-docker.pkg.dev/fassto-467707/fassto-repo/fassto-data-fetcher:latest   --region=asia-northeast3   --allow-unauthenticated   --vpc-connector=serverless-connector2   --vpc-connector-egress all-traffic   --set-env-vars=API_CD=de2353d8-6eae-11f0-afa6-0a3424c9a26b,API_KEY=de2353e36eae11f0afa60a3424c9a26b   --ingress=all   --platform=managed
gcloud run deploy fassto-data-fetcher   --image=asia-northeast3-docker.pkg.dev/fassto-467707/fassto-repo/fassto-data-fetcher:latest   --region=asia-northeast3   --allow-unauthenticated   --vpc-connector=serverless-connector2   --vpc-connector-egress=all-traffic   --set-env-vars=API_CD=de2353d8-6eae-11f0-afa6-0a3424c9a26b,API_KEY=de2353e36eae11f0afa60a3424c9a26b   --ingress=all   --platform=managed
gcloud components update
gcloud run deploy fassto-data-fetcher   --image=asia-northeast3-docker.pkg.dev/fassto-467707/fassto-repo/fassto-data-fetcher:latest   --region=asia-northeast3   --allow-unauthenticated   --vpc-connector=serverless-connector2   --vpc-connector-egress=all-traffic   --set-env-vars=API_CD=de2353d8-6eae-11f0-afa6-0a3424c9a26b,API_KEY=de2353e36eae11f0afa60a3424c9a26b   --ingress=all gcloud run deploy fassto-data-fetcher   --image=asia-northeast3-docker.pkg.dev/fassto-467707/fassto-repo/fassto-data-fetcher:latest   --region=asia-northeast3   --allow-unauthenticated   --vpc-connector=serverless-connector2   --vpc-connector-egress=all-traffic   --set-env-vars=API_CD=de2353d8-6eae-11f0-afa6-0a3424c9a26b,API_KEY=de2353e36eae11f0afa60a3424c9a26b   --ingress=all gcloud run deploy fassto-data-fetcher   --image=asia-northeast3-docker.pkg.dev/fassto-467707/fassto-repo/fassto-data-fetcher:latest   --region=asia-northeast3   --allow-unauthenticated   --vpc-connector=serverless-connector2   --vpc-connector-egress=all-traffic   --set-env-vars=API_CD=de2353d8-6eae-11f0-afa6-0a3424c9a26b,API_KEY=de2353e36eae11f0afa60a3424c9a26b   --ingress=all   --platform=managed
gcloud run deploy fassto-data-fetcher   --image=asia-northeast3-docker.pkg.dev/fassto-467707/fassto-repo/fassto-data-fetcher:latest   --region=asia-northeast3   --allow-unauthenticated   --vpc-connector=serverless-connector2   --vpc-egress=all-traffic   --set-env-vars=API_CD=de2353d8-6eae-11f0-afa6-0a3424c9a26b,API_KEY=de2353e36eae11f0afa60a3424c9a26b   --ingress=all   --platform=managed
gcloud components update
gcloud run services describe fassto-data-fetcher   --region=asia-northeast3   --format="yaml(status.latestCreatedRevision, status.latestReadyRevision, status.traffic, metadata.labels, status.conditions)"
gcloud functions describe fasstoDataFetcher   --region=asia-northeast3   --format="yaml(name,status,updateTime,environmentVariables)"
gcloud run logs read fassto-data-fetcher --region=asia-northeast3 --limit=50
gcloud functions logs read fasstoDataFetcher --region=asia-northeast3 --limit=50
# index.js
cat <<'EOF' > index.js
(위 index.js 내용을 그대로 붙여넣기)
EOF

# package.json
cat <<'EOF' > package.json
(위 package.json 내용 그대로 붙여넣기)
EOF

ls -l index.js package.json
head -n 60 index.js
ls -l node_modules
gcloud functions deploy fasstoDataFetcher   --runtime=nodejs20   --trigger-http   --allow-unauthenticated   --entry-point=fasstoDataFetcher   --region=asia-northeast3   --vpc-connector=serverless-connector2   --egress-settings=all   --set-env-vars=API_CD=de2353d8-6eae-11f0-afa6-0a3424c9a26b,API_KEY=de2353e36eae11f0afa60a3424c9a26b
gcloud functions describe fasstoDataFetcher --region=asia-northeast3 --format="yaml(name,status,updateTime,environmentVariables)"
gcloud functions deploy fasstoDataFetcher   --runtime=nodejs20   --trigger-http   --allow-unauthenticated   --entry-point=fasstoDataFetcher   --region=asia-northeast3   --vpc-connector=serverless-connector2   --egress-settings=all   --set-env-vars=API_CD=de2353d8-6eae-11f0-afa6-0a3424c9a26b,API_KEY=de2353e36eae11f0afa60a3424c9a26b
gcloud functions describe fasstoDataFetcher --region=asia-northeast3 --format="yaml(name,status,updateTime,environmentVariables)"
gcloud functions deploy fasstoDataFetcher   --runtime=nodejs20   --trigger-http   --allow-unauthenticated   --entry-point=fasstoDataFetcher   --region=asia-northeast3   --vpc-connector=serverless-connector2   --egress-settings=all   --set-env-vars=API_CD=de2353d8-6eae-11f0-afa6-0a3424c9a26b,API_KEY=de2353e36eae11f0afa60a3424c9a26b
gcloud functions deploy fasstoDataFetcher   --runtime=nodejs20   --trigger-http   --allow-unauthenticated   --entry-point=fasstoDataFetcher   --region=asia-northeast3   --vpc-connector=serverless-connector2   --egress-settings=all   --set-env-vars=API_CD=de2353d8-6eae-11f0-afa6-0a3424c9a26b,API_KEY=de2353e36eae11f0afa60a3424c9a26b
gcloud functions deploy fassto-data-fetcher \
--gen2 \
--runtime nodejs20 \
--region asia-northeast3 \
--source . \
--entry-point fasstoDataFetcher \
--trigger-http \
--allow-unauthenticated \
--vpc-connector serverless-connector2 \
--egress-settings all \
--set-env-vars API_CD=de2353d8-6eae-11f0-afa6-0a3424c9a26b,API_KEY=de2353e36eae11f0afa60a3424c9a26b
gcloud functions deploy fassto-data-fetcher --gen2 --runtime=nodejs20 --region=asia-northeast3 --source=. --entry-point=fasstoDataFetcher --trigger-http --allow-unauthenticated --vpc-connector=serverless-connector2 --egress-settings=all --set-env-vars=API_CD=de2353d8-6eae-11f0-afa6-0a3424c9a26b,API_KEY=de2353e36eae11f0afa60a3424c9a26b
gcloud functions deploy fassto-data-fetcher --gen2 --runtime=nodejs20 --region=asia-northeast3 --source=. --entry-point=fasstoDataFetcher --trigger-http --allow-unauthenticated --vpc-connector=serverless-connector2 --egress-settings=all --set-env-vars=API_CD=de2353d8-6eae-11f0-afa6-0a3424c9a26b,API_KEY=de2353e36eae11f0afa60a3424c9a26b
gcloud functions deploy fassto-data-fetcher --gen2 --runtime=nodejs20 --region=asia-northeast3 --source=. --entry-point=fasstoApiGateway --trigger-http --allow-unauthenticated --vpc-connector=serverless-connector2 --egress-settings=all --set-env-vars=API_CD=de2353d8-6eae-11f0-afa6-0a3424c9a26b,API_KEY=de2353e36eae11f0afa60a3424c9a26b
cd ~/ # 홈 디렉토리로 이동
mkdir smartstore-fn # "smartstore-fn"이라는 새 폴더 생성
cd smartstore-fn # 새 폴더로 이동
npm init -y
npm install axios
touch index.js
git
mv index.js fasto-fn/
mv package.json fasto-fn/
mv package-lock.json fasto-fn/
cd ~/ # 홈 디렉토리로 이동
mkdir smartstore-fn # "smartstore-fn"이라는 새 폴더 생성
cd smartstore-fn # 새 폴더로 이동
npm init -y
npm install axios
touch index.js
gcloud run deploy fassto-data-fetcher \
cd fassto-fn
gcloud run deploy fassto-data-fetcher   --source .   --region asianortheast3   --set-env-vars API_CD=de2353d8-6eae-11f0-afa6-0a3424c9a26b,API_KEY=de2353e36eae11f0afa60a3424c9a26b,CST_CD=94ANQ   --allow-unauthenticated
gcloud auth login
gcloud run deploy fassto-data-fetcher   --source .   --region asianortheast3   --set-env-vars API_CD=de2353d8-6eae-11f0-afa6-0a3424c9a26b,API_KEY=de2353e36eae11f0afa60a3424c9a26b,CST_CD=94ANQ   --allow-unauthenticated
gcloud artifacts repositories create cloud-run-source-deploy   --repository-format=docker   --location=asia-northeast3
gcloud run deploy fassto-data-fetcher   --source .   --region asianortheast3   --repository=cloud-run-source-deploy   --set-env-vars API_CD=de2353d8-6eae-11f0-afa6-0a3424c9a26b,API_KEY=de2353e36eae11f0afa60a3424c9a26b,CST_CD=94ANQ   --allow-unauthenticated
gcloud run deploy fassto-data-fetcher   --source .   --region asianortheast3   --set-env-vars API_CD=de2353d8-6eae-11f0-afa6-0a3424c9a26b,API_KEY=de2353e36eae11f0afa60a3424c9a26b,CST_CD=94ANQ   --allow-unauthenticated
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com
gcloud run deploy fassto-data-fetcher   --source .   --region asianortheast3   --set-env-vars API_CD=de2353d8-6eae-11f0-afa6-0a3424c9a26b,API_KEY=de2353e36eae11f0afa60a3424c9a26b,CST_CD=94ANQ   --allow-unauthenticated
gcloud builds submit --region=asianortheast3 --tag=asianortheast3-docker.pkg.dev/fassto-467707/cloud-run-source-deploy/fassto-data-fetcher:latest .
gcloud builds submit --tag=asianortheast3-docker.pkg.dev/fassto-467707/cloud-run-source-deploy/fassto-data-fetcher:latest .
cd ~/fassto-fn
npm install
gcloud builds submit --tag=asianortheast3-docker.pkg.dev/fassto-467707/cloud-run-source-deploy/fassto-data-fetcher:latest .
gcloud projects add-iam-policy-binding fassto-467707     --member='serviceAccount:86959409290@cloudbuild.gserviceaccount.com'     --role='roles/artifactregistry.writer'
gcloud builds submit --tag=asianortheast3-docker.pkg.dev/fassto-467707/cloud-run-source-deploy/fassto-data-fetcher:latest .
gcloud run services delete fassto-data-fetcher --region asianortheast3
gcloud artifacts repositories delete cloud-run-source-deploy --location=asia-northeast3
gcloud artifacts repositories create cloud-run-source-deploy   --repository-format=docker   --location=asia-northeast3
gcloud builds submit --tag=asianortheast3-docker.pkg.dev/fassto-467707/cloud-run-source-deploy/fassto-data-fetcher:latest .
cd fassto-fn
# Use a Node.js base image
FROM node:20
# Set the working directory
WORKDIR /app
# Copy package.json and package-lock.json
COPY package*.json ./
# Install dependencies
RUN npm ci
# Copy the rest of the application code
COPY . .
# Set the entry point to run the application
CMD ["node", "index.js"]
docker build -t asianortheast3-docker.pkg.dev/fassto-467707/cloud-run-source-deploy/fassto-data-fetcher:latest .
docker push asianortheast3-docker.pkg.dev/fassto-467707/cloud-run-source-deploy/fassto-data-fetcher:latest
gcloud run deploy fassto-data-fetcher   --region=asianortheast3   --image=asianortheast3-docker.pkg.dev/fassto-467707/cloud-run-source-deploy/fassto-data-fetcher:latest   --set-env-vars API_CD=de2353d8-6eae-11f0-afa6-0a3424c9a26b,API_KEY=de2353e36eae11f0afa60a3424c9a26b,CST_CD=94ANQ   --allow-unauthenticated
gcloud config set run/region asia-northeast3
gcloud run deploy fassto-data-fetcher   --region=asianortheast3   --image=asianortheast3-docker.pkg.dev/fassto-467707/cloud-run-source-deploy/fassto-data-fetcher:latest   --set-env-vars API_CD=de2353d8-6eae-11f0-afa6-0a3424c9a26b,API_KEY=de2353e36eae11f0afa60a3424c9a26b,CST_CD=94ANQ   --allow-unauthenticated
gcloud config unset run/region
gcloud config set project fassto-467707
gcloud run deploy fassto-data-fetcher   --region=asianortheast3   --image=asianortheast3-docker.pkg.dev/fassto-467707/cloud-run-source-deploy/fassto-data-fetcher:latest   --set-env-vars API_CD=de2353d8-6eae-11f0-afa6-0a3424c9a26b,API_KEY=de2353e36eae11f0afa60a3424c9a26b,CST_CD=94ANQ   --allow-unauthenticated
gcloud services enable sourcerepo.googleapis.com
docker push asianortheast3-docker.pkg.dev/fassto-467707/cloud-run-source-deploy/fassto-data-fetcher:latest
gcloud artifacts docker images list asia-northeast3-docker.pkg.dev/fassto-467707/cloud-run-source-deploy
docker build -t asianortheast3-docker.pkg.dev/fassto-467707/cloud-run-source-deploy/fassto-data-fetcher:latest .
cd fassto-fn
docker build -t asianortheast3-docker.pkg.dev/fassto-467707/cloud-run-source-deploy/fassto-data-fetcher:latest .
docker push asianortheast3-docker.pkg.dev/fassto-467707/cloud-run-source-deploy/fassto-data-fetcher:latest
gcloud auth configure-docker asianortheast3-docker.pkg.dev
docker push asianortheast3-docker.pkg.dev/fassto-467707/cloud-run-source-deploy/fassto-data-fetcher:latest
gcloud projects add-iam-policy-binding fassto-467707     --member='user:natureskwy@gmail.com'     --role='roles/artifactregistry.writer'
gcloud projects add-iam-policy-binding fassto-467707     --member='user:natureskwy@gmail.com'     --role='roles/artifactregistry.writer'     --no-condition
docker push asianortheast3-docker.pkg.dev/fassto-467707/cloud-run-source-deploy/fassto-data-fetcher:latest
gcloud artifacts repositories delete cloud-run-source-deploy --location=asia-northeast3 --quiet
gcloud run deploy fassto-data-fetcher   --source .   --region asianortheast3   --set-env-vars API_CD=de2353d8-6eae-11f0-afa6-0a3424c9a26b,API_KEY=de2353e36eae11f0afa60a3424c9a26b,CST_CD=94ANQ   --allow-unauthenticated
ud
steps:
# 2. 빌드한 이미지를 Google Container Registry에 푸시(저장)합니다.
images:
# 변경사항 추가
git add .
# 변경사항 기록
git commit -m "트리거 테스트"
# GitHub로 푸시
git push
# 변경사항 추가
git add .
# 변경사항 기록
git commit -m "트리거 테스트"
# GitHub로 푸시
git push
cd ~/Desktop/my-first-repo
# 1. 이 폴더를 Git 저장소로 만듭니다. (폴더 안에 .git 숨김 폴더가 생성됨)
git init
# 2. GitHub에 만든 원격 저장소와 연결합니다.
git remote add origin https://github.com/natureskwy-crypto/my-first-repo.git
git add .
git commit -m "트리거 테스트"
git push -u origin main
