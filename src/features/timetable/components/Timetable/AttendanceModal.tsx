import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Modal, TextInput, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { colorPalette } from '../../constants';
import type { Subject } from '../../types';
import { showDeleteConfirm } from '../Timetable/showDeleteConfirm';

interface AttendanceModalProps {
  visible: boolean;
  subject: Subject | null;
  onClose: () => void;
  onUpdate: (type: 'attendance' | 'absence' | 'late') => void;
  onDelete: () => void;
  onSubjectUpdate: (updatedSubject: Subject) => void | Promise<void>;
}

export const AttendanceModal: React.FC<AttendanceModalProps> = ({
  visible, subject, onClose, onUpdate, onDelete, onSubjectUpdate,
}) => {
  const [localSubject, setLocalSubject] = useState<Subject | null>(null);
  const [totalClassesInput, setTotalClassesInput] = useState<string>('');
  const [creditsInput, setCreditsInput] = useState<string>('');

  useEffect(() => {
    if (subject) {
      setLocalSubject({ ...subject });
      setTotalClassesInput(
        subject.totalClasses && subject.totalClasses > 0 ? String(subject.totalClasses) : '15'
      );
      setCreditsInput(subject.credits && subject.credits > 0 ? String(subject.credits) : '');
    } else {
      setLocalSubject(null);
      setTotalClassesInput('');
      setCreditsInput('');
    }
  }, [subject]);

  const handleColorChange = useCallback((color: string) => {
    setLocalSubject(prev => {
      if (!prev) return prev;
      const updated = { ...prev, color };
      void Promise.resolve(onSubjectUpdate(updated));
      return updated;
    });
  }, [onSubjectUpdate]);

  const handleCreditsTyping = useCallback((text: string) => setCreditsInput(text), []);
  const commitCredits = useCallback(async () => {
    const parsed = parseInt(creditsInput, 10);
    const committed = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    setLocalSubject(prev => (prev ? { ...prev, credits: committed } : prev));
    setCreditsInput(committed > 0 ? String(committed) : '');
    if (localSubject) await Promise.resolve(onSubjectUpdate({ ...localSubject, credits: committed }));
  }, [creditsInput, localSubject, onSubjectUpdate]);

  const handleTotalClassesTyping = useCallback((t: string) => setTotalClassesInput(t), []);
  const commitTotalClasses = useCallback(async () => {
    const parsed = parseInt(totalClassesInput, 10);
    const committed = Number.isFinite(parsed) && parsed > 0 ? parsed : 15;
    setLocalSubject(prev => (prev ? { ...prev, totalClasses: committed } : prev));
    setTotalClassesInput(String(committed));
  }, [totalClassesInput]);

  const handleSave = useCallback(() => {
    if (localSubject) onSubjectUpdate(localSubject);
    onClose();
  }, [localSubject, onSubjectUpdate, onClose]);

  const TOTAL_CLASSES = useMemo(() => {
    const v = localSubject?.totalClasses ?? 15;
    return v > 0 ? v : 15;
  }, [localSubject?.totalClasses]);

  const totalRawCount = useMemo(() => {
    const a = Math.max(0, localSubject?.attendance || 0);
    const b = Math.max(0, localSubject?.absence || 0);
    const l = Math.max(0, localSubject?.late || 0);
    return a + b + l;
  }, [localSubject?.attendance, localSubject?.absence, localSubject?.late]);

  const isAtOrOverCap = totalRawCount >= TOTAL_CLASSES;

  // 出席率 = (出席 + 0.5×遅刻) / 授業回数の進捗（= 出席 + 欠席 + 遅刻）
  const attendanceRate = useMemo(() => {
    const attend = Math.max(0, localSubject?.attendance || 0);
    const absent = Math.max(0, localSubject?.absence || 0);
    const late = Math.max(0, localSubject?.late || 0);
    const numer = attend + late * 0.5;
    const denom = attend + absent + late;
    if (denom <= 0) return 0;
    return Math.round((numer / denom) * 100);
  }, [localSubject?.attendance, localSubject?.absence, localSubject?.late]);

  const handleDecrement = async (type: 'attendance' | 'absence' | 'late') => {
    if (!localSubject) return;
    const current = localSubject[type] ?? 0;
    if (current <= 0) return;
    const updated = { ...localSubject, [type]: current - 1 };
    setLocalSubject(updated);
    await Promise.resolve(onSubjectUpdate(updated));
  };

  const handleIncrement = async (type: 'attendance' | 'absence' | 'late') => {
    if (!localSubject) return;
    const updated = { ...localSubject, [type]: (localSubject[type] ?? 0) + 1 };
    setLocalSubject(updated);
    await Promise.resolve(onSubjectUpdate(updated));
  };

  if (!localSubject) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: 'padding', android: 'height' })}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalCard}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator contentContainerStyle={styles.cardBody}>
              <Text style={styles.modalTitle}>{localSubject.name}</Text>

              <View style={styles.subjectDetailContainer}>
                <View style={styles.subjectDetailRow}>
                  <Text style={styles.subjectDetailLabel}>教員：</Text>
                  <Text style={styles.subjectDetailValue} numberOfLines={0}>{localSubject.professor}</Text>
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
                  value={creditsInput}
                  onChangeText={handleCreditsTyping}
                  onEndEditing={commitCredits}
                  onSubmitEditing={commitCredits}
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

              <View style={styles.progressRow}>
                <Text style={styles.progressLeft}>授業回数進捗: {totalRawCount} / {TOTAL_CLASSES}</Text>
                <Text style={styles.progressRight}>出席率: {attendanceRate}%</Text>
              </View>

              {/* 出席・欠席・遅刻：カード＋ステッパー */}
              <View style={styles.attendanceRow}>
                {[
                  { key: 'attendance', title: '出席', color: '#E8F5E9', border: '#2E7D32' },
                  { key: 'absence', title: '欠席', color: '#FFEBEE', border: '#C62828' },
                  { key: 'late', title: '遅刻', color: '#FFF8E1', border: '#F9A825' },
                ].map(({ key, title, color, border }) => {
                  const count = Number(localSubject[key as keyof Subject] ?? 0);
                  const isDecrementDisabled = count <= 0;
                  const isIncrementDisabled = isAtOrOverCap;
                  return (
                    <View key={key} style={[styles.attendanceGroup, { backgroundColor: color, borderColor: border }]}>
                      <Text style={[styles.groupTitle, { color: border }]}>{title}</Text>
                      <Text style={styles.countValue}>{count}</Text>
                      <View style={styles.stepperRow}>
                        {/* 減算 */}
                        <TouchableOpacity
                          style={[
                            styles.stepperCircle,
                            !isDecrementDisabled && {
                              backgroundColor: '#ffffff',
                              borderColor: '#aaa',
                              shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 2,
                            },
                            isDecrementDisabled && {
                              backgroundColor: '#dcdcdc', borderColor: '#c0c0c0', opacity: 0.5,
                            },
                          ]}
                          disabled={isDecrementDisabled}
                          onPress={() => handleDecrement(key as any)}
                        >
                          <Text style={[styles.stepperSign, isDecrementDisabled && { color: '#999999' }]}>−</Text>
                        </TouchableOpacity>

                        {/* 加算 */}
                        <TouchableOpacity
                          style={[
                            styles.stepperCircle,
                            !isIncrementDisabled && {
                              backgroundColor: '#ffffff',
                              borderColor: '#aaa',
                              shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 2,
                            },
                            isIncrementDisabled && {
                              backgroundColor: '#dcdcdc', borderColor: '#c0c0c0', opacity: 0.5,
                            },
                          ]}
                          disabled={isIncrementDisabled}
                          onPress={() => handleIncrement(key as any)}
                        >
                          <Text style={[styles.stepperSign, isIncrementDisabled && { color: '#999999' }]}>＋</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>

              <TouchableOpacity style={styles.deleteButton} onPress={() => showDeleteConfirm(onDelete)}>
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
  attendanceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  attendanceGroup: { flex: 1, borderWidth: 2, borderRadius: 12, alignItems: 'center', paddingVertical: 10, marginHorizontal: 4 },
  groupTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  countValue: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  stepperRow: { flexDirection: 'row', justifyContent: 'space-between', width: 90 },
  stepperCircle: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: '#ccc' },
  stepperSign: { fontSize: 22, fontWeight: '700', color: '#333' },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#e8f5e9', borderRadius: 5, padding: 10, marginBottom: 15 },
  progressLeft: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  progressRight: { fontSize: 16, fontWeight: 'bold', color: '#4caf50' },
  deleteButton: { backgroundColor: '#F44336', padding: 12, borderRadius: 5, alignItems: 'center', marginBottom: 10 },
  saveButton: { backgroundColor: '#2196F3', padding: 12, borderRadius: 5, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});
