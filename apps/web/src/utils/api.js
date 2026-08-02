/**
 * SafeDeck API client.
 *
 * Architecture: React -> API Gateway (Cognito authorizer) -> Lambda
 *
 * Auth: Cognito JWT id_token goes in the Authorization header. The
 * token is retrieved by Cognito via the hosted UI / token endpoint.
 *
 * For local dev without a real backend, all calls fall back to local
 * mocks that resolve with realistic data. This lets the UI work
 * end-to-end without a running API.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false'; // default: mocked

/**
 * Get the current user's Cognito id_token.
 * TODO (Week 2): wire this to Cognito's token endpoint once Cognito is set up.
 */
function getIdToken() {
  // For local dev, use a placeholder so the Authorization header is set.
  // Backend will reject if not authenticated, but mocks don't care.
  return localStorage.getItem('safedeck_id_token') || 'mock-token';
}

async function apiFetch(path, body, { method = 'POST' } = {}) {
  if (USE_MOCKS) {
    return mockResponse(path, body, { method });
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getIdToken()}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json();
}

// ─── Google OAuth user-sync ─────────────────────────────────────────────────

/**
 * Called by Header/Hero after Google OAuth succeeds.
 * Exchanges the access token for our internal user record.
 */
export async function loginWithGoogle({ access_token, refresh_token, userInfo }) {
  return apiFetch('/user-sync', {
    google_access_token: access_token,
    google_refresh_token: refresh_token,
    email: userInfo.email,
    name: userInfo.name,
    picture: userInfo.picture,
    google_user_id: userInfo.sub,
  });
}

// ─── Audits (Dashboard) ─────────────────────────────────────────────────────

/**
 * List all audits for the current user. Used by the Dashboard to show
 * the Kanban board of deals.
 */
export async function listAudits({ user_id, email } = {}) {
  return apiFetch('/audits', { user_id, email }, { method: 'POST' });
}

export async function getAudit({ audit_id } = {}) {
  return apiFetch(`/audits/${audit_id}`, null, { method: 'GET' });
}

// ─── Onboarding: fund profile (Step 2) ─────────────────────────────────────

export async function saveFundProfile({ userId, email, fundName, role, website, volume, thesis, sectors, stages }) {
  return apiFetch('/profile', {
    user_id: userId,
    email,
    fund_name: fundName,
    role,
    website,
    decks_per_month: volume,
    thesis,
    sectors,
    stages,
  });
}

// ─── Onboarding: evaluation criteria (Step 3) ──────────────────────────────

export async function saveEvaluationCriteria({ userId, email, evaluationCriteria }) {
  return apiFetch('/criteria', {
    user_id: userId,
    email,
    evaluation_criteria: evaluationCriteria,
  });
}

// ─── Onboarding: Google Sheet URL (Step 3) ─────────────────────────────────

export async function saveSheetUrl({ userId, email, sheetUrl }) {
  return apiFetch('/sheet', { user_id: userId, email, sheet_url: sheetUrl });
}

// ─── Onboarding: sheet field mapping (Step 3) ──────────────────────────────

export async function saveSheetMapping({ userId, email, fieldMappings }) {
  return apiFetch('/mapping', { user_id: userId, email, output_sheet_mapping: fieldMappings });
}

// ─── Onboarding: rating template (Step 4) ──────────────────────────────────

export async function saveRatingConfiguration({ userId, email, ratingWeights }) {
  return apiFetch('/rating', {
    user_id: userId,
    email,
    rating_template: { weights: ratingWeights },
  });
}

// ─── Onboarding: Google Drive folder (Step 4) ──────────────────────────────

export async function saveDriveFolderId({ userId, email, driveFolderId }) {
  return apiFetch('/drive', { user_id: userId, email, drive_folder_id: driveFolderId });
}

// ─── Onboarding: data source (Step 5) ──────────────────────────────────────

export async function saveDataSource({ userId, email, dataSource }) {
  return apiFetch('/datasource', { user_id: userId, email, data_source: dataSource });
}

// ─── Onboarding: email routing (Step 5) ────────────────────────────────────

export async function saveEmailRouting({ userId, email, emailAddress, forwardAll, filterCriteria }) {
  return apiFetch('/email', {
    user_id: userId,
    email,
    routing_email_address: emailAddress,
    routing_forward_all: forwardAll,
    routing_filter_criteria: filterCriteria,
  });
}

// ─── Pitch deck upload + audit trigger (Step 6) ────────────────────────────

/**
 * Uploads a PDF and triggers the audit pipeline. Returns { audit_id }.
 * The frontend then polls /deals/{id} or subscribes via WebSocket for status.
 */
export async function testDeckUpload({ tenantSlug, companyName, pdfFile }) {
  if (USE_MOCKS) {
    return { audit_id: `mock-${Date.now()}`, status: 'pending' };
  }

  // For real upload: get a presigned S3 URL from upload-api, PUT the file
  // directly to S3, then POST to /audits to enqueue. This is the async pattern
  // from the architecture doc.
  const uploadRes = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getIdToken()}`,
    },
    body: JSON.stringify({
      tenant_slug: tenantSlug,
      company_name: companyName,
    }),
  });
  if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status}`);
  const { upload_url, audit_id } = await uploadRes.json();

  // Upload PDF directly to S3
  const s3Res = await fetch(upload_url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/pdf' },
    body: pdfFile,
  });
  if (!s3Res.ok) throw new Error(`S3 upload failed: ${s3Res.status}`);

  return { audit_id, status: 'pending_upload' };
}

// ─── Payments (Razorpay) ───────────────────────────────────────────────────

export async function createOrder({ planId, userId, email }) {
  return apiFetch('/safepay', { action: 'createOrder', planId, user_id: userId, email });
}

export async function verifyPayment({ orderId }) {
  return apiFetch('/safepay', { action: 'verifyPayment', order_id: orderId });
}

// ─── Local mocks ───────────────────────────────────────────────────────────

/**
 * Local-dev mock responses. Resolves with realistic data so the
 * onboarding UI works end-to-end without a backend. The mocks log
 * the request so you can see what would have been sent.
 */
function mockResponse(path, body, { method }) {
  if (import.meta.env.DEV) {
    console.log(`[api mock] ${method} ${path}`, body);
  }

  const store = (() => {
    try {
      const raw = localStorage.getItem('safedeck_mock_store');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  })();

  const persist = (data) => {
    try {
      localStorage.setItem('safedeck_mock_store', JSON.stringify({ ...store, ...data }));
    } catch {
      // localStorage full or disabled
    }
    return data;
  };

  switch (path) {
    case '/user-sync':
      return Promise.resolve(
        persist({
          user: {
            user_id: body.google_user_id || 'mock-user',
            email: body.email,
            name: body.name,
            picture: body.picture,
            is_new_user: !store.user,
          },
        }),
      );

    case '/profile':
    case '/criteria':
    case '/sheet':
    case '/mapping':
    case '/rating':
    case '/drive':
    case '/datasource':
    case '/email':
      return Promise.resolve(persist({ [path.slice(1)]: body, saved_at: new Date().toISOString() }));

    case '/safepay':
      if (body.action === 'createOrder') {
        return Promise.resolve({ order_id: `mock-order-${Date.now()}`, amount: 30000, currency: 'INR' });
      }
      return Promise.resolve({ verified: true, payment_id: `mock-pay-${Date.now()}` });

    case '/upload':
      return Promise.resolve({ audit_id: `mock-${Date.now()}`, status: 'pending_upload' });

    default:
      return Promise.resolve({ status: 'mocked', path, body });
  }
}
