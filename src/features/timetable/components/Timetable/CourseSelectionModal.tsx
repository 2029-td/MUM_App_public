import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
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
  theme,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {selectedDay}曜{selectedPeriod}限の科目を選択
          </Text>

          <ScrollView style={styles.courseList}>
            {courses.map((course, index) => (
              <TouchableOpacity
                key={index}
                style={styles.courseItem}
                onPress={() => onSelect(course)}
              >
                <Text style={styles.courseName}>{course.科目名}</Text>
                <Text style={styles.courseInfo}>
                  教員：{course.教員} 
                </Text>
                <Text style={styles.roomText}>
                  教室：{course.教室 ?? '未設定'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>閉じる</Text>
          </TouchableOpacity>
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
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  courseList: {
    maxHeight: 300,
    marginBottom: 15,
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
  closeButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});