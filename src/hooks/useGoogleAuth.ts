// useGoogleAuth.ts
import { useState, useEffect, useCallback } from 'react';
import * as AuthSession from 'expo-auth-session';
import { Platform } from 'react-native';
import { exchangeCode, AuthTokens } from '~/services/authService';
import useTokenRefresh from './useTokenRefresh';
import * as tokenStorage from '~/services/tokenStorage';

interface AuthState {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export default function useGoogleAuth() {
  const [authState, setAuthState] = useState<AuthState | null>(null);
  const [loading, setLoading] = useState(false);

  const discovery = {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
    revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
  } as const;

  const redirectUri = Platform.select({
    ios: process.env.REDIRECT_URI_IOS!,
    android: process.env.REDIRECT_URI_ANDROID!,
    web: process.env.REDIRECT_URI_WEB!,
  });
  console.log('useGoogleAuth redirectUri:', redirectUri);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: Platform.select({
        ios: process.env.GOOGLE_IOS_CLIENT_ID!,
        android: process.env.GOOGLE_ANDROID_CLIENT_ID!,
        web: process.env.GOOGLE_WEB_CLIENT_ID!,
      }),
      redirectUri,
      scopes: [
        'openid',
        'profile',
        'email',
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events.readonly',
      ],
      responseType: AuthSession.ResponseType.Code,
      extraParams: { access_type: 'offline', prompt: 'consent' },
    },
    discovery
  );

  const signIn = useCallback(async () => {
    setLoading(true);
    try {
      const result = await promptAsync();
      if (result.type === 'success' && result.params.code) {
        const codeVerifier = request.codeVerifier!;
        const tokens = await exchangeCode(result.params.code, codeVerifier);
        const expiresAt = Date.now() + tokens.expires_in * 1000;
        await tokenStorage.saveTokens({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: expiresAt,
        });
        setAuthState({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresIn: tokens.expires_in,
        });
      }
    } catch (error) {
      console.error('Sign in error', error);
    } finally {
      setLoading(false);
    }
  }, [promptAsync, request]);

  const signOut = useCallback(async () => {
    await tokenStorage.clearTokens();
    setAuthState(null);
  }, []);

  useEffect(() => {
    (async () => {
      const stored = await tokenStorage.getTokens();
      if (stored) {
        const expiresIn = (stored.expires_at - Date.now()) / 1000;
        setAuthState({
          accessToken: stored.access_token,
          refreshToken: stored.refresh_token,
          expiresIn,
        });
      }
    })();
  }, []);

  useTokenRefresh(
    authState?.refreshToken ?? null,
    authState?.expiresIn ?? null,
    async (tokens: AuthTokens) => {
      const expiresAt = Date.now() + tokens.expires_in * 1000;
      await tokenStorage.saveTokens({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt,
      });
      setAuthState({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresIn: tokens.expires_in,
      });
    },
    signOut
  );

  return {
    signIn,
    signOut,
    accessToken: authState?.accessToken,
    loading,
  };
}
