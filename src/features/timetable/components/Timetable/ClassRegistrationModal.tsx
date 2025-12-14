// src/features/timetable/components/Timetable/ClassRegistrationModal.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import { colorPalette } from '../../constants';
import type { Subject } from '../../types';
import { useAppTheme } from '~/hooks/useAppTheme';

interface Props {
  visible: boolean;
  subject: Subject | null;
  selectedDay: string;
  selectedPeriod: number;
  onClose: () => void;
  onConfirm: (color: string) => void;
}

export const ClassRegistrationModal: React.FC<Props> = ({
  visible,
  subject,
  selectedDay,
  selectedPeriod,
  onClose,
  onConfirm,
}) => {
  const { theme } = useAppTheme();

  const [localSubject, setLocalSubject] = useState<Subject | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>(colorPalette[0]);

  useEffect(() => {
    if (visible && subject) {
      setLocalSubject({ ...subject });
      setSelectedColor(subject.color || colorPalette[0]);
    } else if (!visible) {
      setLocalSubject(null);
    }
  }, [visible, subject]);

  if (!visible || !localSubject) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          
          {/* ヘッダー：タイトル ＋ × ボタン */}
          <View style={styles.header}>
            <Text style={styles.modalTitle}>
              {`${selectedDay}曜${selectedPeriod}限\n${localSubject.name}`}
            </Text>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          {/* 科目詳細 */}
          <View style={styles.subjectDetailContainer}>
            <View style={styles.subjectDetailRow}>
              <Text style={styles.subjectDetailLabel}>教員：</Text>
              <Text
                style={styles.subjectDetailValue}
                numberOfLines={0}
              >
                {localSubject.professor}
              </Text>
            </View>

            <View style={styles.subjectDetailRow}>
              <Text style={styles.subjectDetailLabel}>教室：</Text>
              <Text style={styles.subjectDetailValue}>
                {localSubject.room}
              </Text>
            </View>

            <View style={styles.subjectDetailRow}>
              <Text style={styles.subjectDetailLabel}>校舎：</Text>
              <Text style={styles.subjectDetailValue}>
                {localSubject.campus}
              </Text>
            </View>

            <View style={styles.subjectDetailRow}>
              <Text style={styles.subjectDetailLabel}>単位：</Text>
              <Text style={styles.subjectDetailValue}>
                {localSubject.credits && localSubject.credits > 0
                  ? `${localSubject.credits}`
                  : '-'}
              </Text>
            </View>
          </View>

          {/* 色選択 */}
          <Text style={styles.sectionTitle}>色を選択</Text>

          <View style={styles.colorGrid}>
            {colorPalette.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorCircle,
                  { backgroundColor: color },
                  selectedColor === color && styles.selectedCircle,
                ]}
                onPress={() => setSelectedColor(color)}
              />
            ))}
          </View>

          {/* 登録ボタン */}
          <TouchableOpacity
            style={[
              styles.confirmButton,
              { backgroundColor: theme.backgroundColor },
            ]}
            onPress={() => onConfirm(selectedColor)}
          >
            <Text style={[styles.confirmText,{ color: theme.textColor }]}>登録</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },

  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    paddingVertical: 8,
  },

  closeButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: 4,
  },

  closeButtonText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#555',
  },

  subjectDetailContainer: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },

  subjectDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },

  subjectDetailLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    marginRight: 4,
  },

  subjectDetailValue: {
    flex: 1,
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
    flexWrap: 'wrap',
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 8,
  },

  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 16,
  },

  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },

  selectedCircle: {
    borderWidth: 3,
    borderColor: '#000',
  },

  confirmButton: {
    marginTop: 4,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },

  confirmText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
