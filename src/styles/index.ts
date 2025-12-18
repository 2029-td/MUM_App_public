// src/styles/index.ts
//
// - グローバルの色計算（surfaceSolid / modalSurface / inputBg 等）をまとめる
// - useAppTheme の新API（themeId）に合わせる

import { StyleSheet } from 'react-native';
import { useAppTheme } from '~/hooks/useAppTheme';
import { solidSurfaceFromTheme, compositeOver } from './color';

export const useStyles = () => {
  const { themeId, theme } = useAppTheme();
  const isDark = themeId === 'dark';

  const surfaceSolid = solidSurfaceFromTheme(theme.cellBackgroundColor, theme.backgroundColor);

  // モーダル（外枠ではなく「カード色として使う面」）
  const modalSurface = isDark
    ? compositeOver('rgba(255,255,255,0.12)', surfaceSolid)  // ダークは+12%明るく
    : compositeOver('rgba(255,255,255,0.55)', surfaceSolid); // ライトは+55%明るく

  // 入力欄の背景：ライトは白、ダークは「カードよりさらに明るい」色を合成
  const inputBg = isDark
    ? compositeOver('rgba(255,255,255,0.10)', modalSurface)  // カードより一段明るい
    : '#FFFFFF';

  const colors = {
    background: theme.backgroundColor,
    text: theme.textColor,
    border: theme.headerColor,
    surface: theme.cellBackgroundColor,
    surfaceSolid,
    modalSurface,
    inputBg,
    inputText: isDark ? '#ECEFF4' : '#2c3e50',

    // ボタンの塗り（基本はカード面）
    buttonSolidBg: modalSurface,
    buttonSolidText: theme.textColor,

    // セマンティックカラー（必要ならAPP_THEMESへ移してもOK）
    success: '#4CAF50',
    warn: '#FFC107',
    danger: '#E57373',
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
