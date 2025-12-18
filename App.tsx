// App.tsx
//
// - useAppTheme の新API（themeId）に追従
// - Navigation / Paper のテーマを統一
// - TabBar の配色も themeId ベースで切替

import 'react-native-gesture-handler';
import React, { useMemo } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme as NavLight, DarkTheme as NavDark } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Provider as PaperProvider, Portal, MD3LightTheme as PaperLight, MD3DarkTheme as PaperDark } from 'react-native-paper';

import TimetableScreen from './src/features/timetable/screen';
import MapScreen from './src/features/map/screen';
import TodoScreen from './src/features/todo/screen';
import OthersScreen from './src/features/others/screen';

// ★ グローバルテーマ
import { ThemeProvider, useAppTheme } from './src/hooks/useAppTheme';

const Tab = createBottomTabNavigator();

const AppShell = () => {
  const { themeId, theme } = useAppTheme();

  // react-navigation のテーマ（ナビゲーションの内部色）
  const navTheme = themeId === 'dark' ? NavDark : NavLight;

  // react-native-paper のテーマ（Paper コンポーネント群）
  const paperTheme = useMemo(() => {
    const base = themeId === 'dark' ? PaperDark : PaperLight;
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
  }, [themeId, theme]);

  // ▼ TabBar の見た目（必要最低限の分岐）
  const navBg = themeId === 'dark' ? '#1F2B38' : theme.backgroundColor;
  const isDarkishNav = themeId === 'dark';

  const tabActive = isDarkishNav ? '#FFFFFF' : theme.textColor;

  // 非アクティブは薄くしてコントラストを強くする
  const tabInactive = isDarkishNav
    ? 'rgba(255,255,255,0.35)'
    : 'rgba(44,62,80,0.35)';

  return (
    <PaperProvider theme={paperTheme}>
      <Portal.Host>
        <NavigationContainer theme={navTheme}>
          <Tab.Navigator
            id={undefined}
            screenOptions={({ route }) => ({
              headerShown: false,
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
                return <Ionicons name={iconMap[route.name]} color={color} size={size} />;
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
              component={OthersScreen}
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
