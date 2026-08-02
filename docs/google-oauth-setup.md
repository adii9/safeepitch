# Google OAuth Consent Screen Configuration

For a brand-new OAuth client in a brand-new GCP project, the **consent screen must be configured BEFORE the client can be used for any flow**. If the consent screen is in an unconfigured state, every OAuth request returns `401 invalid_client`, even though the client ID is technically registered.

## Quick check: is this your problem?

Run this in your terminal:

```bash
curl -s "https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=http://localhost:3000&response_type=token&scope=openid" -o /dev/null -w "HTTP %{http_code}\n"
```

- If you see `HTTP 302` → the client is working at the network level, the problem is on the consent screen / browser interaction
- If you see `HTTP 400` or `HTTP 401` → the client ID is wrong or deleted

## Steps to fix

### 1. Configure the consent screen

1. Go to Google Cloud Console: https://console.cloud.google.com/
2. Select the project that owns the OAuth client (top-left project picker)
3. Navigate to: **APIs & Services → OAuth consent screen**
   - Direct link: https://console.cloud.google.com/apis/credentials/consent
4. Click **CONFIGURE CONSENT SCREEN** (or **EDIT APP** if it exists)
5. Fill in:
   - **App name:** SafeDeck
   - **User support email:** mathuraditya00@gmail.com
   - **Developer contact:** mathuraditya00@gmail.com
   - **Scopes:** add `openid`, `email`, `profile` (and the Drive/Sheets scopes later)
6. Save. Status will be **"Testing"** — that's fine for now, no Google review needed

### 2. Add test users

If the app is in "Testing" status, only the email addresses on the **Test users** list can log in. Add yours:

1. Same page, scroll to **Test users**
2. Click **+ ADD USERS**
3. Add `mathuraditya00@gmail.com` (and any other beta emails)
4. Save

### 3. Add Authorized JavaScript origins to the OAuth client

1. Navigate to: **APIs & Services → Credentials**
2. Click the OAuth client `99472736316-...`
3. Under **Authorized JavaScript origins**, add:
   - `http://localhost:3000`
   - `http://127.0.0.1:3000`
4. Save

### 4. Clear browser cache and retry

Google's OAuth flow caches state. After fixing the consent screen:

- Hard refresh the page (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
- Or open an Incognito window
- Click **Login** on the SafeDeck landing page

## If it's still broken

Common follow-up errors and what they mean:

| Error | Cause | Fix |
|-------|-------|-----|
| `401 invalid_client` | Consent screen unconfigured, or wrong client ID | Steps 1, 3 above |
| `403 access_denied` | Email not on test users list | Step 2 above |
| `redirect_uri_mismatch` | `http://localhost:3000` not in Authorized redirect URIs | Add it in the OAuth client config |
| `This browser or app may not be secure` | Headless / automated browser detected | Open the URL in your real browser, not the test browser |
| `Access blocked: SafeDeck has not completed Google verification` | App is in Testing mode and the user's email is not on the test list | Add the email to test users, or publish the app |

## For the production release

When you move from beta to prod:

1. Move the OAuth consent screen from "Testing" to "In Production"
2. Submit sensitive scopes (`spreadsheets`, `drive`) for Google verification — takes ~2 weeks, free, one-time
3. While verification is pending, only test users can use the sensitive scopes — for non-test users, scope down the login request to just `openid email profile` (those are non-sensitive)
