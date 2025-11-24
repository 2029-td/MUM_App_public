import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
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

  // ExamModal.tsx

  useEffect(() => {
  if (!visible) return;

  if (exam) {
    setLocalExam(exam);

    // 🔽 編集時：exam.date を親の examDate にも反映
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

    if (!localExam.location) {
      Alert.alert('エラー', '試験会場を入力してください');
      return;
    }

    // --- ここから日付のバリデーションを自前でやる ---
    // localExam.date が空なら examDate（親の state）を使う保険
    const dateString = localExam.date || examDate.toISOString();
    const examDateObj = new Date(dateString);

    if (Number.isNaN(examDateObj.getTime())) {
      Alert.alert('エラー', '有効な日付を選択してください');
      return;
    }

    // 「今日以降」を許可、「昨日以前」はエラー
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const examDay = new Date(examDateObj);
    examDay.setHours(0, 0, 0, 0);

    if (examDay < today) {
      Alert.alert('エラー', '試験日は今日以降の日付を選択してください');
      return;
    }
    // --- 日付チェックここまで ---

    try {
      const { id, ...rest } = localExam;

      await onSave({
        ...(rest as Omit<Exam, 'id'>),
        ...(id ? { id } : {}),
      });

      onClose();
    } catch (error) {
      // ここは「日付が変」なときではなく、本当に保存処理でコケたときだけ来る
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
              onClose();
            } catch {
              Alert.alert('エラー', '試験の削除に失敗しました');
            }
          },
        },
      ]
    );
  };

  /** 右上 × の動作 */
  const handleCloseButtonPress = async () => {
    if (exam) {
      // 編集の場合 → 更新と同じ処理
      await handleSave();
    } else {
      // 新規の場合 → 閉じるのみ
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleCloseButtonPress}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          
          {/* ヘッダー */}
          <View style={styles.header}>
            <Text style={styles.modalTitle}>
              {exam ? '試験日程の編集' : '新規試験日程の登録'}
            </Text>

            {/* 右上 × ボタン */}
            <TouchableOpacity
              style={styles.closeButtonTop}
              onPress={handleCloseButtonPress}
            >
              <Text style={styles.closeText}>×</Text>
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
          <View style={styles.footer}>
            <View style={styles.buttonContainer}>

              {/* 新規登録の時だけ登録ボタンを表示 */}
              {!exam && (
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSave}
                >
                  <Text style={styles.buttonText}>登録</Text>
                </TouchableOpacity>
              )}

              {/* 編集時のみ削除ボタン */}
              {exam && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={handleDelete}
                >
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    width: '90%',
    maxHeight: '90%',
    overflow: 'hidden',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    position: 'relative',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
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
    color: '#333',
    fontWeight: 'bold',
  },

  formContainer: {
    flexGrow: 1,
    maxHeight: '80%',
  },

  footer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
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
