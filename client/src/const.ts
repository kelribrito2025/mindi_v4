export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Safe base64 encoding that handles Unicode characters (Safari compatible)
const safeBase64Encode = (str: string): string => {
  try {
    // First try standard btoa
    return btoa(str);
  } catch (e) {
    // If btoa fails (e.g., with Unicode), use a safer approach
    try {
      return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
        (_, p1) => String.fromCharCode(parseInt(p1, 16))
      ));
    } catch (e2) {
      // Last resort: return a simple encoded version
      console.warn('[Auth] Base64 encoding fallback used');
      return encodeURIComponent(str);
    }
  }
};

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  // State deve conter apenas o caminho relativo de redirecionamento pós-login
  // O backend valida que o state NÃO seja uma URL absoluta (segurança contra open redirect)
  const state = safeBase64Encode("/");

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId ?? "");
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
