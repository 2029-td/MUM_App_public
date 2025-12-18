// src/features/timetable/components/Timetable/ClassRegistrationModal.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { colorPalette } from '../../constants';
import type { Subject } from '../../types';
import { useAppTheme } from '~/hooks/useAppTheme';
import { compositeOver } from '~/styles/color';

interface Props {
  visible: boolean;
  subject: Subject | null;
  selectedDay: string;
  selectedPeriod: number;
  onClose: () => void;
  onConfirm: (color: string) => void;
}

export const ClassRegistrationModal: React.FC<Props> = ({
  visible,
  subject,
  selectedDay,
  selectedPeriod,
  onClose,
  onConfirm,
}) => {
  const { theme, themeId } = useAppTheme();
  const isDark = themeId === 'dark';

  const [localSubject, setLocalSubject] = useState<Subject | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>(colorPalette[0]);

  useEffect(() => {
    if (visible && subject) {
      setLocalSubject({ ...subject });
      setSelectedColor(subject.color || colorPalette[0]);
    } else if (!visible) {
      setLocalSubject(null);
    }
  }, [visible, subject]);

  if (!visible || !localSubject) return null;

  // モーダルカード本体
  const cardBg = isDark
    ? compositeOver('rgba(255,255,255,0.10)', theme.backgroundColor)
    : compositeOver('rgba(0,0,0,0.06)', '#FFFFFF');

  // 詳細枠
  const detailBg = isDark
    ? compositeOver('rgba(0,0,0,0.25)', cardBg)
    : compositeOver('rgba(0,0,0,0.08)', cardBg);

  // 登録ボタン（カードより明確に浮かせる）
  const confirmBg = isDark
    ? compositeOver('rgba(255,255,255,0.12)', cardBg)
    : compositeOver('rgba(0,0,0,0.10)', cardBg);

  // 外枠線（詳細枠/ボタン）
  const detailBorderColor = isDark
    ? 'rgba(255,255,255,0.18)'
    : 'rgba(0,0,0,0.20)';

  const confirmBorderColor = isDark
    ? 'rgba(255,255,255,0.22)'
    : 'rgba(0,0,0,0.22)';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          {/* ヘッダー */}
          <View style={styles.header}>
            <Text style={[styles.modalTitle, { color: theme.textColor }]}>
              {`${selectedDay}曜${selectedPeriod}限\n${localSubject.name}`}
            </Text>

            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={[styles.closeButtonText, { color: theme.textColor }]}>×</Text>
            </TouchableOpacity>
          </View>

          {/* 科目詳細 */}
          <View style={[styles.subjectDetailContainer, { backgroundColor: detailBg, borderColor: detailBorderColor, }]}>
            {[
              ['教員', localSubject.professor],
              ['教室', localSubject.room],
              ['校舎', localSubject.campus],
              ['単位', localSubject.credits ?? '-'],
            ].map(([label, value]) => (
              <View key={label} style={styles.subjectDetailRow}>
                <Text style={[styles.subjectDetailLabel, { color: theme.textColor }]}>{label}：</Text>
                <Text style={[styles.subjectDetailValue, { color: theme.textColor }]}>{value}</Text>
              </View>
            ))}
          </View>

          {/* 色選択 */}
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>色を選択</Text>

          <View style={styles.colorGrid}>
            {colorPalette.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorCircle,
                  { backgroundColor: color },
                  selectedColor === color && {
                    borderWidth: 3,
                    borderColor: isDark ? '#FFFFFF' : '#000000', 
                  },
                ]}
                onPress={() => setSelectedColor(color)}
              />
            ))}
          </View>

          {/* 登録ボタン */}
          <TouchableOpacity
            style={[
              styles.confirmButton,
              {
                backgroundColor: confirmBg,
                borderColor: confirmBorderColor, // ★追加
              },
            ]}
            onPress={() => onConfirm(selectedColor)}
          >
            <Text style={[styles.confirmText, { color: theme.textColor }]}>登録</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 14,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 8,
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: 4,
  },
  closeButtonText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  subjectDetailContainer: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
  },
  subjectDetailRow: {
    flexDirection: 'row',
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
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 4,
  },
  colorGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  confirmButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  confirmText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});
