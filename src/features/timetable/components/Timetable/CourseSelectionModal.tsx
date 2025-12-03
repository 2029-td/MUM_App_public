import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import type { CourseData, Theme } from '../../types';

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
  const [keyword, setKeyword] = useState('');

  // モーダルを閉じたら検索キーワードはリセット
  useEffect(() => {
    if (!visible) {
      setKeyword('');
    }
  }, [visible]);

  // キーワードで科目を絞り込み
  const filteredCourses = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return courses;

    return courses.filter(course => {
      const name = (course.科目名 ?? '').toLowerCase();
      const teacher = (course.教員 ?? '').toLowerCase();
      return (
        name.includes(q) ||
        teacher.includes(q)
      );
    });
  }, [courses, keyword]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>

          {/* 右上の×ボタン */}
          <TouchableOpacity
            style={styles.topCloseButton}
            onPress={onClose}
            accessibilityLabel="閉じる"
          >
            <Text style={styles.topCloseText}>×</Text>
          </TouchableOpacity>

          <Text style={styles.modalTitle}>
            {selectedDay}曜{selectedPeriod}限
          </Text>

          {/* 🔍 検索ボックス */}
          <TextInput
            style={styles.searchInput}
            placeholder="科目名・教員名で絞り込み"
            placeholderTextColor="#999"
            value={keyword}
            onChangeText={setKeyword}
          />

          <ScrollView style={styles.courseList}>
            {filteredCourses.map((course, index) => (
              <TouchableOpacity
                key={index}
                style={styles.courseItem}
                onPress={() => onSelect(course)}
              >
                <Text style={styles.courseName}>{course.科目名}</Text>
                <Text style={styles.courseInfo}>
                  教員：{course.教員}
                </Text>
              </TouchableOpacity>
            ))}
            {filteredCourses.length === 0 && (
              <View style={{ padding: 10 }}>
                <Text style={{ textAlign: 'center', color: '#666' }}>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    position: 'relative',
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
