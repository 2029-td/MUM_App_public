// src/features/timetable/components/Timetable/AttendanceModal.tsx

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
  visible, subject, onClose, onDelete, onSubjectUpdate,
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
            {/* ヘッダー（右上の・・・と×だけ固定表示） */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                accessibilityLabel="設定を開く"
                onPress={() => setIsSettingsVisible(true)}
                style={styles.settingsButton}
              >
                <Text style={styles.settingsButtonText}>⋯</Text>
              </TouchableOpacity>

              <TouchableOpacity
                accessibilityLabel="詳細画面を閉じる"
                onPress={onClose}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            {/* ここから下がスクロール領域。科目名はヘッダーの一段下に来る */}
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
              contentContainerStyle={styles.cardBody}
            >
              <Text style={styles.modalTitle}>{localSubject.name}</Text>

              <View style={styles.subjectDetailContainer}>
                {/* 教員 */}
                <View style={styles.subjectDetailRow}>
                  <Text style={styles.subjectDetailLabel}>教員：</Text>
                  <Text style={styles.subjectDetailValue} numberOfLines={0}>
                    {localSubject.professor}
                  </Text>
                </View>

                {/* 教室 */}
                <View style={styles.subjectDetailRow}>
                  <Text style={styles.subjectDetailLabel}>教室：</Text>
                  <Text style={styles.subjectDetailValue}>{localSubject.room}</Text>
                </View>

                {/* 校舎 */}
                <View style={styles.subjectDetailRow}>
                  <Text style={styles.subjectDetailLabel}>校舎：</Text>
                  <Text style={styles.subjectDetailValue}>{localSubject.campus}</Text>
                </View>

                {/* 単位 */}
                <View style={styles.subjectDetailRow}>
                  <Text style={styles.subjectDetailLabel}>単位：</Text>
                  <Text style={styles.subjectDetailValue}>
                    {localSubject.credits && localSubject.credits > 0
                      ? `${localSubject.credits}`
                      : '-'}
                  </Text>
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
  // モーダル全体の背景（半透明黒 + 中央配置）
  modalContainer: {
    flex: 1,
    justifyContent: 'center', // 縦方向中央
    alignItems: 'center', // 横方向中央
    paddingHorizontal: 12, // 端から少し内側に
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // 黒の半透明
  },
  // モーダルのカード本体
  modalCard: {
    width: '100%',
    maxWidth: 560,
    maxHeight: '90%', // 高さは画面の9割まで
    borderRadius: 12, // 角丸
    backgroundColor: '#fff',
    overflow: 'hidden', // はみ出し防止
  },

  // 上部ヘッダー（・・・ / ×）
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 8,
  },

  // モーダル内部のコンテンツ部分
  cardBody: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 4,
  },

  // 科目名のタイトル（ヘッダーの一段下）
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },

  // 科目詳細のグレー枠（教員・教室など）
  subjectDetailContainer: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  // 「教員：◯◯」などの横並び行
  subjectDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start', // 複数行になることがあるので上揃え
    marginBottom: 8,
  },
  // 「教員：」「教室：」などのラベル側
  subjectDetailLabel: {
    fontSize: 14,
    fontWeight: 'bold', // ラベルは太字
    color: '#000',
    marginRight: 4,
  },
  // 実際の内容テキスト側
  subjectDetailValue: {
    flex: 1,
    fontSize: 14,
    color: '#000', // 内容は通常の黒
    lineHeight: 20,
    flexWrap: 'wrap', // 折り返し対応
  },

  // 進捗と出席率表示の枠
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between', // 左右に分ける
    alignItems: 'center',
    backgroundColor: '#e8f5e9', // 薄い緑
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  // 「授業回数進捗: ◯/15」
  progressLeft: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  // 「出席率: ◯%」
  progressRight: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4caf50',
  },

  // 3つのカード全体の横並び
  attendanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  // 出席 / 欠席 / 遅刻 それぞれのカード
  attendanceGroup: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 10,
    marginHorizontal: 4,
  },
  // カード上部のタイトル
  groupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  // 出席数の数字
  countValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  // + と − ボタンの横並びエリア
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 90,
  },
  // + / - ボタン本体
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
  // + / - の文字
  stepperSign: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },

  // 右上の設定ボタン（•••）
  settingsButton: {
    width: 36,
    height: 20,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  settingsButtonText: {
    fontSize: 24,
    lineHeight: 24,
    color: '#555',
  },

  // 右上の×ボタン
  closeButton: {
    width: 36,
    height: 20,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    lineHeight: 24,
    color: '#555',
  },
});
