import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
  import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { storageService } from '../../services/storage';

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

        Alert.alert('成功', '時間割を取り込みました', [
          { text: 'OK', onPress: onClose }
        ]);
      }
    } catch (error) {
      console.error('Error importing template:', error);
      Alert.alert('エラー', '時間割の取り込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>

          {/* ✅ 右上の「×」閉じるボタン */}
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeIconButton}
          >
            <Text style={styles.closeIcon}>×</Text>
          </TouchableOpacity>

          <Text style={styles.title}>時間割の共有</Text>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.loadingText}>処理中...</Text>
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.button, styles.exportButton]}
                onPress={handleExport}
              >
                <Text style={styles.buttonText}>共有する</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.importButton]}
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    maxWidth: 400,
    elevation: 5,
  },

  /* ✅ 追加: 右上の × ボタン */
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
    color: '#333',
    fontWeight: 'bold',
  },

  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  button: {
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: 'center',
  },
  exportButton: { backgroundColor: '#4CAF50' },
  importButton: { backgroundColor: '#2196F3' },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
