// src/features/timetable/components/Timetable/AttendanceModal.tsx

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import type { Subject } from '../../types';
import { SubjectSettingsModal } from './SubjectSettingsModal';
import { useStyles } from '~/styles';
import { useAppTheme } from '~/hooks/useAppTheme';
import { compositeOver } from '~/styles/color';

interface AttendanceModalProps {
  visible: boolean;
  subject: Subject | null;
  onClose: () => void;

  // ※呼び出し側互換のため残す（このファイル内では未使用でもOK）
  onUpdate: (type: 'attendance' | 'absence' | 'late') => void;

  onDelete: () => void;
  onSubjectUpdate: (updatedSubject: Subject) => void | Promise<void>;
}

export const AttendanceModal: React.FC<AttendanceModalProps> = ({
  visible,
  subject,
  onClose,
  onDelete,
  onSubjectUpdate,
}) => {
  const { colors } = useStyles();
  const { themeId } = useAppTheme();
  const isDark = themeId === 'dark';

  const [localSubject, setLocalSubject] = useState<Subject | null>(null);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);

  useEffect(() => {
    if (visible && subject) {
      setLocalSubject({ ...subject });
    } else if (!visible) {
      setLocalSubject(null);
      setIsSettingsVisible(false);
    }
  }, [visible, subject]);

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

  if (!visible || !localSubject) return null;

  // ===== 色（1枚目の雰囲気に寄せて “濃く”） =====
  const overlayBg = 'rgba(0,0,0,0.55)';

  // カード面（useStyles の modalSurface をベースに）
  const cardBg = colors.modalSurface;

  // 詳細枠：ダークはさらに沈める / ライトは白より少し沈める
  const detailBg = isDark
    ? compositeOver('rgba(0,0,0,0.22)', cardBg)
    : compositeOver('rgba(0,0,0,0.06)', cardBg);

  const line = colors.timetableGridLine;

  // 進捗バー：ダークは少し明るく、ライトは緑味を薄く敷く
  const progressBg = isDark
    ? compositeOver('rgba(255,255,255,0.01)', cardBg)
    : compositeOver('rgba(76,175,80,0.14)', cardBg);

  const progressRight = isDark ? 'rgba(150, 220, 170, 0.95)' : '#2E7D32';

  const tint = (rgba: string) => compositeOver(rgba, cardBg);

  const metricCards = [
    {
      key: 'attendance' as const,
      title: '出席',
      border: isDark ? 'rgba(130, 220, 160, 0.85)' : '#2E7D32',
      bg: isDark ? tint('rgba(46, 125, 50, 0.22)') : compositeOver('rgba(46,125,50,0.10)', '#FFFFFF'),
    },
    {
      key: 'absence' as const,
      title: '欠席',
      border: isDark ? 'rgba(255, 150, 150, 0.85)' : '#C62828',
      bg: isDark ? tint('rgba(198, 40, 40, 0.22)') : compositeOver('rgba(198,40,40,0.08)', '#FFFFFF'),
    },
    {
      key: 'late' as const,
      title: '遅刻',
      border: isDark ? 'rgba(255, 220, 120, 0.85)' : '#F9A825',
      bg: isDark ? tint('rgba(249, 168, 37, 0.22)') : compositeOver('rgba(249,168,37,0.10)', '#FFFFFF'),
    },
  ];

  const circleEnabled = {
    backgroundColor: isDark
      ? compositeOver('rgba(255,255,255,0.10)', cardBg)
      : '#FFFFFF',
    borderColor: line,
    opacity: 1,
  };

  const circleDisabled = {
    backgroundColor: isDark
      ? compositeOver('rgba(255,255,255,0.05)', cardBg)
      : '#E0E0E0',
    borderColor: line,
    opacity: 0.45,
  };

  const signColor = isDark ? colors.text : '#333';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: 'padding', android: 'height' })}
      >
        <View style={[styles.modalContainer, { backgroundColor: overlayBg }]}>
          <View style={[styles.modalCard, { backgroundColor: cardBg }]}>
            {/* ヘッダー */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                accessibilityLabel="設定を開く"
                onPress={() => setIsSettingsVisible(true)}
                style={styles.iconButton}
              >
                <Text style={[styles.iconText, { color: colors.text }]}>⋯</Text>
              </TouchableOpacity>

              <TouchableOpacity
                accessibilityLabel="詳細画面を閉じる"
                onPress={onClose}
                style={styles.iconButton}
              >
                <Text style={[styles.iconText, { color: colors.text }]}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
              contentContainerStyle={styles.cardBody}
            >
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {localSubject.name}
              </Text>

              {/* 科目詳細 */}
              <View
                style={[
                  styles.subjectDetailContainer,
                  {
                    backgroundColor: detailBg,
                    borderColor: line,
                  },
                ]}
              >
                <View style={styles.subjectDetailRow}>
                  <Text style={[styles.subjectDetailLabel, { color: colors.text }]}>教員：</Text>
                  <Text
                    style={[styles.subjectDetailValue, { color: colors.text }]}
                    numberOfLines={0}
                  >
                    {localSubject.professor}
                  </Text>
                </View>

                <View style={styles.subjectDetailRow}>
                  <Text style={[styles.subjectDetailLabel, { color: colors.text }]}>教室：</Text>
                  <Text style={[styles.subjectDetailValue, { color: colors.text }]}>
                    {localSubject.room}
                  </Text>
                </View>

                <View style={styles.subjectDetailRow}>
                  <Text style={[styles.subjectDetailLabel, { color: colors.text }]}>校舎：</Text>
                  <Text style={[styles.subjectDetailValue, { color: colors.text }]}>
                    {localSubject.campus}
                  </Text>
                </View>

                <View style={styles.subjectDetailRow}>
                  <Text style={[styles.subjectDetailLabel, { color: colors.text }]}>単位：</Text>
                  <Text style={[styles.subjectDetailValue, { color: colors.text }]}>
                    {localSubject.credits && localSubject.credits > 0 ? `${localSubject.credits}` : '-'}
                  </Text>
                </View>
              </View>

              {/* 進捗 */}
              <View style={[styles.progressRow, { backgroundColor: progressBg, borderColor: line }]}>
                <Text style={[styles.progressLeft, { color: colors.text }]}>
                  授業回数進捗: {totalRawCount} / {TOTAL_CLASSES}
                </Text>
                <Text style={[styles.progressRight, { color: progressRight }]}>
                  出席率: {attendanceRate}%
                </Text>
              </View>

              {/* 出席/欠席/遅刻 */}
              <View style={styles.attendanceRow}>
                {metricCards.map(({ key, title, bg, border }) => {
                  const count = Number(localSubject[key] ?? 0);
                  const isDecrementDisabled = count <= 0;
                  const isIncrementDisabled = isAtOrOverCap;

                  return (
                    <View
                      key={key}
                      style={[
                        styles.attendanceGroup,
                        { backgroundColor: bg, borderColor: border },
                      ]}
                    >
                      <Text style={[styles.groupTitle, { color: border }]}>{title}</Text>

                      <Text style={[styles.countValue, { color: colors.text }]}>{count}</Text>

                      <View style={styles.stepperRow}>
                        <TouchableOpacity
                          style={[
                            styles.stepperCircle,
                            isDecrementDisabled ? circleDisabled : circleEnabled,
                          ]}
                          disabled={isDecrementDisabled}
                          onPress={() => handleDecrement(key)}
                        >
                          <Text
                            style={[
                              styles.stepperSign,
                              { color: signColor },
                              isDecrementDisabled && { color: isDark ? 'rgba(255,255,255,0.35)' : '#999' },
                            ]}
                          >
                            －
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.stepperCircle,
                            isIncrementDisabled ? circleDisabled : circleEnabled,
                          ]}
                          disabled={isIncrementDisabled}
                          onPress={() => handleIncrement(key)}
                        >
                          <Text
                            style={[
                              styles.stepperSign,
                              { color: signColor },
                              isIncrementDisabled && { color: isDark ? 'rgba(255,255,255,0.35)' : '#999' },
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
          setIsSettingsVisible(false);
          await Promise.resolve(onDelete());
        }}
        onSubjectUpdate={onSubjectUpdate}
      />
    </Modal>
  );
};

export default AttendanceModal;

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  modalCard: {
    width: '100%',
    maxWidth: 560,
    maxHeight: '90%',
    borderRadius: 12,
    overflow: 'hidden',
  },

  // 右上（… / ×）
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: 10,
    paddingHorizontal: 10,
    gap: 8,
  },
  iconButton: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  iconText: {
    fontSize: 24,
    lineHeight: 24,
    fontWeight: '700',
  },

  cardBody: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 6,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },

  subjectDetailContainer: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
  },
  subjectDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  subjectDetailLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 4,
  },
  subjectDetailValue: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    flexWrap: 'wrap',
  },

  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
    borderWidth: 1,
  },
  progressLeft: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressRight: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  attendanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  attendanceGroup: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  countValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 92,
  },
  stepperCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
  },
  stepperSign: {
    fontSize: 22,
    fontWeight: '700',
  },
});
