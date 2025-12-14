// src/features/timetable/components/Timetable/TemplateModal.tsx

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { Chip } from 'react-native-paper';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { ActiveTerm } from '../../types';

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

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* ヘッダー */}
          <View style={styles.headerRow}>
            <Text style={styles.modalTitle}>年度 / 学期切替</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeIconText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* 学年 */}
          <Text style={styles.sectionLabel}>学年</Text>
          <TouchableOpacity style={styles.row} onPress={() => openPicker('grade')}>
            <Text style={styles.rowValue}>{activeGrade}年</Text>
            <Ionicons name="chevron-down" size={20} color="#999999" />
          </TouchableOpacity>

          {/* 年度 */}
          <Text style={styles.sectionLabel}>年度</Text>
          <TouchableOpacity style={styles.row} onPress={() => openPicker('year')}>
            <Text style={styles.rowValue}>{activeYear}年度</Text>
            <Ionicons name="chevron-down" size={20} color="#999999" />
          </TouchableOpacity>

          {/* 学期 */}
          <Text style={styles.sectionLabel}>学期</Text>
          <View style={styles.termChipsRow}>
            <Chip
              selected={activeTerm === '前期'}
              onPress={() => onChangeTerm('前期')}
              style={[
                styles.termChip,
                activeTerm === '前期' && styles.termChipSelected,
              ]}
            >
              前期
            </Chip>
            <Chip
              selected={activeTerm === '後期'}
              onPress={() => onChangeTerm('後期')}
              style={[
                styles.termChip,
                activeTerm === '後期' && styles.termChipSelected,
              ]}
            >
              後期
            </Chip>
          </View>
        </View>
      </View>

      {/* 共通 Picker Modal */}
      <Modal visible={pickerVisible} transparent animationType="fade">
        <View style={styles.pickerBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closePicker} />

          <View style={styles.pickerCard}>
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={closePicker}>
                <Text style={styles.pickerHeaderButton}>キャンセル</Text>
              </TouchableOpacity>
              <Text style={styles.pickerHeaderTitle}>
                {pickerKind === 'year' ? '年度を選択' : '学年を選択'}
              </Text>
              <TouchableOpacity onPress={confirmPicker}>
                <Text style={styles.pickerHeaderButton}>完了</Text>
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
                      selected && styles.optionRowSelected,
                    ]}
                    onPress={() => setTempValue(v)}
                  >
                    <Text style={styles.optionText}>
                      {pickerKind === 'year' ? `${v}年度` : `${v}年`}
                    </Text>
                    {selected && (
                      <Ionicons name="checkmark" size={20} color="#333333" />
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
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
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
    color: '#333333',
  },
  closeIconText: {
    fontSize: 18,
    color: '#666666',
  },
  sectionLabel: {
    fontSize: 12,
    color: '#777777',
    marginBottom: 4,
  },
  row: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dddddd',
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
  },
  rowValue: {
    fontSize: 16,
    color: '#333333',
  },
  termChipsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 4,
  },
  termChip: {
    marginHorizontal: 4,
    backgroundColor: '#f7f7f7',
    borderWidth: 1,
    borderColor: '#dddddd',
  },
  termChipSelected: {
    backgroundColor: '#e0f2f1',
    borderColor: '#26a69a',
  },
  pickerBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  pickerCard: {
    backgroundColor: 'white',
    width: '90%',
    borderRadius: 10,
    overflow: 'hidden',
  },
  pickerHeader: {
    height: 44,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#cccccc',
  },
  pickerHeaderButton: {
    fontSize: 16,
    color: '#007aff',
  },
  pickerHeaderTitle: {
    fontSize: 16,
    color: '#333333',
  },
  optionRow: {
    height: 48,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eeeeee',
  },
  optionRowSelected: {
    backgroundColor: '#f0f0f0',
  },
  optionText: {
    fontSize: 16,
    color: '#333333',
  },
});
