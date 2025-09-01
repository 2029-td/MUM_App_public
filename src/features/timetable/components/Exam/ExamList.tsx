import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import type { Exam, Subject, Theme } from '../../types';

interface ExamListProps {
  exams: Exam[];
  subjects: Subject[];
  theme: Theme;
  onExamPress: (exam: Exam) => void;
  onAddPress: () => void;
}

export const ExamList: React.FC<ExamListProps> = ({
  exams,
  subjects,
  theme,
  onExamPress,
  onAddPress,
}) => {
  // 科目名を取得
  const getSubjectName = (subjectId: string): string => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.name || '科目が見つかりません';
  };

  // 日付でソート
  const sortedExams = React.useMemo(() => {
    return [...exams].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [exams]);

  return (
    <View style={[
      styles.container,
      { backgroundColor: theme.cellBackgroundColor }
    ]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textColor }]}>
          試験日程
        </Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={onAddPress}
        >
          <Text style={styles.addButtonText}>追加</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.examList}>
        {sortedExams.map(exam => (
          <TouchableOpacity
            key={exam.id}
            style={styles.examItem}
            onPress={() => onExamPress(exam)}
          >
            <View style={styles.examItemLeft}>
              <Text style={styles.examDate}>
                {new Date(exam.date).toLocaleDateString()}
              </Text>
              <Text style={styles.examSubject}>
                {getSubjectName(exam.subjectId)}
              </Text>
            </View>
            <View style={styles.examItemRight}>
              <Text style={styles.examLocation}>{exam.location}</Text>
              {exam.note && (
                <Text style={styles.examNote} numberOfLines={1}>
                  {exam.note}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
        {sortedExams.length === 0 && (
          <Text style={[styles.noExamsText, { color: theme.textColor }]}>
            登録された試験はありません
          </Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 10,
    marginVertical: 20,
    borderRadius: 10,
    padding: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  examList: {
    maxHeight: 300,
  },
  examItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  examItemLeft: {
    flex: 1,
    marginRight: 10,
  },
  examItemRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  examDate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 5,
  },
  examSubject: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  examLocation: {
    fontSize: 14,
    color: '#666666',
  },
  examNote: {
    fontSize: 12,
    color: '#888888',
    fontStyle: 'italic',
    marginTop: 5,
  },
  noExamsText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
});