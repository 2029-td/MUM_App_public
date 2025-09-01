// tokenStorage.ts
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_tokens';

export interface StoredTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export const saveTokens = async (tokens: StoredTokens): Promise<void> => {
  await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(tokens));
};

export const getTokens = async (): Promise<StoredTokens | null> => {
  const json = await SecureStore.getItemAsync(TOKEN_KEY);
  if (!json) return null;
  try {
    return JSON.parse(json) as StoredTokens;
  } catch {
    return null;
  }
};

export const clearTokens = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
};

/**
 * Returns the current access token, or null if none is stored.
 */
export const getAccessToken = async (): Promise<string | null> => {
  const tokens = await getTokens();
  return tokens?.access_token ?? null;
};
