// src/features/timetable/components/Timetable/TimetableSettingsModal.tsx

import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Switch, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { Theme } from '../../types';

type Props = {
  visible: boolean;
  onClose: () => void;
  theme: Theme;

  onPressYearTerm: () => void;

  showSaturday: boolean;
  onToggleShowSaturday: (next: boolean) => void;
};

// ✅ React.FC を使わず、返り値を JSX.Element に固定（「オブジェクトを返している」系の誤検知を避ける）
export function TimetableSettingsModal(props: Props) {
  const {
    visible,
    onClose,
    theme,
    onPressYearTerm,
    showSaturday,
    onToggleShowSaturday,
  } = props;

  const textColor = theme.textColor;
  const cardBg = theme.backgroundColor;
  const itemBg = theme.headerButtonColor;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: textColor }]}>設定</Text>

            {/* ✅ 右上 × ボタンで閉じる */}
            <TouchableOpacity onPress={onClose} style={styles.closeButton} accessibilityRole="button">
              <Ionicons name="close" size={20} color={textColor} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.itemRow, { backgroundColor: itemBg }]}
            onPress={() => {
              onClose();
              onPressYearTerm();
            }}
            accessibilityRole="button"
          >
            <View style={styles.itemLeft}>
              <Ionicons name="calendar-outline" size={18} color={textColor} />
              <Text style={[styles.itemText, { color: textColor }]}>年度/学期</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={textColor} />
          </TouchableOpacity>

          <View style={[styles.toggleRow, { backgroundColor: itemBg }]}>
            <View style={styles.itemLeft}>
              <Ionicons name="today-outline" size={18} color={textColor} />
              <Text style={[styles.itemText, { color: textColor }]}>土曜日を表示</Text>
            </View>

            <View style={styles.switchWrap}>
              <Switch
                value={showSaturday}
                onValueChange={onToggleShowSaturday}
                style={styles.switch}
              />
            </View>
          </View>

          <View style={[styles.hintBox, { backgroundColor: theme.cellBackgroundColor }]}>
            <Text style={[styles.hintText, { color: textColor }]}>
              ※ 土曜を非表示にしてもデータは削除されません
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '88%',
    maxWidth: 420,
    borderRadius: 12,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: { fontSize: 18, fontWeight: 'bold' },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  itemRow: {
    height: 48,
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  toggleRow: {
    height: 48,
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  itemLeft: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  itemText: { 
    fontSize: 16, 
    marginLeft: 8 
  },

  switchWrap: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  switch: {
    transform: [{ translateY: Platform.OS === 'ios' ? 1 : 0 }],
  },  

  hintBox: { 
    marginTop: 12, 
    borderRadius: 10, 
    padding: 10 
  },
  hintText: { 
    fontSize: 12, 
    opacity: 0.85 
  },
});
