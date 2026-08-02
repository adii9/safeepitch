import { GoogleOAuthProvider } from '@react-oauth/google';

// Placeholder clientId used when none is configured. The library requires
// GoogleOAuthProvider as an ancestor of any useGoogleLogin() call. If we
// skip wrapping entirely, those components throw at render time and the
// app unmounts to a black screen. With a placeholder, the buttons render
// but fail at click-time with a clear "not configured" error from Google.
const PLACEHOLDER_CLIENT_ID = 'placeholder-client-id.apps.googleusercontent.com';

export function GoogleAuth({ children }) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const id = clientId && clientId.trim() ? clientId : PLACEHOLDER_CLIENT_ID;
  return <GoogleOAuthProvider clientId={id}>{children}</GoogleOAuthProvider>;
}

export default GoogleAuth;
