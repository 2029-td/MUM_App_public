// src/features/timetable/components/Exam/ExamModal.tsx

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Alert } from 'react-native';
import type { Exam, Subject } from '../../types';
import { ExamForm } from './ExamForm';
import { useAppTheme } from '~/hooks/useAppTheme';
import { compositeOver } from '~/styles/color';

interface ExamModalProps {
  visible: boolean;
  exam: Exam | null;
  examDate: Date;
  showDatePicker: boolean;
  subjects: Subject[];
  onClose: () => void;
  onSave: (exam: Omit<Exam, 'id'> & { id?: string }) => void;
  onDelete: (id: string) => void;
  onDateChange: (date: Date) => void;
  onDatePickerVisibilityChange: (visible: boolean) => void;
}

export const ExamModal: React.FC<ExamModalProps> = ({
  visible,
  exam,
  examDate,
  showDatePicker,
  subjects,
  onClose,
  onSave,
  onDelete,
  onDateChange,
  onDatePickerVisibilityChange,
}) => {
  const { theme, themeId } = useAppTheme();
  const isDark = themeId === 'dark';

  const [localExam, setLocalExam] = React.useState<Partial<Exam>>({
    subjectId: '',
    date: '',
    location: '',
    note: '',
  });

  useEffect(() => {
    if (!visible) return;

    if (exam) {
      setLocalExam(exam);

      const d = new Date(exam.date);
      if (!isNaN(d.getTime())) {
        onDateChange(d);
      }
    } else {
      const now = new Date();
      onDateChange(now);

      setLocalExam({
        subjectId: '',
        date: now.toISOString(),
        location: '',
        note: '',
      });
    }
  }, [exam, visible]);

  const handleSave = async () => {
    if (!localExam.subjectId) {
      Alert.alert('エラー', '科目を選択してください');
      return;
    }

    const dateString = localExam.date || examDate.toISOString();
    const examDateObj = new Date(dateString);

    if (Number.isNaN(examDateObj.getTime())) {
      Alert.alert('エラー', '有効な日付を選択してください');
      return;
    }

    if (!exam) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const examDay = new Date(examDateObj);
      examDay.setHours(0, 0, 0, 0);

      if (examDay < today) {
        Alert.alert('エラー', '試験日は今日以降の日付を選択してください');
        return;
      }
    }

    try {
      const { id, ...rest } = localExam;

      await onSave({
        ...(rest as Omit<Exam, 'id'>),
        ...(id ? { id } : {}),
      });

      onClose();
    } catch (error) {
      Alert.alert('エラー', '試験の保存に失敗しました');
    }
  };

  const handleDelete = async () => {
    if (!exam?.id) return;

    Alert.alert('確認', 'この試験を削除してもよろしいですか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: async () => {
          try {
            await onDelete(exam.id);
            onClose();
          } catch {
            Alert.alert('エラー', '試験の削除に失敗しました');
          }
        },
      },
    ]);
  };

  const handleCloseButtonPress = async () => {
    if (exam) {
      await handleSave();
    } else {
      onClose();
    }
  };

  /* ===== ダーク/ライト配色（他モーダル寄せ） ===== */
  const modalBg = isDark
    ? compositeOver('rgba(255,255,255,0.10)', theme.backgroundColor)
    : '#FFFFFF';

  const headerFooterLine = isDark ? 'rgba(255,255,255,0.12)' : '#eeeeee';
  const overlayBg = isDark ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.5)';

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleCloseButtonPress}
    >
      <View style={[styles.modalContainer, { backgroundColor: overlayBg }]}>
        <View style={[styles.modalContent, { backgroundColor: modalBg }]}>
          {/* ヘッダー */}
          <View style={[styles.header, { borderBottomColor: headerFooterLine }]}>
            <Text style={[styles.modalTitle, { color: theme.textColor }]}>
              {exam ? '試験日程の編集' : '新規試験日程の登録'}
            </Text>

            {/* 右上 × ボタン */}
            <TouchableOpacity
              style={styles.closeButtonTop}
              onPress={handleCloseButtonPress}
            >
              <Text style={[styles.closeText, { color: theme.textColor }]}>×</Text>
            </TouchableOpacity>
          </View>

          {/* フォーム */}
          <View style={styles.formContainer}>
            <ExamForm
              exam={localExam}
              subjects={subjects}
              examDate={examDate}
              showDatePicker={showDatePicker}
              onExamChange={setLocalExam}
              onDateChange={onDateChange}
              onDatePickerVisibilityChange={onDatePickerVisibilityChange}
              isEditing={!!exam}
            />
          </View>

          {/* フッター */}
          <View style={[styles.footer, { borderTopColor: headerFooterLine }]}>
            <View style={styles.buttonContainer}>
              {!exam && (
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.buttonText}>登録</Text>
                </TouchableOpacity>
              )}

              {exam && (
                <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                  <Text style={styles.buttonText}>削除</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
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
  },
  modalContent: {
    borderRadius: 10,
    width: '90%',
    maxHeight: '90%',
    overflow: 'hidden',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    position: 'relative',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  closeButtonTop: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 24,
    fontWeight: 'bold',
  },

  formContainer: {
    flexGrow: 1,
    maxHeight: '80%',
  },

  footer: {
    padding: 15,
    borderTopWidth: 1,
  },

  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },

  saveButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },

  deleteButton: {
    flex: 1,
    backgroundColor: '#F44336',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
