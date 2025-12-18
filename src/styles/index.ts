// src/styles/index.ts

import { StyleSheet } from 'react-native';
import { useAppTheme } from '~/hooks/useAppTheme';
import { solidSurfaceFromTheme, compositeOver } from './color';

export const useStyles = () => {
  const { theme, themeId } = useAppTheme();
  const isDark = themeId === 'dark';

  const surfaceSolid = solidSurfaceFromTheme(
    theme.cellBackgroundColor,
    theme.backgroundColor
  );

  // モーダル（カードとして使う面）
  const modalSurface = isDark
    ? compositeOver('rgba(255,255,255,0.05)', surfaceSolid)
    : compositeOver('rgba(255,255,255,0.55)', surfaceSolid);

  // 入力欄の背景
  const inputBg = isDark
    ? compositeOver('rgba(255,255,255,0.10)', modalSurface)
    : '#FFFFFF';

  // ===== Search（検索バー） =====
  const searchBarBg = isDark
    ? compositeOver('rgba(255,255,255,0.15)', theme.backgroundColor) // ダークは少し明るく
    : compositeOver('rgba(0,0,0,0.01)', theme.backgroundColor);      // ライトは少しだけ暗く

  const searchBarBorder = isDark
    ? 'rgba(255,255,255,0.14)'
    : 'rgba(0,0,0,0.10)';

  const searchBarPlaceholder = isDark
    ? 'rgba(236,239,244,0.55)'
    : 'rgba(44,62,80,0.45)';

  const searchBarText = isDark ? '#ECEFF4' : '#2c3e50';

  const searchResultBg = isDark
    ? compositeOver('rgba(255,255,255,0.08)', theme.backgroundColor)
    : '#FFFFFF';

  const searchResultDivider = isDark
    ? 'rgba(255,255,255,0.10)'
    : 'rgba(0,0,0,0.08)';

  /**
   * =========================
   * Timetable（表）のベース配色
   * - 曜日セル: header
   * - 数字セル: index
   * - 登録セル: add
   */
  const timetableHeaderBg = isDark
    ? compositeOver('rgba(255,255,255,0.06)', theme.backgroundColor)
    : compositeOver('rgba(0,0,0,0.06)', theme.backgroundColor); 

  const timetableIndexBg = isDark
    ? compositeOver('rgba(255,255,255,0.06)', theme.backgroundColor)
    : compositeOver('rgba(0,0,0,0.06)', theme.backgroundColor); 

  const timetableAddBg = isDark
    ? compositeOver('rgba(255,255,255,0.12)', theme.backgroundColor)
    : compositeOver('rgba(0,0,0,0.02)', theme.backgroundColor);

  // 罫線
  const timetableGridLine = isDark
    ? 'rgba(255,255,255,0.5)'
    : 'rgba(0,0,0,0.25)';

  // ＋ボタン
  const timetablePlusColor = isDark
    ? 'rgba(255,255,255,0.6)'
    : 'rgba(0,0,0,0.6)';

  const colors = {
    background: theme.backgroundColor,
    text: theme.textColor,
    border: theme.headerColor,
    surface: theme.cellBackgroundColor,
    surfaceSolid,
    modalSurface,
    inputBg,
    inputText: isDark ? '#ECEFF4' : '#2c3e50',
    buttonSolidBg: modalSurface,
    buttonSolidText: theme.textColor,
    success: '#4CAF50',
    warn: '#FFC107',
    danger: '#E57373',

    // 検索バー
    searchBarBg,
    searchBarBorder,
    searchBarPlaceholder,
    searchBarText,
    searchResultBg,
    searchResultDivider,

    // 時間割表
    timetableHeaderBg,
    timetableIndexBg,
    timetableAddBg,
    timetableGridLine,
    timetablePlusColor,
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    todoItem: {
      backgroundColor: colors.surfaceSolid,
      borderRadius: 12,
      elevation: 2,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
      marginHorizontal: 10,
      marginVertical: 6,
    },
    todoItemRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    fab: {
      position: 'absolute',
      right: 16,
      bottom: 16,
    },
  });

  return { styles, colors };
};
