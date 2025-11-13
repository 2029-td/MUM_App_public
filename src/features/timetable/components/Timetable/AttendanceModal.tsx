import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, Modal, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import type { Subject } from '../../types';
import { SubjectSettingsModal } from './SubjectSettingsModal';

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
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);

  useEffect(() => {
    if (subject) {
      setLocalSubject({ ...subject });
    } else {
      setLocalSubject(null);
    }
  }, [subject]);

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

  // 出席率 = (出席 + 0.5×遅刻) / (出席 + 欠席 + 遅刻)
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
    if (isAtOrOverCap) return;
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
            {/* 右上の設定ボタン（・・・） */}
            <TouchableOpacity
              accessibilityLabel="設定を開く"
              onPress={() => setIsSettingsVisible(true)}
              style={styles.settingsButton}
            >
              <Text style={styles.settingsButtonText}>⋯</Text>
            </TouchableOpacity>

            {/* 右上のバツボタン（・・・の右隣） */}
            <TouchableOpacity
              accessibilityLabel="詳細画面を閉じる"
              onPress={onClose}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>

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

              {/* 指示により「色・単位数・授業回数・削除ボタン」は AttendanceModal から削除 */}

              <View style={styles.progressRow}>
                <Text style={styles.progressLeft}>
                  授業回数進捗: {totalRawCount} / {TOTAL_CLASSES}
                </Text>
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
                    <View
                      key={key}
                      style={[
                        styles.attendanceGroup,
                        { backgroundColor: color, borderColor: border },
                      ]}
                    >
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
                              shadowColor: '#000',
                              shadowOpacity: 0.1,
                              shadowRadius: 2,
                              elevation: 2,
                            },
                            isDecrementDisabled && {
                              backgroundColor: '#dcdcdc',
                              borderColor: '#c0c0c0',
                              opacity: 0.5,
                            },
                          ]}
                          disabled={isDecrementDisabled}
                          onPress={() => handleDecrement(key as any)}
                        >
                          <Text
                            style={[
                              styles.stepperSign,
                              isDecrementDisabled && { color: '#999999' },
                            ]}
                          >
                            −
                          </Text>
                        </TouchableOpacity>

                        {/* 加算 */}
                        <TouchableOpacity
                          style={[
                            styles.stepperCircle,
                            !isIncrementDisabled && {
                              backgroundColor: '#ffffff',
                              borderColor: '#aaa',
                              shadowColor: '#000',
                              shadowOpacity: 0.1,
                              shadowRadius: 2,
                              elevation: 2,
                            },
                            isIncrementDisabled && {
                              backgroundColor: '#dcdcdc',
                              borderColor: '#c0c0c0',
                              opacity: 0.5,
                            },
                          ]}
                          disabled={isIncrementDisabled}
                          onPress={() => handleIncrement(key as any)}
                        >
                          <Text
                            style={[
                              styles.stepperSign,
                              isIncrementDisabled && { color: '#999999' },
                            ]}
                          >
                            ＋
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>

              <View style={{ height: 8 }} />
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* 設定モーダル */}
      <SubjectSettingsModal
        visible={isSettingsVisible}
        subject={localSubject}
        onClose={() => setIsSettingsVisible(false)}
        onDelete={async () => {
          // 設定モーダルを閉じてから削除処理を実行
          setIsSettingsVisible(false);
          await Promise.resolve(onDelete());
        }}
        onSubjectUpdate={onSubjectUpdate}
      />
    </Modal>
  );
};

export default AttendanceModal; // named と default の両方をエクスポート

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 560,
    maxHeight: '90%',
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  cardBody: { padding: 20 },
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
  subjectDetailLabel: { fontSize: 14, color: '#666666' },
  subjectDetailValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: 'bold',
    flexShrink: 1,
    flexWrap: 'wrap',
  },

  attendanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  attendanceGroup: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 10,
    marginHorizontal: 4,
  },
  groupTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  countValue: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  stepperRow: { flexDirection: 'row', justifyContent: 'space-between', width: 90 },
  stepperCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  stepperSign: { fontSize: 22, fontWeight: '700', color: '#333' },

  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  progressLeft: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  progressRight: { fontSize: 16, fontWeight: 'bold', color: '#4caf50' },

  // 右上の設定ボタン（・・・）
  settingsButton: {
    position: 'absolute',
    top: 8,
    right: 44, // ← ここをずらして右側にバツボタンを置く余白を作る
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsButtonText: { fontSize: 24, lineHeight: 24, color: '#555' },

  // 右上のバツボタン（・・・の右隣）
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: { fontSize: 24, lineHeight: 24, color: '#555' },
});
