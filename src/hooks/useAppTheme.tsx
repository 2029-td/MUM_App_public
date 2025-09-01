import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
    useCallback,
  } from 'react';
  import { storageService } from '../features/timetable/services/storage';
  import { predefinedThemes } from '../features/timetable/constants';
  import type { Theme } from '../features/timetable/types';
  
  type ThemeCtx = {
    currentThemeId: string;
    theme: Theme;
    updateTheme: (id: string) => Promise<void>;
  };
  
  const ThemeContext = createContext<ThemeCtx | undefined>(undefined);
  
  export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
  }) => {
    const [currentThemeId, setCurrentThemeId] = useState<string>('default');
  
    useEffect(() => {
      (async () => {
        try {
          const id = await storageService.getThemeId();
          setCurrentThemeId(id ?? 'default');
        } catch {
          setCurrentThemeId('default');
        }
      })();
    }, []);
  
    const theme = useMemo(
      () => predefinedThemes.find((t) => t.id === currentThemeId) ?? predefinedThemes[0],
      [currentThemeId]
    );
  
    const updateTheme = useCallback(async (id: string) => {
      setCurrentThemeId(id);
      await storageService.saveThemeId(id);
    }, []);
  
    const value = useMemo(
      () => ({ currentThemeId, theme, updateTheme }),
      [currentThemeId, theme, updateTheme]
    );
  
    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
  };
  
  export const useAppTheme = () => {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useAppTheme must be used within ThemeProvider');
    return ctx;
  };
  