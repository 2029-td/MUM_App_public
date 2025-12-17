// App.tsx

import 'react-native-gesture-handler';
import React, { useMemo } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  NavigationContainer,
  DefaultTheme as NavLight,
  DarkTheme as NavDark,
} from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  Provider as PaperProvider,
  Portal,
  MD3LightTheme as PaperLight,
  MD3DarkTheme as PaperDark,
} from 'react-native-paper';

import TimetableScreen from './src/features/timetable/screen';
import MapScreen from './src/features/map/screen';
import TodoScreen from './src/features/todo/screen';
import SettingsScreen from './src/features/others/screen';

// ★ 追加：グローバルテーマ
import { ThemeProvider, useAppTheme } from './src/hooks/useAppTheme';

const Tab = createBottomTabNavigator();

const AppShell = () => {
  const { currentThemeId, theme } = useAppTheme();

  const navTheme = currentThemeId === 'dark' ? NavDark : NavLight;

  const paperTheme = useMemo(() => {
    const base = currentThemeId === 'dark' ? PaperDark : PaperLight;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: theme.backgroundColor,
        surface: theme.cellBackgroundColor,
        primary: theme.textColor,
        onPrimary: theme.backgroundColor,
        onSurface: theme.textColor,
      },
    };
  }, [currentThemeId, theme]);

  // ▼ ナビゲーション（ヘッダー／フッター）の見た目をここで統一
  const NAV_BG_BY_THEME: Record<string, string> = {
    default: '#3D527F',
    dark:    '#1F2B38',
    light:   theme.backgroundColor,
  };
  const navBg        = NAV_BG_BY_THEME[currentThemeId] ?? NAV_BG_BY_THEME.default;
  const isDarkishNav = currentThemeId === 'default' || currentThemeId === 'dark';
  const navFg        = isDarkishNav ? '#FFFFFF' : theme.textColor; // lightは濃い文字
  const tabActive    = navFg; // アクティブタブは常に明るい白で強調

  // 非アクティブタブはより暗く（薄く）してコントラストを強くする
  const tabInactive  = isDarkishNav 
    ? 'rgba(255,255,255,0.35)' // dark系: 薄い白
    : 'rgba(44,62,80,0.35)'; // light系: 薄い黒

  return (
    <PaperProvider theme={paperTheme}>
      <Portal.Host>
        <NavigationContainer theme={navTheme}>
          <Tab.Navigator
            id={undefined}
            screenOptions={({ route }) => ({
              headerShown: false,
              // ★ フッター(TabBar)を曜日ヘッダー色に
              tabBarStyle: {
                backgroundColor: navBg,
                borderTopColor: isDarkishNav
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(0,0,0,0.08)',
              },
              tabBarActiveTintColor: tabActive,
              tabBarInactiveTintColor: tabInactive,
              tabBarIcon: ({ color, size }) => {
                const iconMap: Record<
                  string,
                  React.ComponentProps<typeof Ionicons>['name']
                > = {
                  timetable: 'calendar',
                  Map: 'map',
                  'todo-list': 'list',
                  others: 'ellipsis-horizontal',
                };
                return (
                  <Ionicons name={iconMap[route.name]} color={color} size={size} />
                );
              },
            })}
          >
            <Tab.Screen
              name="timetable"
              component={TimetableScreen}
              options={{ title: '時間割' }}
            />
            <Tab.Screen
              name="Map"
              component={MapScreen}
              options={{ title: 'マップ' }}
            />
            <Tab.Screen
              name="todo-list"
              component={TodoScreen}
              options={{ title: 'ToDoリスト' }}
            />
            <Tab.Screen
              name="others"
              component={SettingsScreen}
              options={{ title: 'その他' }}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </Portal.Host>
    </PaperProvider>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      {/* ★ 全体を ThemeProvider で包む */}
      <ThemeProvider>
        <AppShell />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
