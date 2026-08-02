const API_BASE = import.meta.env.VITE_SAFEPITCH_FUNCTION_URL || 'https://yxwwqmw3pnrj5nfyz3axjrew5i0dyejo.lambda-url.eu-north-1.on.aws/';
const API_KEY = import.meta.env.VITE_AWS_API_KEY;

async function apiFetch(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  let data = JSON.parse(await res.text()).body;
  if (typeof data === 'string') data = JSON.parse(data);
  return data;
}

// ─── Google OAuth ──────────────────────────────────────────────────────────────

export async function loginWithGoogle(tokenResponse) {
  const { access_token, refresh_token } = tokenResponse;

  const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!userInfoResponse.ok) throw new Error('Failed to fetch Google user info');
  const userInfo = await userInfoResponse.json();

  const syncPayload = {
    httpMethod: 'POST',
    body: JSON.stringify({
      userId: userInfo.sub || `google_${Date.now()}`,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      access_token,
      refresh_token: refresh_token || null,
    }),
    headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
    requestContext: { identity: { sourceIp: '127.0.0.1' } },
  };

  const syncResponse = await fetch(
    'https://i7az96pt3l.execute-api.eu-north-1.amazonaws.com/default/user-sync',
    {
      method: 'POST',
      headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(syncPayload),
    }
  );
  if (!syncResponse.ok) throw new Error('User sync failed');
  let syncData = JSON.parse(await syncResponse.text()).body;
  if (typeof syncData === 'string') syncData = JSON.parse(syncData);

  localStorage.setItem('safedeck_user', JSON.stringify({
    name: userInfo.name,
    email: userInfo.email,
    picture: userInfo.picture,
    givenName: userInfo.given_name,
    userId: userInfo.sub,
    access_token: access_token,
    user: syncData.user || {},
  }));

  return {
    ...userInfo,
    userId: userInfo.sub,
    isNewUser: syncData.isNewUser ?? true,
    user: syncData.user || {},
  };
}

// ─── Fund Profile ─────────────────────────────────────────────────────────────

export async function saveFundProfile({ userId, email, fundName, role, website, volume, thesis, sectors, stages }) {
  return apiFetch('profile', {
    userId, email, fund_name: fundName, role, website,
    decks_per_month: volume, thesis, sectors, stages,
  });
}

// ─── Evaluation Criteria ─────────────────────────────────────────────────────

export async function saveEvaluationCriteria({ userId, email, evaluationCriteria }) {
  return apiFetch('criteria', { userId, email, evaluation_criteria: evaluationCriteria });
}

// ─── Google Sheet URL ─────────────────────────────────────────────────────────

export async function saveSheetUrl({ userId, email, sheetUrl }) {
  return apiFetch('sheet', { userId, email, sheet_url: sheetUrl });
}

// ─── Sheet Field Mapping ───────────────────────────────────────────────────────

export async function saveSheetMapping({ userId, email, fieldMappings }) {
  return apiFetch('mapping', { userId, email, output_sheet_mapping: fieldMappings });
}

// ─── Rating Configuration ─────────────────────────────────────────────────────

export async function saveRatingConfiguration({ userId, email, ratingWeights }) {
  return apiFetch('rating', {
    userId,
    email,
    rating_template: { weights: ratingWeights },
  });
}

// ─── Google Drive Folder ID ───────────────────────────────────────────────────

export async function saveDriveFolderId({ userId, email, driveFolderId }) {
  return apiFetch('drive', { userId, email, drive_folder_id: driveFolderId });
}

// ─── Data Source ──────────────────────────────────────────────────────────────

export async function saveDataSource({ userId, email, dataSource }) {
  return apiFetch('datasource', { userId, email, data_source: dataSource });
}

// ─── Email Routing ────────────────────────────────────────────────────────────

export async function saveEmailRouting({ userId, email, emailAddress, forwardAll, filterCriteria }) {
  return apiFetch('email', {
    userId, email,
    routing_email_address: emailAddress,
    routing_forward_all: forwardAll,
    routing_filter_criteria: filterCriteria,
  });
}

// ─── CrewAI Pipeline ───────────────────────────────────────────────────────────

export async function testDeckUpload({ tenantSlug, companyName, pdfFile }) {
  const arrayBuffer = await pdfFile.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let base64 = '';
  for (let i = 0; i < bytes.length; i++) base64 += String.fromCharCode(bytes[i]);
  base64 = btoa(base64);

  const payload = {
    tenant_slug: tenantSlug || 'default',
    company_name: companyName || pdfFile.name.replace('.pdf', ''),
    pitch_deck_content: base64,
    email_body: null,
  };

  const res = await fetch(
    'https://d36t7grotgwbz5.cloudfront.net/safepitch-function',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );
  if (!res.ok) throw new Error(`Lambda error ${res.status}`);
  let data = JSON.parse(await res.text());
  if (data.body) {
    try { data = typeof data.body === 'string' ? JSON.parse(data.body) : data.body; }
    catch { data = data.body; }
  }
  return data;
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export async function createOrder({ planId, userId, email }) {
  const res = await fetch('https://zh2feylzki.execute-api.eu-north-1.amazonaws.com/default/safepay', {
    method: 'POST',
    headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'createOrder', userId, email, planId }),
  });
  if (!res.ok) throw new Error('Order creation failed');
  let data = JSON.parse(await res.text());
  if (data.body) try { data = JSON.parse(data.body); } catch { data = data.body; }
  return data;
}

export async function verifyPayment({ orderId }) {
  const res = await fetch('https://zh2feylzki.execute-api.eu-north-1.amazonaws.com/default/safepay', {
    method: 'POST',
    headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'verifyPayment', orderId }),
  });
  if (!res.ok) throw new Error('Payment verification failed');
  let data = JSON.parse(await res.text());
  if (data.body) try { data = JSON.parse(data.body); } catch { data = data.body; }
  return data;
}