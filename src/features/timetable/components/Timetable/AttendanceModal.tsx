import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { showDeleteConfirm } from '../Timetable/showDeleteConfirm';

interface AttendanceModalProps {
  visible: boolean;
  subject: Subject | null;
  onClose: () => void;
  onUpdate: (type: 'attendance' | 'absence' | 'late') => void; // 合算のみ加算
  onDelete: () => void;
  onSubjectUpdate: (updatedSubject: Subject) => void | Promise<void>;
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

  // 総授業回数の入力用一時ステート（文字列）
  const [totalClassesInput, setTotalClassesInput] = useState<string>('');

  // subject をローカルへコピー（モーダル内編集用）
  useEffect(() => {
    if (subject) {
      setLocalSubject({ ...subject });
      // 入力欄は保存済みの値を文字列で同期（0/未設定は空にせず "15" にしておくならここで調整可能）
      const base = subject.totalClasses && subject.totalClasses > 0
        ? String(subject.totalClasses)
        : '15';
      setTotalClassesInput(base);
    } else {
      setLocalSubject(null);
      setTotalClassesInput('');
    }
  }, [subject]);

  // ===== ハンドラ群 =====

  const handleColorChange = useCallback((color: string) => {
    setLocalSubject(prev => (prev ? { ...prev, color } : prev));
  }, []);

  const handleCreditsChange = useCallback((credits: string) => {
    const parsed = parseInt(credits, 10);
    setLocalSubject(prev =>
      prev ? { ...prev, credits: Number.isFinite(parsed) ? parsed : 2 } : prev
    );
  }, []);

  // 総授業回数：タイピング中は文字列だけ更新（即フォールバックしない）
  const handleTotalClassesTyping = useCallback((text: string) => {
    setTotalClassesInput(text);
  }, []);

  // 確定（完了/blur）時にだけ 15 へフォールバックし、localSubject に反映
  const commitTotalClasses = useCallback(async () => {
    const parsed = parseInt(totalClassesInput, 10);
    const committed = Number.isFinite(parsed) && parsed > 0 ? parsed : 15;

    setLocalSubject(prev => (prev ? { ...prev, totalClasses: committed } : prev));
    setTotalClassesInput(String(committed));

    // 即親へ同期したい場合はコメント解除
    // if (localSubject) {
    //   await Promise.resolve(onSubjectUpdate({ ...localSubject, totalClasses: committed }));
    // }
  }, [totalClassesInput /*, localSubject, onSubjectUpdate*/]);

  // 保存（他の編集も含めて確定）
  const handleSave = useCallback(() => {
    if (localSubject) onSubjectUpdate(localSubject);
    onClose();
  }, [localSubject, onSubjectUpdate, onClose]);

  // 表示/判定に使う総授業回数（未設定/0 は 15）
  const TOTAL_CLASSES = useMemo(() => {
    const v = localSubject?.totalClasses ?? 15;
    return v > 0 ? v : 15;
  }, [localSubject?.totalClasses]);

  // 合算（出席+欠席+遅刻）
  const totalRawCount = useMemo(() => {
    const a = Math.max(0, localSubject?.attendance || 0);
    const b = Math.max(0, localSubject?.absence || 0);
    const l = Math.max(0, localSubject?.late || 0);
    return a + b + l;
  }, [localSubject?.attendance, localSubject?.absence, localSubject?.late]);

  const isAtOrOverCap = totalRawCount >= TOTAL_CLASSES;
  const isOverCap = totalRawCount > TOTAL_CLASSES;

  // 出席率 = (出席 + 0.5×遅刻) / (出席 + 欠席 + 0.5×遅刻)
  const attendanceRate = useMemo(() => {
    const attend = Math.max(0, localSubject?.attendance || 0);
    const absent = Math.max(0, localSubject?.absence || 0);
    const late = Math.max(0, localSubject?.late || 0);

    const lateAsHalf = late * 0.5;
    const denom = attend + absent + lateAsHalf;
    if (denom <= 0) return 0;

    const numer = attend + lateAsHalf;
    return Math.round((numer / denom) * 100);
  }, [localSubject?.attendance, localSubject?.absence, localSubject?.late]);

  const handleUpdateCapped = useCallback(
    (type: 'attendance' | 'absence' | 'late') => {
      if (!localSubject || isAtOrOverCap) return;
      onUpdate(type);
    },
    [localSubject, isAtOrOverCap, onUpdate]
  );

  // ===== 描画 =====

  if (!localSubject) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: 'padding', android: 'height' })}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalCard}>
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
                  value={totalClassesInput}
                  onChangeText={handleTotalClassesTyping}
                  onEndEditing={commitTotalClasses}
                  onSubmitEditing={commitTotalClasses}
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

              {/* 合算 / 総授業回数 */}
              <View style={{ marginBottom: 8 }}>
                <Text style={{ textAlign: 'center', color: '#666' }}>
                  合算（出席+欠席+遅刻）: {totalRawCount} / {TOTAL_CLASSES}
                </Text>
                {isOverCap && (
                  <Text style={{ textAlign: 'center', color: '#F44336', fontWeight: 'bold' }}>
                    合算が総授業回数を超えています。値を見直してください。
                  </Text>
                )}
                {!isOverCap && isAtOrOverCap && (
                  <Text style={{ textAlign: 'center', color: '#F44336', fontWeight: 'bold' }}>
                    上限に達しました
                  </Text>
                )}
              </View>

              {/* 授業回数進捗と出席率（横並び） */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#e8f5e9',
                  borderRadius: 5,
                  padding: 10,
                  marginBottom: 15,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333' }}>
                  授業回数進捗: {totalRawCount} / {TOTAL_CLASSES}
                </Text>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#4caf50' }}>
                  出席率: {attendanceRate}%
                </Text>
              </View>

              <View style={styles.attendanceButtons}>
                <TouchableOpacity
                  style={[
                    styles.attendanceButton,
                    styles.attendanceButtonPresent,
                    isAtOrOverCap && { opacity: 0.5 },
                  ]}
                  disabled={isAtOrOverCap}
                  onPress={() => handleUpdateCapped('attendance')}
                >
                  <Text style={styles.buttonText}>出席</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.attendanceButton,
                    styles.attendanceButtonAbsent,
                    isAtOrOverCap && { opacity: 0.5 },
                  ]}
                  disabled={isAtOrOverCap}
                  onPress={() => handleUpdateCapped('absence')}
                >
                  <Text style={styles.buttonText}>欠席</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.attendanceButton,
                    styles.attendanceButtonLate,
                    isAtOrOverCap && { opacity: 0.5 },
                  ]}
                  disabled={isAtOrOverCap}
                  onPress={() => handleUpdateCapped('late')}
                >
                  <Text style={styles.buttonText}>遅刻</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => showDeleteConfirm(onDelete)}
              >
                <Text style={styles.buttonText}>科目を削除</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.buttonText}>保存して閉じる</Text>
              </TouchableOpacity>

              <View style={{ height: 8 }} />
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  modalCard: { width: '100%', maxWidth: 560, maxHeight: '90%', borderRadius: 12, backgroundColor: '#fff', overflow: 'hidden' },
  cardBody: { padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 15, color: '#333' },
  subjectDetailContainer: { backgroundColor: '#f5f5f5', padding: 15, borderRadius: 8, marginBottom: 15 },
  subjectDetailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  subjectDetailLabel: { fontSize: 14, color: '#666666' },
  subjectDetailValue: { fontSize: 14, color: '#333333', fontWeight: 'bold', flexShrink: 1, flexWrap: 'wrap' },
  colorPickerContainer: { marginVertical: 15 },
  colorPickerLabel: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  colorPalette: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  colorOption: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#ddd' },
  selectedColorOption: { borderWidth: 3, borderColor: '#000' },
  creditsInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 5, padding: 8, fontSize: 16, color: '#333' },
  attendanceStats: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8, backgroundColor: '#f5f5f5', padding: 10, borderRadius: 5 },
  statItem: { alignItems: 'center' },
  statLabel: { fontSize: 14, color: '#666', marginBottom: 5 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  attendanceRate: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, padding: 10, backgroundColor: '#e8f5e9', borderRadius: 5 },
  attendanceRateLabel: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  attendanceRateValue: { fontSize: 18, fontWeight: 'bold', color: '#4caf50' },
  attendanceButtons: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  attendanceButton: { flex: 1, padding: 12, borderRadius: 5, marginHorizontal: 5, alignItems: 'center' },
  attendanceButtonPresent: { backgroundColor: '#4CAF50' },
  attendanceButtonAbsent: { backgroundColor: '#F44336' },
  attendanceButtonLate: { backgroundColor: '#FFC107' },
  deleteButton: { backgroundColor: '#F44336', padding: 12, borderRadius: 5, alignItems: 'center', marginBottom: 10 },
  saveButton: { backgroundColor: '#2196F3', padding: 12, borderRadius: 5, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});
