import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colorPalette } from '../../constants';
import type { Subject } from '../../types';

interface AttendanceModalProps {
  visible: boolean;
  subject: Subject | null;
  onClose: () => void;
  onUpdate: (type: 'attendance' | 'absence' | 'late') => void;
  onDelete: () => void;
  onSubjectUpdate: (updatedSubject: Subject) => void;
}

export const AttendanceModal: React.FC<AttendanceModalProps> = ({
  visible,
  subject,
  onClose,
  onUpdate,
  onDelete,
  onSubjectUpdate,
}) => {
  const [localSubject, setLocalSubject] = useState<Subject | null>(null);

  // subjectが変更されたときにlocalSubjectを初期化
  useEffect(() => {
    if (subject) setLocalSubject({ ...subject });
  }, [subject]);   

  // localSubjectがnullまたはundefinedの場合はレンダリングしない
  if (!localSubject) return null;

  // 科目の色を変更した時の処理
  const handleColorChange = (color: string) => {
    const updatedSubject = { ...localSubject, color };
    setLocalSubject(updatedSubject);
  };

  // 単位数を変更した時の処理
  const handleCreditsChange = (credits: string) => {
    const parsed = parseInt(credits, 10);
    setLocalSubject({
      ...localSubject,
      credits: isNaN(parsed) ? 2 : parsed, // 初期値:2
    });
  };

  // 総授業回数を変更した時の処理
  const handleTotalClassesChange = (totalClasses: string) => {
    const parsed = parseInt(totalClasses, 10);
    setLocalSubject({
      ...localSubject,
      totalClasses: isNaN(parsed) ? 15 : parsed, // 初期値:15
    });
  };

  // 保存
  const handleSave = () => {
    if (localSubject) {
      onSubjectUpdate(localSubject);
    }
    onClose();
  };

  // 出席率の計算
  const attendanceRate = Math.round(
    (localSubject.attendance / (localSubject.totalClasses || 15)) * 100
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* ← キーボード回避 */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: 'padding', android: 'height' })}
      >
        <View style={styles.modalContainer}>
          {/* 角丸のカード。overflow: 'hidden' で内側のスクロールも角丸に沿って描画 */}
          <View style={styles.modalCard}>
            {/* 中身をスクロール可能にする */}
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
              contentContainerStyle={styles.cardBody}
            >
              <Text style={styles.modalTitle}>{localSubject.name}</Text>

              <View style={styles.subjectDetailContainer}>
                <View style={styles.subjectDetailRow}>
                  <Text style={styles.subjectDetailLabel}>教員：</Text>
                  <Text style={styles.subjectDetailValue} numberOfLines={0}>
                    {localSubject.professor}
                  </Text>
                </View>
                <View style={styles.subjectDetailRow}>
                  <Text style={styles.subjectDetailLabel}>教室：</Text>
                  <Text style={styles.subjectDetailValue}>{localSubject.room}</Text>
                </View>
              </View>

              <View style={styles.colorPickerContainer}>
                <Text style={styles.colorPickerLabel}>科目の色を選択：</Text>
                <View style={styles.colorPalette}>
                  {colorPalette.map((color, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        localSubject.color === color && styles.selectedColorOption,
                      ]}
                      onPress={() => handleColorChange(color)}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.subjectDetailRow}>
                <Text style={styles.subjectDetailLabel}>単位数：</Text>
                <TextInput
                  style={styles.creditsInput}
                  keyboardType="numeric"
                  value={
                    localSubject.credits === 0 ? '' : localSubject.credits?.toString() ?? '2'
                  }
                  onChangeText={handleCreditsChange}
                  placeholder="単位数を入力"
                />
              </View>

              <View style={styles.subjectDetailRow}>
                <Text style={styles.subjectDetailLabel}>総授業回数：</Text>
                <TextInput
                  style={styles.creditsInput}
                  keyboardType="numeric"
                  value={
                    localSubject.totalClasses === 0
                      ? ''
                      : localSubject.totalClasses?.toString() ?? '15'
                  }
                  onChangeText={handleTotalClassesChange}
                  placeholder="総授業回数を入力"
                />
              </View>

              <View style={styles.attendanceStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>出席</Text>
                  <Text style={styles.statValue}>{localSubject.attendance}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>欠席</Text>
                  <Text style={styles.statValue}>{localSubject.absence}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>遅刻</Text>
                  <Text style={styles.statValue}>{localSubject.late}</Text>
                </View>
              </View>

              <View style={styles.attendanceRate}>
                <Text style={styles.attendanceRateLabel}>出席率:</Text>
                <Text style={styles.attendanceRateValue}>{attendanceRate}%</Text>
              </View>

              <View style={styles.attendanceButtons}>
                <TouchableOpacity
                  style={[styles.attendanceButton, styles.attendanceButtonPresent]}
                  onPress={() => onUpdate('attendance')}
                >
                  <Text style={styles.buttonText}>出席</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.attendanceButton, styles.attendanceButtonAbsent]}
                  onPress={() => onUpdate('absence')}
                >
                  <Text style={styles.buttonText}>欠席</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.attendanceButton, styles.attendanceButtonLate]}
                  onPress={() => onUpdate('late')}
                >
                  <Text style={styles.buttonText}>遅刻</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
                <Text style={styles.buttonText}>科目を削除</Text>
              </TouchableOpacity>

              {/* 最下部ボタンもスクロール内に含める */}
              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => {
                  onSubjectUpdate(localSubject);
                  onClose();
                }}
              >
                <Text style={styles.buttonText}>保存して閉じる</Text>
              </TouchableOpacity>
              {/* 下に少し余白を付けて端末によってはボタンがぎゅうぎゅうにならないように */}
              <View style={{ height: 8 }} />
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12, // 極端に小さい端末でも左右に余白
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  // カードの枠（高さは画面の 90% まで・角丸を保ったまま中身がスクロール）
  modalCard: {
    width: '100%',
    maxWidth: 560,         // タブレット対策
    maxHeight: '90%',
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',    // 角丸に沿って内容をクリップ
  },
  // ScrollView の内側パディング
  cardBody: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#333',
  },
  subjectDetailContainer: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  subjectDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  subjectDetailLabel: {
    fontSize: 14,
    color: '#666666',
  },
  subjectDetailValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: 'bold',
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  colorPickerContainer: {
    marginVertical: 15,
  },
  colorPickerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  colorPalette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedColorOption: {
    borderWidth: 3,
    borderColor: '#000',
  },
  creditsInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 8,
    fontSize: 16,
    color: '#333',
  },
  attendanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 5,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  attendanceRate: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#e8f5e9',
    borderRadius: 5,
  },
  attendanceRateLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  attendanceRateValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  attendanceButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  attendanceButton: {
    flex: 1,
    padding: 12,
    borderRadius: 5,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  attendanceButtonPresent: {
    backgroundColor: '#4CAF50',
  },
  attendanceButtonAbsent: {
    backgroundColor: '#F44336',
  },
  attendanceButtonLate: {
    backgroundColor: '#FFC107',
  },
  deleteButton: {
    backgroundColor: '#F44336',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});