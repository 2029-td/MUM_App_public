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
  Modal,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAppTheme } from '../../hooks/useAppTheme';
import ThemeSelector from './components/ThemeSelector';

const contactUrl =
  'https://docs.google.com/forms/d/e/1FAIpQLSckh5xw6YUm6qpWSZtU23q_WIEhBuQZtEYRz00uYeFhY2Q-HQ/viewform?usp=header';
const privacyUrl = 'https://www.matsulab.org/privacypolicy/mum';
const surveyUrl =
  'https://docs.google.com/forms/d/e/1FAIpQLSfcSzFwk70S0AWYhkS3ZTwYG1m_RTBzggoVyfAgKKgDtEBqnA/viewform?usp=header';

const PolicyScreen = () => {
  const { theme } = useAppTheme();

  // モーダルの開閉
  const [themeModalVisible, setThemeModalVisible] = React.useState(false);

  const openLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert('エラー', 'リンクを開けませんでした。');
        return;
      }
      await Linking.openURL(url);
    } catch (err) {
      console.error('openLink error:', err, 'url:', url);
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
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={iconName} size={20} style={[styles.icon, { color: theme.textColor }]} />
      <Text style={[styles.buttonText, { color: theme.textColor }]}>{label}</Text>
    </Pressable>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.backgroundColor }}
      scrollEnabled={!themeModalVisible} // モーダル表示中は背面スクロールを抑止（任意）
    >
      <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
        {/* モーダルを開くボタン（見た目は既存と同じ） */}
        <Button
          iconName="color-palette-outline"
          label="テーマ設定"
          onPress={() => setThemeModalVisible(true)}
        />

        {/* ページ内のテーマ変更 UI は削除済み */}
        <Button iconName="mail-outline" label="お問い合わせ" onPress={() => openLink(contactUrl)} />
        <Button iconName="clipboard-outline" label="利用者アンケート" onPress={() => openLink(surveyUrl)}/>
        <Button iconName="document-text-outline" label="プライバシーポリシー" onPress={() => openLink(privacyUrl)} />
      </View>

      {/* 中央表示モーダル */}
      <Modal
        visible={themeModalVisible}
        animationType="fade"
        transparent
        statusBarTranslucent
        onRequestClose={() => setThemeModalVisible(false)} // Androidの戻る対策
      >
        <View style={styles.centerRoot}>
          {/* 背景タップで閉じる */}
          <Pressable
            style={styles.backdrop}
            onPress={() => setThemeModalVisible(false)}
            accessibilityRole="button"
            accessibilityLabel="モーダルを閉じる"
          />
          {/* ダイアログ本体 */}
          <View style={[styles.dialog, { backgroundColor: theme.backgroundColor }]}
            accessibilityViewIsModal
            //accessibilityRole="dialog"
          >
            <View style={styles.dialogHeader}>
              <Text style={[styles.dialogTitle, { color: theme.textColor }]}>テーマ設定</Text>
              <Pressable
                onPress={() => setThemeModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="閉じる"
                hitSlop={8}
              >
                <Ionicons name="close" size={22} color={theme.textColor} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 8 }}>
              <ThemeSelector />
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  icon: { marginRight: 12 },
  buttonText: { fontSize: 17, fontWeight: '600' },

  // 中央モーダル用
  centerRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center', // 中央寄せ
    padding: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  dialog: {
    width: '100%',
    maxWidth: 560, // タブレットで横に伸びすぎない
    maxHeight: '80%',
    borderRadius: 16,
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,

    // 影（iOS/Android）
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,

    // 薄い枠（必要に応じて調整）
    borderWidth: Platform.OS === 'ios' ? StyleSheet.hairlineWidth : 0,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dialogTitle: { fontSize: 18, fontWeight: '700' },
});
