import React from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Text,
  Alert,
  Linking,
  Platform,
  ScrollView,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAppTheme } from '../../hooks/useAppTheme';
import ThemeSelector from './components/ThemeSelector';

const contactUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSckh5xw6YUm6qpWSZtU23q_WIEhBuQZtEYRz00uYeFhY2Q-HQ/viewform?usp=header';
const privacyUrl = 'https://www.matsulab.org/privacypolicy/mum';

const PolicyScreen = () => {
  const { theme } = useAppTheme();

  const openLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
  
      if (!supported) {
        Alert.alert('エラー', 'リンクを開けませんでした。');
        return;
      }
  
      await Linking.openURL(url);
    } catch (err) {
      // デバッグ用ログ（開発機では Metro で確認できます）
      console.error('openLink error:', err, 'url:', url);
  
      // ユーザー向けエラー表示（既存の文言を維持）
      Alert.alert('エラー', 'リンクを開く中に問題が発生しました。');
    }
  };

  const Button = ({
    iconName,
    label,
    onPress,
  }: {
    iconName: React.ComponentProps<typeof Ionicons>['name'];
    label: string;
    onPress: () => void;
  }) => (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: theme.cellBackgroundColor,
          borderColor: theme.headerColor,
          borderWidth: 1,
        },
        pressed && styles.buttonPressed,
      ]}
      onPress={onPress}
    >
      <Ionicons name={iconName} size={20} style={[styles.icon, { color: theme.textColor }]} />
      <Text style={[styles.buttonText, { color: theme.textColor }]}>{label}</Text>
    </Pressable>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.backgroundColor }}>
      <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
        {/* ★ テーマ切替を設定タブに設置 */}
        <ThemeSelector />

        <Button iconName="mail-outline" label="お問い合わせ" onPress={() => openLink(contactUrl)} />
        <Button iconName="document-text-outline" label="プライバシーポリシー" onPress={() => openLink(privacyUrl)} />
      </View>
    </ScrollView>
  );
};

export default PolicyScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 32,
    paddingHorizontal: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '95%',
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginVertical: 12,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonPressed: {
    opacity: Platform.OS === 'ios' ? 0.6 : 0.8,
  },
  icon: {
    marginRight: 12,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
  },
});
