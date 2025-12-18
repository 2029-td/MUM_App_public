// src/components/useColorScheme.ts
//
// - 端末のテーマ取得（react-native の useColorScheme）をラップ
// - アプリで使う light/dark テーマ定義をここに集約
// - system/light/dark の preference から最終 themeId を解決する関数も提供

import { useColorScheme as useRNColorScheme } from 'react-native';
import type { Theme } from '~/features/timetable/types';

export type ThemeId = 'light' | 'dark';
export type ThemePreference = 'system' | 'light' | 'dark';

// アプリ内テーマは light/dark の2本のみ
export const APP_THEMES: Record<ThemeId, Theme> = {
  light: {
    id: 'light',
    name: 'ライト',
    backgroundColor: '#f5f6fa',
    textColor: '#2c3e50',
    headerColor: 'rgba(0, 0, 0, 0.05)',
    cellBackgroundColor: 'rgba(255, 255, 255, 0.8)',
    headerButtonColor: 'rgba(0, 0, 0, 0.04)',
  },
  dark: {
    id: 'dark',
    name: 'ダーク',
    backgroundColor: '#2c3e50',
    textColor: '#FFFFFF',
    headerColor: 'rgba(0, 0, 0, 0.3)',
    cellBackgroundColor: 'rgba(255, 255, 255, 0.05)',
    headerButtonColor: 'rgba(0, 0, 0, 0.1)',
  },
};

/**
 * preference + 端末テーマ から、最終的な themeId(light/dark) を返す
 */
export const resolveThemeId = (
  preference: ThemePreference,
  systemScheme: 'light' | 'dark' | null | undefined
): ThemeId => {
  if (preference === 'light' || preference === 'dark') return preference;
  return systemScheme === 'dark' ? 'dark' : 'light';
};

/**
 * 端末テーマ（light/dark）を返す（null の場合は light 扱いにしないで、そのまま返す）
 * ※必要なら useAppTheme 側で fallback します
 */
export const useColorScheme = () => {
  return useRNColorScheme(); // 'light' | 'dark' | null
};
