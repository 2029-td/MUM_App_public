import { useAppTheme } from '../../../hooks/useAppTheme';
import type { Theme } from '../../timetable/types';

export const useTheme = () => {
  const { currentThemeId, theme, updateTheme } = useAppTheme();
  const getCurrentTheme = (): Theme => theme;

  return {
    currentThemeId,
    getCurrentTheme,
    updateTheme,
  };
};
