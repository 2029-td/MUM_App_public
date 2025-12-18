// src/features/timetable/components/Exam/ExamForm.tsx

import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { Exam, Subject } from '../../types';
import { useAppTheme } from '~/hooks/useAppTheme';
import { compositeOver } from '~/styles/color';

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

const getToday = () => {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
};

export const ExamForm: React.FC<ExamFormProps> = ({
  exam,
  subjects,
  examDate,
  showDatePicker,
  onExamChange,
  onDateChange,
  onDatePickerVisibilityChange,
}) => {
  const { theme, themeId } = useAppTheme();
  const isDark = themeId === 'dark';

  const sectionBg = isDark
    ? compositeOver('rgba(255,255,255,0.08)', theme.backgroundColor)
    : '#f0f0f0';

  const listBg = isDark
    ? compositeOver('rgba(255,255,255,0.06)', theme.backgroundColor)
    : '#ffffff';

  const borderColor = isDark ? 'rgba(255,255,255,0.18)' : '#dddddd';
  const dividerColor = isDark ? 'rgba(255,255,255,0.12)' : '#eeeeee';

  const selectedBg = isDark
    ? compositeOver('rgba(255,255,255,0.16)', theme.backgroundColor)
    : '#e3f2fd';

  const inputBg = isDark
    ? compositeOver('rgba(255,255,255,0.08)', theme.backgroundColor)
    : '#ffffff';

  const placeholder = isDark ? 'rgba(255,255,255,0.45)' : '#999';

  const handleSubjectPress = (subjectId: string) => {
    if (exam.subjectId === subjectId) {
      onExamChange({ ...exam, subjectId: '' });
    } else {
      onExamChange({ ...exam, subjectId });
    }
  };

  return (
    <View style={styles.container}>
      {/* 日付選択 */}
      <View style={styles.dateSection}>
        <Text style={[styles.sectionLabel, { color: theme.textColor }]}>
          試験日
        </Text>

        <TouchableOpacity
          style={[
            styles.datePickerButton,
            { backgroundColor: sectionBg, borderColor },
          ]}
          onPress={() => onDatePickerVisibilityChange(true)}
        >
          <Text style={[styles.datePickerButtonText, { color: theme.textColor }]}>
            {examDate.toLocaleDateString()}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={examDate}
            mode="date"
            display="default"
            minimumDate={getToday()}
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
        <Text style={[styles.sectionLabel, { color: theme.textColor }]}>
          科目
        </Text>

        <ScrollView
          style={[
            styles.subjectList,
            { backgroundColor: listBg, borderColor },
          ]}
        >
          {subjects.map(subject => {
            const selected = exam.subjectId === subject.id;

            return (
              <TouchableOpacity
                key={subject.id}
                style={[
                  styles.subjectItem,
                  {
                    backgroundColor: selected ? selectedBg : listBg,
                    borderBottomColor: dividerColor,
                  },
                ]}
                onPress={() => handleSubjectPress(subject.id)}
              >
                <Text style={[styles.subjectName, { color: theme.textColor }]}>
                  {subject.name}
                </Text>
                <Text
                  style={[
                    styles.subjectInfo,
                    { color: isDark ? 'rgba(255,255,255,0.65)' : '#666' },
                  ]}
                >
                  {subject.professor}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 試験会場 */}
      <View style={styles.inputSection}>
        <Text style={[styles.sectionLabel, { color: theme.textColor }]}>
          試験会場
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: inputBg,
              borderColor,
              color: theme.textColor,
            },
          ]}
          placeholder="試験会場を入力"
          placeholderTextColor={placeholder}
          value={exam.location}
          onChangeText={(text) => onExamChange({ ...exam, location: text })}
        />
      </View>

      {/* メモ */}
      <View style={styles.inputSection}>
        <Text style={[styles.sectionLabel, { color: theme.textColor }]}>
          メモ
        </Text>
        <TextInput
          style={[
            styles.input,
            styles.multilineInput,
            {
              backgroundColor: inputBg,
              borderColor,
              color: theme.textColor,
            },
          ]}
          placeholder="メモを入力"
          placeholderTextColor={placeholder}
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
    padding: 10,
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
  },
  datePickerButton: {
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    borderWidth: 1,
  },
  datePickerButtonText: {
    fontSize: 16,
  },
  subjectList: {
    maxHeight: 150,
    borderWidth: 1,
    borderRadius: 5,
  },
  subjectItem: {
    padding: 12,
    borderBottomWidth: 1,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  subjectInfo: {
    fontSize: 12,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 12,
    fontSize: 16,
  },
  multilineInput: {
    height: 50,
    textAlignVertical: 'top',
  },
});
