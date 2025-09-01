import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { storageService } from '../../services/storage';
import type { TimetableTemplate } from '../../types';
import { TemplateShareModal } from './TemplateShareModal';

interface TemplateModalProps {
  visible: boolean;
  templates: TimetableTemplate[];
  currentTemplateId: string;
  onClose: () => void;
  onTemplateSelect: (id: string) => void;
  onTemplateAdd: (name: string) => void;
  onTemplateDelete: (id: string) => void;
  onTemplatesUpdate: () => Promise<void>;
}

export const TemplateModal: React.FC<TemplateModalProps> = ({
  visible,
  templates,
  currentTemplateId,
  onClose,
  onTemplateSelect,
  onTemplateAdd,
  onTemplateDelete,
  onTemplatesUpdate,
}) => {
  const [newTemplateName, setNewTemplateName] = useState('');
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const [selectedTemplateForShare, setSelectedTemplateForShare] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const handleShare = (template: TimetableTemplate) => {
    setSelectedTemplateForShare({
      id: template.id,
      name: template.name,
    });
    setIsShareModalVisible(true);
  };

  const handleDelete = (templateId: string, templateName: string) => {
    Alert.alert(
      '確認',
      `テンプレート "${templateName}" を削除してもよろしいですか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => onTemplateDelete(templateId),
        },
      ]
    );
  };

  const handleAddTemplate = () => {
    if (newTemplateName.trim()) {
      onTemplateAdd(newTemplateName.trim());
      setNewTemplateName('');
    }
  };

  const handleImportSuccess = async () => {
    try {
      // テンプレートを再読み込み
      await onTemplatesUpdate();
      // 現在のテンプレートを再設定
      const updatedTemplates = await storageService.getTemplates();
      if (updatedTemplates.length > 0) {
        const currentTemplate = updatedTemplates.find(t => t.id === currentTemplateId) || updatedTemplates[0];
        onTemplateSelect(currentTemplate.id);
      }
    } catch (error) {
      console.error('Error updating after import:', error);
      Alert.alert('エラー', 'テンプレートの更新に失敗しました');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>時間割テンプレート管理</Text>

          <ScrollView style={styles.templateList}>
            {templates.map(template => (
              <View key={template.id} style={styles.templateItem}>
                <View style={styles.templateInfo}>
                  <Text style={styles.templateName}>{template.name}</Text>
                  {template.id === currentTemplateId && (
                    <Text style={styles.currentLabel}>現在使用中</Text>
                  )}
                </View>
                <View style={styles.templateButtons}>
                  {template.id !== currentTemplateId && (
                    <TouchableOpacity
                      style={styles.selectButton}
                      onPress={() => onTemplateSelect(template.id)}
                    >
                      <Text style={styles.buttonText}>使用する</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={() => handleShare(template)}
                  >
                    <Text style={styles.buttonText}>共有</Text>
                  </TouchableOpacity>
                  {template.id !== 'default' && (
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDelete(template.id, template.name)}
                    >
                      <Text style={styles.buttonText}>削除</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.addTemplateContainer}>
            <TextInput
              style={styles.templateInput}
              value={newTemplateName}
              onChangeText={setNewTemplateName}
              placeholder="新しいテンプレート名"
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              style={[
                styles.addTemplateButton,
                !newTemplateName.trim() && styles.addTemplateButtonDisabled
              ]}
              onPress={handleAddTemplate}
              disabled={!newTemplateName.trim()}
            >
              <Text style={styles.buttonText}>追加</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>閉じる</Text>
          </TouchableOpacity>
        </View>
      </View>

      {selectedTemplateForShare && (
        <TemplateShareModal
          visible={isShareModalVisible}
          onClose={() => {
            setIsShareModalVisible(false);
            setSelectedTemplateForShare(null);
          }}
          templateId={selectedTemplateForShare.id}
          templateName={selectedTemplateForShare.name}
          onImportSuccess={handleImportSuccess}
        />
      )}
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
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  templateList: {
    maxHeight: 300,
    marginBottom: 15,
  },
  templateItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  templateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  templateName: {
    fontSize: 16,
    flex: 1,
    color: '#333',
  },
  currentLabel: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  templateButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  selectButton: {
    backgroundColor: '#2196F3',
    padding: 8,
    borderRadius: 5,
  },
  shareButton: {
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 5,
  },
  deleteButton: {
    backgroundColor: '#F44336',
    padding: 8,
    borderRadius: 5,
  },
  addTemplateContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  templateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
    fontSize: 16,
    color: '#333',
  },
  addTemplateButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    justifyContent: 'center',
    minWidth: 80,
  },
  addTemplateButtonDisabled: {
    backgroundColor: '#ccc',
  },
  closeButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});