import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import type { Exam, Subject } from '../../types';
import { ExamForm } from './ExamForm';

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
  const [localExam, setLocalExam] = React.useState<Partial<Exam>>({
    subjectId: '',
    date: '',
    location: '',
    note: '',
  });

  useEffect(() => {
    if (exam) {
      setLocalExam(exam);
    } else {
      setLocalExam({
        subjectId: '',
        date: examDate.toISOString(),
        location: '',
        note: '',
      });
    }
  }, [exam, examDate]);

  const handleSave = async () => {
    if (!localExam.subjectId) {
      Alert.alert('エラー', '科目を選択してください');
      return;
    }
    if (!localExam.location) {
      Alert.alert('エラー', '試験会場を入力してください');
      return;
    }

    try {
      await onSave(localExam);
    } catch (error) {
      Alert.alert('エラー', '試験の保存に失敗しました');
    }
  };

  const handleDelete = async () => {
    if (!exam?.id) return;

    Alert.alert(
      '確認',
      'この試験を削除してもよろしいですか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              await onDelete(exam.id);
            } catch (error) {
              Alert.alert('エラー', '試験の削除に失敗しました');
            }
          },
        },
      ]
    );
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
          {/* ヘッダー */}
          <View style={styles.header}>
            <Text style={styles.modalTitle}>
              {exam ? '試験日程の編集' : '新規試験日程の登録'}
            </Text>
          </View>

          {/* スクロール可能なコンテンツエリア */}
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

          {/* フッター（ボタン群） */}
          <View style={styles.footer}>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
              >
                <Text style={styles.buttonText}>
                  {exam ? '更新' : '登録'}
                </Text>
              </TouchableOpacity>

              {exam && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={handleDelete}
                >
                  <Text style={styles.buttonText}>削除</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
              >
                <Text style={styles.buttonText}>キャンセル</Text>
              </TouchableOpacity>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    width: '90%',
    maxHeight: '90%',
    overflow: 'hidden', // 重要: 内容がはみ出ないようにする
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  formContainer: {
    flexGrow: 1,
    maxHeight: '80%', // モーダルの高さを制限
  },
  footer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: 'white', // フッターの背景色を設定
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
  cancelButton: {
    flex: 1,
    backgroundColor: '#9E9E9E',
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