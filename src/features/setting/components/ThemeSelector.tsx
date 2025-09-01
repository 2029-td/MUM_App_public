import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { predefinedThemes } from '../../timetable/constants';

const ThemeSelector: React.FC = () => {
  const { currentThemeId, updateTheme, theme } = useAppTheme();

  return (
    <View style={{ width: '100%', gap: 12, marginBottom: 24 }}>
      <Text
        style={{
          fontSize: 16,
          fontWeight: 'bold',
          color: theme.textColor,
          marginBottom: 8,
        }}
      >
        テーマ
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {predefinedThemes.map((t) => (
          <TouchableOpacity
          key={t.id}
          accessibilityRole="button"
          onPress={() => updateTheme(t.id)}
          style={{
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 10,
            borderWidth: t.id === currentThemeId ? 2 : 1,
            borderColor:
              t.id === currentThemeId ? theme.textColor : 'rgba(0,0,0,0.2)',
            backgroundColor: t.backgroundColor,
            marginRight: 8,
            marginBottom: 8,
            ...(t.id === currentThemeId && { shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4 }),
          }}
        >
          <Text style={{ color: t.textColor, fontWeight: '600' }}>{t.name}</Text>
        </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default ThemeSelector;
