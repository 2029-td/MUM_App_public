// src/features/setting/components/ThemeSettingScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAppTheme } from '../../../hooks/useAppTheme'; // ← ../../../ にする
import ThemeSelector from './ThemeSelector';               // ← 同じcomponents配下なので ./ThemeSelector

export default function ThemeSettingsScreen() {            // ← default export & 名前を複数形に
  const { theme } = useAppTheme();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.backgroundColor }}>
      <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
        <Text style={[styles.title, { color: theme.textColor }]}>テーマ設定</Text>
        <ThemeSelector />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
});
