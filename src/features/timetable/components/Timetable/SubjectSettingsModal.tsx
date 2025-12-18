// src/features/timetable/components/Timetable/SubjectSettingsModal.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import type { Subject } from '../../types';
import { colorPalette } from '../../constants';
import { showDeleteConfirm } from './showDeleteConfirm';
import { useAppTheme } from '~/hooks/useAppTheme';
import { compositeOver } from '~/styles/color';

type Props = {
  visible: boolean;
  subject: Subject | null;
  onClose: () => void;
  onDelete: () => void | Promise<void>;
  onSubjectUpdate: (updatedSubject: Subject) => void | Promise<void>;
};

export const SubjectSettingsModal: React.FC<Props> = ({
  visible,
  subject,
  onClose,
  onDelete,
  onSubjectUpdate,
}) => {
  const { theme, themeId } = useAppTheme();
  const isDark = themeId === 'dark';

  const [local, setLocal] = useState<Subject | null>(null);
  const [creditsInput, setCreditsInput] = useState<string>('');
  const [totalClassesInput, setTotalClassesInput] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (subject) {
      setLocal({ ...subject });
      setCreditsInput(subject.credits && subject.credits > 0 ? String(subject.credits) : '');
      setTotalClassesInput(
        subject.totalClasses && subject.totalClasses > 0 ? String(subject.totalClasses) : '15'
      );
    } else {
      setLocal(null);
      setCreditsInput('');
      setTotalClassesInput('');
    }
  }, [subject, visible]);

  const handleColorChange = useCallback(
    async (color: string) => {
      if (!local) return;
      const updated = { ...local, color };
      setLocal(updated);
      await Promise.resolve(onSubjectUpdate(updated));
    },
    [local, onSubjectUpdate]
  );

  const commitCredits = useCallback(async () => {
    if (!local) return;
    const parsed = parseInt(creditsInput, 10);
    const committed = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;

    const updated = { ...local, credits: committed };
    setLocal(updated);
    setCreditsInput(committed > 0 ? String(committed) : '');
    await Promise.resolve(onSubjectUpdate(updated));
  }, [creditsInput, local, onSubjectUpdate]);

  const commitTotalClasses = useCallback(async () => {
    if (!local) return;
    const parsed = parseInt(totalClassesInput, 10);
    const committed = Number.isFinite(parsed) && parsed > 0 ? parsed : 15;

    const updated = { ...local, totalClasses: committed };
    setLocal(updated);
    setTotalClassesInput(String(committed));
    await Promise.resolve(onSubjectUpdate(updated));
  }, [totalClassesInput, local, onSubjectUpdate]);

  /**
   * ✅ フリーズ対策：
   * - OKを押したら先にこのモーダルを閉じる
   * - 削除は非同期で実行し、ボタンをローディング表示＆連打防止
   */
  const handleDelete = useCallback(() => {
    if (isDeleting) return;

    showDeleteConfirm(() => {
      onClose();
      setIsDeleting(true);

      Promise.resolve(onDelete())
        .catch((e) => console.error('Delete failed:', e))
        .finally(() => setIsDeleting(false));
    });
  }, [isDeleting, onClose, onDelete]);

  if (!local) return null;

  // 背景
  const backdrop = isDark ? 'rgba(0,0,0,0.60)' : 'rgba(0,0,0,0.35)';

  // カード
  const cardBg = isDark
    ? compositeOver('rgba(255,255,255,0.10)', theme.backgroundColor)
    : '#FFFFFF';

  // カード枠線
  const cardBorder = isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.15)';

  // 区切り線
  const divider = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';

  // テキスト
  const titleColor = isDark ? theme.textColor : '#333333';
  const labelColor = isDark ? compositeOver('rgba(255,255,255,0.80)', cardBg) : '#666666';
  const sectionLabelColor = isDark ? theme.textColor : '#333333';

  // 入力
  const inputBg = isDark
    ? compositeOver('rgba(255,255,255,0.08)', cardBg)
    : '#FFFFFF';
  const inputBorder = isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.18)';
  const placeholder = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.35)';

  // 色選択リング：ライトは黒、ダークは白
  const selectedRing = isDark ? '#FFFFFF' : '#000000';
  const dotBorder = isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.18)';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.backdrop, { backgroundColor: backdrop }]}>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          {/* ヘッダー */}
          <View style={[styles.header, { borderBottomColor: divider }]}>
            <Text style={[styles.title, { color: titleColor }]}>科目設定</Text>

            {/* ×ボタン */}
            <TouchableOpacity onPress={onClose} accessibilityLabel="設定を閉じる" style={styles.closeBtn}>
              <Text style={[styles.closeText, { color: titleColor }]}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <Text style={[styles.sectionLabel, { color: sectionLabelColor }]}>科目の色を選択</Text>

            {/* 1列で横並び感（端末幅が狭ければ折返し） */}
            <View style={styles.palette}>
              {colorPalette.map((c, i) => {
                const isSelected = local.color === c;
                return (
                  <TouchableOpacity
                    key={`${c}-${i}`}
                    style={[
                      styles.colorDot,
                      { backgroundColor: c, borderColor: dotBorder },
                      isSelected && { borderWidth: 3, borderColor: selectedRing },
                    ]}
                    onPress={() => handleColorChange(c)}
                  />
                );
              })}
            </View>

            {/* 入力は“カード内にそのまま”2カラム、別枠カードは使わない */}
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: labelColor }]}>単位数</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: inputBg,
                      borderColor: inputBorder,
                      color: titleColor,
                    },
                  ]}
                  keyboardType="numeric"
                  value={creditsInput}
                  onChangeText={setCreditsInput}
                  onEndEditing={commitCredits}
                  placeholder=""
                  placeholderTextColor={placeholder}
                />
              </View>

              <View style={{ width: 12 }} />

              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: labelColor }]}>総授業回数</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: inputBg,
                      borderColor: inputBorder,
                      color: titleColor,
                    },
                  ]}
                  keyboardType="numeric"
                  value={totalClassesInput}
                  onChangeText={setTotalClassesInput}
                  onEndEditing={commitTotalClasses}
                  placeholder="15"
                  placeholderTextColor={placeholder}
                />
              </View>
            </View>

            {/* 赤い全幅ボタン */}
            <TouchableOpacity
              style={[styles.deleteButton, isDeleting && { opacity: 0.75 }]}
              onPress={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <View style={styles.deletingRow}>
                  <ActivityIndicator color="#fff" />
                  <Text style={styles.deleteText}>科目を削除中...</Text>
                </View>
              ) : (
                <Text style={styles.deleteText}>科目を削除</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },

  card: {
    width: '100%',
    maxWidth: 560,
    maxHeight: '90%',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1, 
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  closeBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },

  closeText: {
    fontSize: 22,
    lineHeight: 22,
    fontWeight: 'bold',
  },

  body: {
    padding: 16,
  },

  sectionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  palette: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },

  colorDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  inputLabel: {
    fontSize: 12,
    marginBottom: 6,
  },

  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
  },

  deleteButton: {
    marginTop: 4,
    backgroundColor: '#F44336',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },

  deletingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  deleteText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SubjectSettingsModal;
