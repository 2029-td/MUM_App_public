// src/features/others/components/ThemeSelector.tsx

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useAppTheme } from '../../../hooks/useAppTheme';
import type { ThemePreference } from '~/components/useColorScheme';
import { useStyles } from '~/styles';

const ThemeSelector: React.FC = () => {
  const { theme, themeId, preference, setPreference } = useAppTheme();
  const { colors } = useStyles();
  const isDark = themeId === 'dark';

  const options: Array<{ id: ThemePreference; label: string }> = [
    { id: 'system', label: 'デバイスのテーマを使用' },
    { id: 'light', label: 'ライトテーマ' },
    { id: 'dark', label: 'ダークテーマ' },
  ];

  // 参考UIに近い落ち着いたアクセント
  const accent = isDark ? '#7AB7FF' : '#2F80ED';
  const divider = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)';

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surfaceSolid,
            borderColor: theme.headerColor,
          },
        ]}
      >
        {options.map((o, idx) => {
          const active = o.id === preference;

          return (
            <Pressable
              key={o.id}
              onPress={() => setPreference(o.id)}
              style={({ pressed }) => [
                styles.row,
                pressed && styles.pressed,
              ]}
            >
              {/* Radio */}
              <View
                style={[
                  styles.radioOuter,
                  {
                    borderColor: active
                      ? accent
                      : isDark
                      ? 'rgba(255,255,255,0.35)'
                      : 'rgba(0,0,0,0.28)',
                  },
                ]}
              >
                {active && (
                  <View style={[styles.radioInner, { backgroundColor: accent }]} />
                )}
              </View>

              {/* Label */}
              <Text
                style={[
                  styles.label,
                  {
                    color: theme.textColor,
                    opacity: active ? 1 : isDark ? 0.85 : 0.78,
                    fontWeight: active ? '800' : '600',
                  },
                ]}
              >
                {o.label}
              </Text>

              {/* Divider */}
              {idx !== options.length - 1 && (
                <View style={[styles.divider, { backgroundColor: divider }]} />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

export default ThemeSelector;

const styles = StyleSheet.create({
  root: {
    width: '100%',
    paddingTop: 8,
    paddingBottom: 4,
  },

  card: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },

  row: {
    minHeight: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  pressed: {
    opacity: 0.85,
  },

  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  label: {
    fontSize: 17,
  },

  divider: {
    position: 'absolute',
    left: 16 + 22 + 14,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
  },
});
