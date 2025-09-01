// useTokenRefresh.ts
import { useEffect, useRef } from 'react';
import { refreshGoogleToken, AuthTokens } from '~/services/authService';

export default function useTokenRefresh(
  refreshToken: string | null,
  expiresIn: number | null,
  onUpdate: (tokens: AuthTokens) => void,
  onRefreshFail?: () => void
) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (!refreshToken || !expiresIn) return;

    const delay = expiresIn * 1000 - 60 * 1000; // 1 minute before expiry
    timerRef.current = setTimeout(async () => {
      try {
        const tokens = await refreshGoogleToken(refreshToken);
        onUpdate(tokens);
      } catch (e) {
        console.error('Token refresh failed', e);
        onRefreshFail && onRefreshFail();
      }
    }, delay > 0 ? delay : 0);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [refreshToken, expiresIn, onUpdate, onRefreshFail]);
}