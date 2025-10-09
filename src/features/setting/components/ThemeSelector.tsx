import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { predefinedThemes } from '../../timetable/constants';

const ThemeSelector: React.FC = () => {
  const { currentThemeId, updateTheme, theme } = useAppTheme();

  return (
    <View style={{ width: '100%', gap: 12, marginBottom: 24 }}>
      <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.textColor, marginBottom: 8 }} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {predefinedThemes.map((t) => {
          const active = t.id === currentThemeId;
          return (
            <Pressable
              key={t.id}
              accessibilityRole="button"
              onPress={() => updateTheme(t.id)}
              android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 10,
                borderWidth: active ? 2 : 1,
                borderColor: active ? theme.textColor : 'rgba(0,0,0,0.2)',
                backgroundColor: t.backgroundColor,
                marginRight: 8,
                marginBottom: 8,
                overflow: 'hidden',
              }}
            >
              <Text style={{ color: t.textColor, fontWeight: '600' }}>{t.name}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

export default ThemeSelector;
