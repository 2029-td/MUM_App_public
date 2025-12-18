// src/features/timetable/components/Timetable/CourseSelectionModal.tsx

import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet, TextInput } from 'react-native';
import type { CourseData, Theme } from '../../types';
import { useAppTheme } from '~/hooks/useAppTheme';
import { compositeOver } from '~/styles/color';

interface CourseSelectionModalProps {
  visible: boolean;
  courses: CourseData[];
  selectedDay: string;
  selectedPeriod: number;
  onClose: () => void;
  onSelect: (course: CourseData) => void;
  theme: Theme;
}

export const CourseSelectionModal: React.FC<CourseSelectionModalProps> = ({
  visible,
  courses,
  selectedDay,
  selectedPeriod,
  onClose,
  onSelect,
}) => {
  const { theme, themeId } = useAppTheme();
  const isDark = themeId === 'dark';

  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    if (!visible) setKeyword('');
  }, [visible]);

  const filteredCourses = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return courses;

    return courses.filter(course => {
      const name = (course.科目名 ?? '').toLowerCase();
      const teacher = (course.教員 ?? '').toLowerCase();
      return name.includes(q) || teacher.includes(q);
    });
  }, [courses, keyword]);

  /* ===== 色設計（AttendanceModal / ClassRegistrationModalの系統に寄せる） ===== */

  // モーダルカード本体
  const modalBg = isDark
    ? compositeOver('rgba(255,255,255,0.10)', theme.backgroundColor)
    : '#FFFFFF';

  // 一段内側の面（検索欄・リストの見た目を整える）
  const surfaceBg = isDark
    ? compositeOver('rgba(0,0,0,0.22)', modalBg)
    : compositeOver('rgba(0,0,0,0.05)', modalBg);

  // 枠線
  const borderColor = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)';
  const dividerColor = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)';

  // 文字
  const titleColor = theme.textColor;
  const subTextColor = isDark ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.55)';
  const placeholderColor = isDark ? 'rgba(255,255,255,0.40)' : '#999';

  // 入力欄
  const inputBg = isDark
    ? compositeOver('rgba(255,255,255,0.06)', modalBg)
    : '#FFFFFF';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={[styles.modalContent, { backgroundColor: modalBg, borderColor }]}>
          {/* 右上の×ボタン */}
          <TouchableOpacity
            style={styles.topCloseButton}
            onPress={onClose}
            accessibilityLabel="閉じる"
          >
            <Text style={[styles.topCloseText, { color: titleColor }]}>×</Text>
          </TouchableOpacity>

          <Text style={[styles.modalTitle, { color: titleColor }]}>
            {selectedDay}曜{selectedPeriod}限
          </Text>

          {/* 🔍 検索ボックス */}
          <TextInput
            style={[
              styles.searchInput,
              {
                backgroundColor: inputBg,
                borderColor,
                color: titleColor,
              },
            ]}
            placeholder="科目名・教員名で絞り込み"
            placeholderTextColor={placeholderColor}
            value={keyword}
            onChangeText={setKeyword}
          />

          <ScrollView style={styles.courseList}>
            {filteredCourses.map((course, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.courseItem,
                  {
                    backgroundColor: surfaceBg,
                    borderBottomColor: dividerColor,
                  },
                ]}
                onPress={() => onSelect(course)}
              >
                <Text style={[styles.courseName, { color: titleColor }]}>{course.科目名}</Text>
                <Text style={[styles.courseInfo, { color: subTextColor }]}>
                  教員：{course.教員}
                </Text>
              </TouchableOpacity>
            ))}

            {filteredCourses.length === 0 && (
              <View style={{ padding: 10 }}>
                <Text style={{ textAlign: 'center', color: subTextColor }}>
                  該当する科目がありません
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    position: 'relative',
    borderWidth: 1, // ★追加：カード外枠
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },

  // 🔍 検索ボックス
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    marginBottom: 10,
    backgroundColor: '#fff',
  },

  // 右上×ボタン
  topCloseButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topCloseText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },

  courseList: {
    maxHeight: 300,
    marginTop: 5,
  },
  courseItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    marginBottom: 10,
  },
  courseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5,
  },
  courseInfo: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
  },
  roomText: {
    fontSize: 14,
    color: '#555',
    marginTop: 2,
  },
});
