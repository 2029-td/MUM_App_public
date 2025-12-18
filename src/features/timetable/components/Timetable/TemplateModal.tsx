// src/features/timetable/components/Timetable/TemplateModal.tsx

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Chip } from 'react-native-paper';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { ActiveTerm } from '../../types';
import { useAppTheme } from '~/hooks/useAppTheme';
import { compositeOver } from '~/styles/color';

type PickerKind = 'grade' | 'year';

interface YearTermModalProps {
  visible: boolean;
  activeYear: number;
  activeTerm: ActiveTerm;
  activeGrade: number;
  onChangeYear: (year: number) => void;
  onChangeTerm: (term: ActiveTerm) => void;
  onChangeGrade: (grade: number) => void;
  onClose: () => void;
}

export const YearTermModal: React.FC<YearTermModalProps> = ({
  visible,
  activeYear,
  activeTerm,
  activeGrade,
  onChangeYear,
  onChangeTerm,
  onChangeGrade,
  onClose,
}) => {
  const { theme, themeId } = useAppTheme();
  const isDark = themeId === 'dark';

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerKind, setPickerKind] = useState<PickerKind>('grade');

  const [tempYear, setTempYear] = useState(activeYear);
  const [tempGrade, setTempGrade] = useState(activeGrade);

  useEffect(() => {
    if (visible) {
      setTempYear(activeYear);
      setTempGrade(activeGrade);
    }
  }, [visible, activeYear, activeGrade]);

  const yearOptions = useMemo(() => {
    const thisYear = new Date().getFullYear();
    return Array.from({ length: 7 }, (_, i) => thisYear - 3 + i);
  }, []);

  const gradeOptions = [1, 2, 3, 4];

  const openPicker = (kind: PickerKind) => {
    setPickerKind(kind);
    setPickerVisible(true);
  };

  const closePicker = () => setPickerVisible(false);

  const confirmPicker = () => {
    if (pickerKind === 'year') onChangeYear(tempYear);
    else onChangeGrade(tempGrade);
    setPickerVisible(false);
  };

  const options = pickerKind === 'year' ? yearOptions : gradeOptions;
  const tempValue = pickerKind === 'year' ? tempYear : tempGrade;
  const setTempValue = pickerKind === 'year' ? setTempYear : setTempGrade;

  const overlayBg = 'rgba(0,0,0,0.55)';

  const cardBg = isDark
    ? compositeOver('rgba(255,255,255,0.10)', theme.backgroundColor)
    : compositeOver('rgba(0,0,0,0.06)', '#FFFFFF');

  const sectionBg = isDark
    ? compositeOver('rgba(0,0,0,0.22)', cardBg)
    : compositeOver('rgba(0,0,0,0.06)', cardBg);

  const borderColor = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)';
  const dividerColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)';

  const mutedText = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)';

  const rowBg = isDark
    ? compositeOver('rgba(255,255,255,0.07)', sectionBg)
    : compositeOver('rgba(0,0,0,0.04)', '#FFFFFF');

  const inputBorder = isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.16)';

  // Chip
  const chipBg = isDark
    ? compositeOver('rgba(255,255,255,0.08)', cardBg)
    : compositeOver('rgba(0,0,0,0.04)', '#FFFFFF');

  const chipSelectedBg = isDark
    ? compositeOver('rgba(255,255,255,0.14)', cardBg)
    : compositeOver('rgba(0,0,0,0.08)', '#FFFFFF');

  const chipBorder = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)';
  const chipSelectedBorder = isDark ? 'rgba(255,255,255,0.32)' : 'rgba(0,0,0,0.28)';

  // Picker
  const pickerOverlayBg = 'rgba(0,0,0,0.45)';

  const pickerCardBg = isDark
    ? compositeOver('rgba(255,255,255,0.10)', theme.backgroundColor)
    : '#FFFFFF';

  const optionSelectedBg = isDark
    ? compositeOver('rgba(255,255,255,0.10)', pickerCardBg)
    : 'rgba(0,0,0,0.06)';

  const actionBlue = isDark ? 'rgba(90,165,255,1.0)' : '#007aff';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: overlayBg }]}>
        <View style={[styles.modalContent, { backgroundColor: cardBg, borderColor, borderWidth: 1 }]}>
          {/* ヘッダー */}
          <View style={[styles.headerRow, { borderBottomColor: dividerColor, borderBottomWidth: StyleSheet.hairlineWidth, paddingBottom: 8 }]}>
            <Text style={[styles.modalTitle, { color: theme.textColor }]}>年度 / 学期切替</Text>

            {/* ×ボタン */}
            <TouchableOpacity onPress={onClose}>
              <Text style={[styles.closeIconText, { color: theme.textColor }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* 学年 */}
          <Text style={[styles.sectionLabel, { color: mutedText }]}>学年</Text>
          <TouchableOpacity
            style={[
              styles.row,
              { backgroundColor: rowBg, borderColor: inputBorder },
            ]}
            onPress={() => openPicker('grade')}
          >
            <Text style={[styles.rowValue, { color: theme.textColor }]}>{activeGrade}年</Text>
            <Ionicons name="chevron-down" size={20} color={mutedText} />
          </TouchableOpacity>

          {/* 年度 */}
          <Text style={[styles.sectionLabel, { color: mutedText }]}>年度</Text>
          <TouchableOpacity
            style={[
              styles.row,
              { backgroundColor: rowBg, borderColor: inputBorder },
            ]}
            onPress={() => openPicker('year')}
          >
            <Text style={[styles.rowValue, { color: theme.textColor }]}>{activeYear}年度</Text>
            <Ionicons name="chevron-down" size={20} color={mutedText} />
          </TouchableOpacity>

          {/* 学期 */}
          <Text style={[styles.sectionLabel, { color: mutedText }]}>学期</Text>
          <View style={styles.termChipsRow}>
            <Chip
              selected={activeTerm === '前期'}
              onPress={() => onChangeTerm('前期')}
              style={[
                styles.termChip,
                {
                  backgroundColor: activeTerm === '前期' ? chipSelectedBg : chipBg,
                  borderColor: activeTerm === '前期' ? chipSelectedBorder : chipBorder,
                },
              ]}
              textStyle={{
                color: theme.textColor,
                fontWeight: activeTerm === '前期' ? '800' : '700',
              }}
            >
              前期
            </Chip>

            <Chip
              selected={activeTerm === '後期'}
              onPress={() => onChangeTerm('後期')}
              style={[
                styles.termChip,
                {
                  backgroundColor: activeTerm === '後期' ? chipSelectedBg : chipBg,
                  borderColor: activeTerm === '後期' ? chipSelectedBorder : chipBorder,
                },
              ]}
              textStyle={{
                color: theme.textColor,
                fontWeight: activeTerm === '後期' ? '800' : '700',
              }}
            >
              後期
            </Chip>
          </View>
        </View>
      </View>

      {/* 共通 Picker Modal */}
      <Modal visible={pickerVisible} transparent animationType="fade">
        <View style={[styles.pickerBackdrop, { backgroundColor: pickerOverlayBg }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closePicker} />

          <View style={[styles.pickerCard, { backgroundColor: pickerCardBg, borderColor, borderWidth: 1 }]}>
            <View style={[styles.pickerHeader, { borderBottomColor: dividerColor }]}>
              <TouchableOpacity onPress={closePicker}>
                <Text style={[styles.pickerHeaderButton, { color: actionBlue }]}>キャンセル</Text>
              </TouchableOpacity>

              <Text style={[styles.pickerHeaderTitle, { color: theme.textColor }]}>
                {pickerKind === 'year' ? '年度を選択' : '学年を選択'}
              </Text>

              <TouchableOpacity onPress={confirmPicker}>
                <Text style={[styles.pickerHeaderButton, { color: actionBlue }]}>完了</Text>
              </TouchableOpacity>
            </View>

            <ScrollView>
              {options.map((v) => {
                const selected = v === tempValue;
                return (
                  <TouchableOpacity
                    key={v}
                    style={[
                      styles.optionRow,
                      { borderBottomColor: dividerColor },
                      selected && { backgroundColor: optionSelectedBg },
                    ]}
                    onPress={() => setTempValue(v)}
                  >
                    <Text style={[styles.optionText, { color: theme.textColor }]}>
                      {pickerKind === 'year' ? `${v}年度` : `${v}年`}
                    </Text>

                    {selected && (
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={isDark ? 'rgba(255,255,255,0.80)' : 'rgba(0,0,0,0.55)'}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor は動的に差し込み
  },
  modalContent: {
    // backgroundColor は動的に差し込み
    borderRadius: 12,
    padding: 20,
    width: '90%',
    // borderWidth/borderColor は動的に差し込み
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeIconText: {
    fontSize: 18,
  },
  sectionLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  row: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    // backgroundColor は動的に差し込み
  },
  rowValue: {
    fontSize: 16,
  },
  termChipsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 4,
  },
  termChip: {
    marginHorizontal: 4,
    borderWidth: 1,
  },

  pickerBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor は動的に差し込み
  },
  pickerCard: {
    // backgroundColor は動的に差し込み
    width: '90%',
    borderRadius: 12,
    overflow: 'hidden',
    // borderWidth/borderColor は動的に差し込み
  },
  pickerHeader: {
    height: 44,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pickerHeaderButton: {
    fontSize: 16,
  },
  pickerHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  optionRow: {
    height: 48,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionRowSelected: {
    // 使わない（動的にを差し込む）
  },
  optionText: {
    fontSize: 16,
  },
});
