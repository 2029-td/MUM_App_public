// src/features/timetable/components/Timetable/TemplateModal.tsx
import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import { Chip } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import type { ActiveTerm } from '../../types';

interface YearTermModalProps {
  visible: boolean;
  activeYear: number;
  activeTerm: ActiveTerm;                 // '前期' | '後期'
  onChangeYear: (year: number) => void;   // ← 親の state を更新するだけ
  onChangeTerm: (term: ActiveTerm) => void;
  onClose: () => void;                    // ← ✕ を押したときに呼ばれる（確定タイミング）
}

export const YearTermModal: React.FC<YearTermModalProps> = ({
  visible,
  activeYear,
  activeTerm,
  onChangeYear,
  onChangeTerm,
  onClose,
}) => {
  // ピッカー用の一時選択値
  const [tempYear, setTempYear] = useState<number>(activeYear);

  const [isYearPickerVisible, setIsYearPickerVisible] = useState(false);

  // モーダルを開くたびに現在値で初期化
  useEffect(() => {
    if (visible) {
      setTempYear(activeYear);
    }
  }, [visible, activeYear]);

  // 年度の候補（必要に応じて範囲は調整してOK）
  const yearOptions = useMemo(() => {
    const thisYear = new Date().getFullYear();
    const years: number[] = [];
    for (let i = -3; i <= 3; i++) {
      years.push(thisYear + i);
    }
    return years;
  }, []);

  const openYearPicker = () => {
    setTempYear(activeYear);
    setIsYearPickerVisible(true);
  };

  const closeYearPicker = () => {
    setIsYearPickerVisible(false);
  };

  const handleYearConfirm = () => {
    // 年度の変更はここで親に反映（ただしテンプレ切り替えはまだ）
    onChangeYear(tempYear);
    setIsYearPickerVisible(false);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* === 中央に出るモーダル構造 === */}
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* ヘッダー：タイトル＋右上バツ */}
          <View style={styles.headerRow}>
            <Text style={styles.modalTitle}>年度 / 学期切替</Text>
            <TouchableOpacity
              onPress={onClose}  // ← ここが「確定して閉じる」タイミング
              style={styles.closeIconButton}
            >
              <Text style={styles.closeIconText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* 年度行：タップすると下からホイール */}
          <Text style={styles.sectionLabel}>年度</Text>
          <TouchableOpacity style={styles.row} onPress={openYearPicker}>
            <Text style={styles.rowValue}>{activeYear}年度</Text>
            <Text style={styles.rowIcon}>▾</Text>
          </TouchableOpacity>

          {/* 前期 / 後期ボタン（見た目は元のまま） */}
          <Text style={styles.sectionLabel}>学期</Text>
          <View style={styles.termChipsRow}>
            <Chip
              mode="flat"
              selected={activeTerm === '前期'}
              onPress={() => onChangeTerm('前期')} // ここでは state を変えるだけ
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

      {/* === 年度ピッカー（下から出てくるホイール） === */}
      <Modal
        visible={isYearPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={closeYearPicker}
      >
        <View style={styles.pickerBackdrop}>
          <View style={styles.pickerContainer}>
            {/* 上のバー（キャンセル / タイトル / 完了） */}
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={closeYearPicker}>
                <Text style={styles.pickerHeaderButton}>キャンセル</Text>
              </TouchableOpacity>
              <Text style={styles.pickerHeaderTitle}>年度を選択</Text>
              <TouchableOpacity onPress={handleYearConfirm}>
                <Text style={styles.pickerHeaderButton}>完了</Text>
              </TouchableOpacity>
            </View>

            {/* ホイールピッカー本体 */}
            <Picker
              selectedValue={tempYear}
              onValueChange={(value) => setTempYear(value)}
            >
              {yearOptions.map(year => (
                <Picker.Item
                  key={year}
                  label={String(year)}
                  value={year}
                />
              ))}
            </Picker>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // 中央モーダル
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
    alignItems: 'center',
    justifyContent: 'space-between',
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

  // 前期/後期ボタン
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

  // ピッカー
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
