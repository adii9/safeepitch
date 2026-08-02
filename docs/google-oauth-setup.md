# Google OAuth Setup for SafeDeck

## The OAuth client ID

`apps/web/.env` has:
```
VITE_GOOGLE_CLIENT_ID=99472736316-kld5l0j39bdnd04nfgq2a86hs6th60hk.apps.googleusercontent.com
```

This was registered as a new OAuth client for the `safeepitch` deployment.

## One-time Google Cloud Console setup

After creating the OAuth client, two more steps are required before login works for real users:

### 1. Authorized JavaScript origins

Go to: https://console.cloud.google.com/apis/credentials

Click the OAuth client `99472736316-...`, then add to **Authorized JavaScript origins**:
- `http://localhost:3000` (for local dev)
- `https://d36t7grotgwbz5.cloudfront.net` (for prod)
- `https://safedeck.ai` (when the domain is set up)

Without this, Google blocks login with **"The OAuth client was not found"** or **"This browser or app may not be secure"**.

### 2. OAuth consent screen — test users or publish

Go to: https://console.cloud.google.com/apis/credentials/consent

**For beta:**
- Either add each beta user's email to **Test users** (works up to 100 users, no review needed)
- Or click **PUBLISH APP** to move out of "Testing" mode. Note: apps requesting sensitive scopes (`spreadsheets`, `drive`) need Google's verification (~2 weeks) before they're fully unrestricted. Until then, only test users can log in.

## Scopes requested

The current login request asks for:
- `openid profile email` — basic identity (always needed)
- `https://www.googleapis.com/auth/spreadsheets` — read/write user's Google Sheets
- `https://www.googleapis.com/auth/drive.readonly` — read user's Drive
- `https://www.googleapis.com/auth/drive.file` — write to user's Drive

If you only need Sheets + Drive for the beta flow, the first three scopes are required. For a lighter MVP, drop the drive scopes until the Sheets integration is in.

## Rebuilding after changing scopes or client ID

1. Edit `apps/web/.env` (or set in your shell)
2. Rebuild Docker:
   ```bash
   docker build --no-cache -f docker/Dockerfile.web -t safedeck-web:dev \
     --build-arg VITE_GOOGLE_CLIENT_ID=99472736316-kld5l0j39bdnd04nfgq2a86hs6th60hk.apps.googleusercontent.com \
     .
   docker rm -f safedeck-web && docker run -d --rm -p 3000:80 --name safedeck-web safedeck-web:dev
   ```
