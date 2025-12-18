// src/hooks/useAppTheme.tsx

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';

import type { Theme } from '../features/timetable/types';
import { storageService } from '../features/timetable/services/storage';

// ★ ここからテーマ定義を読む
import { APP_THEMES, resolveThemeId, useColorScheme, type ThemePreference, type ThemeId } from '~/components/useColorScheme';

type ThemeCtx = {
  // 実際に適用されているテーマ（light/dark）
  themeId: ThemeId;
  theme: Theme;

  // ユーザー設定（system/light/dark）
  preference: ThemePreference;

  // Others タブのUIから変更
  setPreference: (pref: ThemePreference) => Promise<void>;
};

const ThemeContext = createContext<ThemeCtx | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme(); // 'light' | 'dark' | null
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  // 初回：保存済み設定を読み込む
  useEffect(() => {
    (async () => {
      try {
        const pref = await storageService.getThemePreference(); // 'system' | 'light' | 'dark'
        setPreferenceState(pref);
      } catch {
        setPreferenceState('system');
      }
    })();
  }, []);

  // preference + systemScheme から最終 themeId を決定
  const themeId = useMemo<ThemeId>(() => {
    return resolveThemeId(preference, systemScheme);
  }, [preference, systemScheme]);

  const theme = useMemo(() => APP_THEMES[themeId], [themeId]);

  const setPreference = useCallback(async (pref: ThemePreference) => {
    setPreferenceState(pref);
    await storageService.saveThemePreference(pref);
  }, []);

  const value = useMemo(
    () => ({ themeId, theme, preference, setPreference }),
    [themeId, theme, preference, setPreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useAppTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used within ThemeProvider');
  return ctx;
};
