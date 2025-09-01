import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { Exam, Subject } from '../../types';

interface ExamFormProps {
  exam: Partial<Exam>;
  subjects: Subject[];
  examDate: Date;
  showDatePicker: boolean;
  onExamChange: (updatedExam: Partial<Exam>) => void;
  onDateChange: (date: Date) => void;
  onDatePickerVisibilityChange: (visible: boolean) => void;
  isEditing?: boolean;
}

export const ExamForm: React.FC<ExamFormProps> = ({
  exam,
  subjects,
  examDate,
  showDatePicker,
  onExamChange,
  onDateChange,
  onDatePickerVisibilityChange,
  isEditing = false,
}) => {
  return (
    <View style={styles.container}>
      {/* 日付選択 */}
      <View style={styles.dateSection}>
        <Text style={styles.sectionLabel}>試験日</Text>
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => onDatePickerVisibilityChange(true)}
        >
          <Text style={styles.datePickerButtonText}>
            {examDate.toLocaleDateString()}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={examDate}
            mode="date"
            display="default"
            onChange={(_, selectedDate) => {
              onDatePickerVisibilityChange(Platform.OS === 'ios');
              if (selectedDate) {
                onDateChange(selectedDate);
                onExamChange({ ...exam, date: selectedDate.toISOString() });
              }
            }}
          />
        )}
      </View>

      {/* 科目選択 */}
      <View style={styles.subjectSection}>
        <Text style={styles.sectionLabel}>科目を選択</Text>
        <ScrollView style={styles.subjectList}>
          {subjects.map(subject => (
            <TouchableOpacity
              key={subject.id}
              style={[
                styles.subjectItem,
                exam.subjectId === subject.id && styles.selectedSubjectItem
              ]}
              onPress={() => onExamChange({ ...exam, subjectId: subject.id })}
            >
              <Text style={styles.subjectName}>{subject.name}</Text>
              <Text style={styles.subjectInfo}>
                {subject.professor} / {subject.department}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 試験会場 */}
      <View style={styles.inputSection}>
        <Text style={styles.sectionLabel}>試験会場</Text>
        <TextInput
          style={styles.input}
          placeholder="試験会場を入力"
          value={exam.location}
          onChangeText={(text) => onExamChange({ ...exam, location: text })}
        />
      </View>

      {/* メモ */}
      <View style={styles.inputSection}>
        <Text style={styles.sectionLabel}>メモ (オプション)</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          placeholder="メモを入力"
          value={exam.note}
          onChangeText={(text) => onExamChange({ ...exam, note: text })}
          multiline
          numberOfLines={4}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding:10,
  },
  dateSection: {
    marginBottom: 10,
  },
  subjectSection: {
    marginBottom: 10,
  },
  inputSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  datePickerButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  datePickerButtonText: {
    fontSize: 16,
    color: '#333',
  },
  subjectList: {
    maxHeight: 150,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
  },
  subjectItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  selectedSubjectItem: {
    backgroundColor: '#e3f2fd',
  },
  subjectName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  subjectInfo: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  multilineInput: {
    height: 50,
    textAlignVertical: 'top',
  },
});