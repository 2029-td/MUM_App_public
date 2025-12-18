import { Alert } from 'react-native';

type Options = {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
};

/**
 * 科目削除の確認ダイアログ（React Native Alert）
 * - Web(document)依存なし
 * - 追加コンポーネント不要
 */
export function showDeleteConfirm(onConfirm: () => void, opts: Options = {}) {
  const {
    title = '確認',
    message = 'この科目を本当に削除しますか？',
    confirmText = '削除する',
    cancelText = 'キャンセル',
  } = opts;

  Alert.alert(
    title,
    message,
    [
      { text: cancelText, style: 'cancel' },
      { text: confirmText, style: 'destructive', onPress: onConfirm },
    ],
    { cancelable: true }
  );
}
