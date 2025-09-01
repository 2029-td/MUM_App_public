import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { predefinedThemes } from '../../constants';

interface ThemeModalProps {
  visible: boolean;
  currentThemeId: string;
  onClose: () => void;
  onThemeSelect: (themeId: string) => void;
}

export const ThemeModal: React.FC<ThemeModalProps> = ({
  visible,
  currentThemeId,
  onClose,
  onThemeSelect,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>テーマ設定</Text>

          <ScrollView style={styles.themeList}>
            {predefinedThemes.map(theme => (
              <TouchableOpacity
                key={theme.id}
                style={[
                  styles.themeItem,
                  {
                    backgroundColor: theme.backgroundColor,
                    borderColor: currentThemeId === theme.id ? '#FFF' : 'transparent',
                    borderWidth: 2,
                  }
                ]}
                onPress={() => onThemeSelect(theme.id)}
              >
                <Text style={[styles.themeItemText, { color: theme.textColor }]}>
                  {theme.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>閉じる</Text>
          </TouchableOpacity>
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
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  themeList: {
    maxHeight: 300,
    marginBottom: 15,
  },
  themeItem: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    elevation: 2,
  },
  themeItemText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});