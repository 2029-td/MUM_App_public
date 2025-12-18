// src/features/timetable/components/Timetable/TemplateShareModal.tsx

import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { storageService } from '../../services/storage';

// ★ 追加：テーマ
import { useAppTheme } from '~/hooks/useAppTheme';
import { compositeOver } from '~/styles/color';

interface TemplateShareModalProps {
  visible: boolean;
  onClose: () => void;
  templateId: string;
  templateName: string;
  onImportSuccess: () => Promise<void>;
}

export const TemplateShareModal: React.FC<TemplateShareModalProps> = ({
  visible,
  onClose,
  templateId,
  templateName,
  onImportSuccess,
}) => {
  const { theme, themeId } = useAppTheme();
  const isDark = themeId === 'dark';

  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async () => {
    try {
      setIsLoading(true);
      const data = await storageService.exportTemplateData(templateId);
      const jsonString = JSON.stringify(data, null, 2);
      const fileName = `template_${templateName.replace(/\s+/g, '_')}_${templateId}.json`;
      const path = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(path, jsonString);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path, {
          mimeType: 'application/json',
          dialogTitle: `時間割テンプレート「${templateName}」を共有`,
          UTI: 'public.json',
        });
      } else {
        Alert.alert('エラー', 'ファイル共有がこのデバイスでは利用できません。');
      }
    } catch (error) {
      console.error('Error exporting template:', error);
      Alert.alert('エラー', '時間割の共有に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    try {
      setIsLoading(true);

      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.assets && result.assets.length > 0) {
        const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
        const importedData = JSON.parse(fileContent);

        await storageService.importTemplateData(importedData);
        await onImportSuccess();

        await new Promise(resolve => setTimeout(resolve, 500));

        Alert.alert('成功', '時間割を取り込みました', [{ text: 'OK', onPress: onClose }]);
      }
    } catch (error) {
      console.error('Error importing template:', error);
      Alert.alert('エラー', '時間割の取り込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const overlayBg = 'rgba(0,0,0,0.55)';

  const cardBg = isDark
    ? compositeOver('rgba(255,255,255,0.10)', theme.backgroundColor)
    : compositeOver('rgba(0,0,0,0.06)', '#FFFFFF');

  const borderColor = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)';

  const mutedText = isDark ? 'rgba(255,255,255,0.60)' : 'rgba(0,0,0,0.55)';

  const loadingCardBg = isDark
    ? compositeOver('rgba(0,0,0,0.20)', cardBg)
    : compositeOver('rgba(0,0,0,0.06)', cardBg);

  const exportBg = isDark ? '#2E7D32' : '#4CAF50';
  const importBg = isDark ? '#1E5AA8' : '#2196F3';

  const buttonBorder = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.14)';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: overlayBg }]}>
        <View style={[styles.modalContent, { backgroundColor: cardBg, borderColor, borderWidth: 1 }]}>

          {/* ✅ 右上の「×」閉じるボタン */}
          <TouchableOpacity onPress={onClose} style={styles.closeIconButton}>
            <Text style={[styles.closeIcon, { color: theme.textColor }]}>×</Text>
          </TouchableOpacity>

          <Text style={[styles.title, { color: theme.textColor }]}>時間割の共有</Text>

          {isLoading ? (
            <View style={[styles.loadingContainer, { backgroundColor: loadingCardBg, borderColor, borderWidth: 1 }]}>
              <ActivityIndicator size="large" color={isDark ? 'rgba(255,255,255,0.85)' : '#2E7D32'} />
              <Text style={[styles.loadingText, { color: mutedText }]}>処理中...</Text>
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.button, styles.exportButton, { backgroundColor: exportBg, borderColor: buttonBorder, borderWidth: 1 }]}
                onPress={handleExport}
              >
                <Text style={styles.buttonText}>共有する</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.importButton, { backgroundColor: importBg, borderColor: buttonBorder, borderWidth: 1 }]}
                onPress={handleImport}
              >
                <Text style={styles.buttonText}>取り込む</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor は動的に差し込み
    padding: 16,
  },
  modalContent: {
    // backgroundColor は動的に差し込み
    padding: 20,
    borderRadius: 12,
    width: '80%',
    maxWidth: 400,
    elevation: 5,
    // border は動的に差し込み
  },

  /* ✅ 右上の×ボタン */
  closeIconButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 22,
    fontWeight: 'bold',
  },

  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },

  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },

  button: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  exportButton: {},
  importButton: {},

  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
