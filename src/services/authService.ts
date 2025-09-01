// authService.ts
import { Platform } from 'react-native';

export type AuthTokens = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

const clientId = Platform.select({
  ios: process.env.GOOGLE_IOS_CLIENT_ID!,
  android: process.env.GOOGLE_ANDROID_CLIENT_ID!,
  web: process.env.GOOGLE_WEB_CLIENT_ID!,
});

const redirectUri = Platform.select({
  ios: process.env.REDIRECT_URI_IOS!,
  android: process.env.REDIRECT_URI_ANDROID!,
  web: process.env.REDIRECT_URI_WEB!,
});

export async function exchangeCode(code: string, codeVerifier: string): Promise<AuthTokens> {
  console.log('exchangeCode called with code:', code);
  console.log('exchangeCode clientId:', clientId, 'redirectUri:', redirectUri);
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: clientId!,
    redirect_uri: redirectUri!,
    code_verifier: codeVerifier,
  });
  console.log('exchangeCode request body:', params.toString());
  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  if (!response.ok) {
    const text = await response.text();
    console.error('[exchangeCode error]', response.status, text);
    throw new Error(`Exchange code failed: ${response.status}`);
  }
  const data = await response.json();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
  };
}

export async function refreshGoogleToken(
  refreshToken: string
): Promise<AuthTokens> {
  console.log('refreshGoogleToken called with refreshToken:', refreshToken);
  console.log('refreshGoogleToken clientId:', clientId);
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId!,
  });
  console.log('refreshGoogleToken request body:', params.toString());
  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  if (!response.ok) {
    throw new Error(`Refresh token failed: ${response.status}`);
  }
  const data = await response.json();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? refreshToken,
    expires_in: data.expires_in,
  };
}