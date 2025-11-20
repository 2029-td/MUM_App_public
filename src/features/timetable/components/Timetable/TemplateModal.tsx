// src/features/timetable/components/Timetable/TemplateModal.tsx
import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Chip } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import type { ActiveTerm } from '../../types';

interface YearTermModalProps {
  visible: boolean;
  activeYear: number;
  activeTerm: ActiveTerm;
  activeGrade: number;                       // ★ 追加: 学年 1〜4
  onChangeYear: (year: number) => void;
  onChangeTerm: (term: ActiveTerm) => void;
  onChangeGrade: (grade: number) => void;    // ★ 追加: 学年変更
  onClose: () => void;                       // ✕ を押した時に呼ぶ
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
  // ピッカー用一時値
  const [tempYear, setTempYear] = useState<number>(activeYear);
  const [tempGrade, setTempGrade] = useState<number>(activeGrade);

  const [isYearPickerVisible, setIsYearPickerVisible] = useState(false);
  const [isGradePickerVisible, setIsGradePickerVisible] = useState(false);

  // モーダルを開くたびに現在値で初期化
  useEffect(() => {
    if (visible) {
      setTempYear(activeYear);
      setTempGrade(activeGrade);
    }
  }, [visible, activeYear, activeGrade]);

  // 年度候補
  const yearOptions = useMemo(() => {
    const thisYear = new Date().getFullYear();
    const years: number[] = [];
    for (let i = -3; i <= 3; i++) {
      years.push(thisYear + i);
    }
    return years;
  }, []);

  // 学年候補（1〜4）
  const gradeOptions = [1, 2, 3, 4];

  const openYearPicker = () => {
    setTempYear(activeYear);
    setIsYearPickerVisible(true);
  };
  const closeYearPicker = () => setIsYearPickerVisible(false);
  const handleYearConfirm = () => {
    onChangeYear(tempYear);          // ここでは state 更新だけ（テンプレ切り替えは親の onClose で）
    setIsYearPickerVisible(false);
  };

  const openGradePicker = () => {
    setTempGrade(activeGrade);
    setIsGradePickerVisible(true);
  };
  const closeGradePicker = () => setIsGradePickerVisible(false);
  const handleGradeConfirm = () => {
    onChangeGrade(tempGrade);
    setIsGradePickerVisible(false);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* タイトル＋✕ */}
          <View style={styles.headerRow}>
            <Text style={styles.modalTitle}>年度 / 学期切替</Text>
            <TouchableOpacity style={styles.closeIconButton} onPress={onClose}>
              <Text style={styles.closeIconText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.description}>
            年度や学期、学年が変わった時は、こちらから設定を変更してください。
            異なる条件が設定されている場合、授業データなどが正しく対応しない可能性があります。
          </Text>

          {/* ★ 学年 */}
          <Text style={styles.sectionLabel}>学年</Text>
          <TouchableOpacity style={styles.row} onPress={openGradePicker}>
            <Text style={styles.rowValue}>{activeGrade}年</Text>
            <Text style={styles.rowIcon}>▾</Text>
          </TouchableOpacity>

          {/* 年度 */}
          <Text style={styles.sectionLabel}>年度</Text>
          <TouchableOpacity style={styles.row} onPress={openYearPicker}>
            <Text style={styles.rowValue}>{activeYear}年度</Text>
            <Text style={styles.rowIcon}>▾</Text>
          </TouchableOpacity>

          {/* 学期（前期/後期ボタンは元のまま） */}
          <Text style={styles.sectionLabel}>学期</Text>
          <View style={styles.termChipsRow}>
            <Chip
              mode="flat"
              selected={activeTerm === '前期'}
              onPress={() => onChangeTerm('前期')}
              style={[styles.termChip, activeTerm === '前期' && styles.termChipSelected]}
              selectedColor="#000"
              textStyle={{ color: '#000' }}
            >
              前期
            </Chip>
            <Chip
              mode="flat"
              selected={activeTerm === '後期'}
              onPress={() => onChangeTerm('後期')}
              style={[styles.termChip, activeTerm === '後期' && styles.termChipSelected]}
              selectedColor="#000"
              textStyle={{ color: '#000' }}
            >
              後期
            </Chip>
          </View>
        </View>
      </View>

      {/* 年度ホイール */}
      <Modal
        visible={isYearPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={closeYearPicker}
      >
        <View style={styles.pickerBackdrop}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={closeYearPicker}>
                <Text style={styles.pickerHeaderButton}>キャンセル</Text>
              </TouchableOpacity>
              <Text style={styles.pickerHeaderTitle}>年度を選択</Text>
              <TouchableOpacity onPress={handleYearConfirm}>
                <Text style={styles.pickerHeaderButton}>完了</Text>
              </TouchableOpacity>
            </View>
            <Picker
              selectedValue={tempYear}
              onValueChange={(value) => setTempYear(value)}
            >
              {yearOptions.map(year => (
                <Picker.Item key={year} label={String(year)} value={year} />
              ))}
            </Picker>
          </View>
        </View>
      </Modal>

      {/* 学年ホイール */}
      <Modal
        visible={isGradePickerVisible}
        transparent
        animationType="slide"
        onRequestClose={closeGradePicker}
      >
        <View style={styles.pickerBackdrop}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={closeGradePicker}>
                <Text style={styles.pickerHeaderButton}>キャンセル</Text>
              </TouchableOpacity>
              <Text style={styles.pickerHeaderTitle}>学年を選択</Text>
              <TouchableOpacity onPress={handleGradeConfirm}>
                <Text style={styles.pickerHeaderButton}>完了</Text>
              </TouchableOpacity>
            </View>
            <Picker
              selectedValue={tempGrade}
              onValueChange={(value) => setTempGrade(value)}
            >
              {gradeOptions.map(grade => (
                <Picker.Item key={grade} label={`${grade}年`} value={grade} />
              ))}
            </Picker>
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
    maxHeight: '80%',
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
    color: '#333',
  },
  closeIconButton: {
    padding: 4,
  },
  closeIconText: {
    fontSize: 18,
    color: '#666',
  },
  description: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    color: '#777',
    marginBottom: 4,
  },
  row: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
  },
  rowValue: {
    fontSize: 16,
    color: '#333',
  },
  rowIcon: {
    fontSize: 16,
    color: '#999',
  },
  termChipsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
    marginTop: 4,
  },
  termChip: {
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f7f7f7',
  },
  termChipSelected: {
    backgroundColor: '#e0f2f1',
    borderColor: '#26a69a',
  },
  pickerBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  pickerContainer: {
    backgroundColor: '#f8f8f8',
  },
  pickerHeader: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
    backgroundColor: '#fff',
  },
  pickerHeaderButton: {
    fontSize: 16,
    color: '#007aff',
  },
  pickerHeaderTitle: {
    fontSize: 16,
    color: '#333',
  },
});
