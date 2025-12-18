// src/features/timetable/components/Exam/ExamList.tsx

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import type { Exam, Subject, Theme } from '../../types';
import { useAppTheme } from '~/hooks/useAppTheme';
import { compositeOver, solidSurfaceFromTheme } from '~/styles/color';

interface ExamListProps {
  exams: Exam[];
  subjects: Subject[];
  theme: Theme;
  onExamPress: (exam: Exam) => void;
  onAddPress: () => void;

  // screen.tsx から渡せる（渡さない場合はHookで補完）
  themeId?: string;
}

export const ExamList: React.FC<ExamListProps> = ({
  exams,
  subjects,
  theme,
  onExamPress,
  onAddPress,
  themeId,
}) => {
  // propsが無ければHookから取得（どっちでも動く）
  const appTheme = useAppTheme();
  const resolvedThemeId = themeId ?? appTheme.themeId;
  const isDark = resolvedThemeId === 'dark';

  const getSubjectName = (subjectId: string): string => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.name || '科目が見つかりません';
  };

  const sortedExams = React.useMemo(() => {
    return [...exams].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [exams]);

  const surfaceSolid = solidSurfaceFromTheme(
    theme.cellBackgroundColor ?? theme.backgroundColor,
    theme.backgroundColor
  );

  const modalSurface = isDark
    ? compositeOver('rgba(255,255,255,0.05)', surfaceSolid)
    : compositeOver('rgba(255,255,255,0.55)', surfaceSolid);

  // ✅ カード背景はこれを使う
  const itemBg = modalSurface;

  const itemBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)';
  const subText = isDark ? 'rgba(255,255,255,0.70)' : '#666';
  const faintText = isDark ? 'rgba(255,255,255,0.55)' : '#888';
  const dateColor = isDark ? 'rgba(120,170,255,1)' : '#1976D2';

  return (
    <View style={[styles.container, { backgroundColor: surfaceSolid }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textColor }]}>試験日程</Text>

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.headerColor }]}
          onPress={onAddPress}
        >
          <Text style={[styles.addButtonText, { color: theme.textColor }]}>追加</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.examList}>
        {sortedExams.map(exam => (
          <TouchableOpacity
            key={exam.id}
            style={[
              styles.examItem,
              {
                backgroundColor: itemBg,
                borderColor: itemBorder,
                shadowOpacity: isDark ? 0 : 0.25,
                elevation: isDark ? 0 : 2,
              },
            ]}
            onPress={() => onExamPress(exam)}
          >
            <View style={styles.examItemLeft}>
              <Text style={[styles.examDate, { color: dateColor }]}>
                {new Date(exam.date).toLocaleDateString()}
              </Text>

              <Text style={[styles.examSubject, { color: theme.textColor }]}>
                {getSubjectName(exam.subjectId)}
              </Text>
            </View>

            <View style={styles.examItemRight}>
              <Text style={[styles.examLocation, { color: subText }]}>{exam.location}</Text>

              {exam.note && (
                <Text style={[styles.examNote, { color: faintText }]} numberOfLines={1}>
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
    fontWeight: 'bold' 
  },
  addButton: { 
    paddingVertical: 8, 
    paddingHorizontal: 15, 
    borderRadius: 5 
  },
  addButtonText: { 
    fontWeight: 'bold' 
  },
  examList: { 
    maxHeight: 300 
  },
  examItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  examItemLeft: { 
    flex: 1, 
    marginRight: 10 
  },
  examItemRight: {
    flex: 1, 
    alignItems: 'flex-end' 
  },
  examDate: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    marginBottom: 5 
  },
  examSubject: { 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  examLocation: { 
    fontSize: 14 
  },
  examNote: { 
    fontSize: 12, 
    fontStyle: 'italic', 
    marginTop: 5 
  },
  noExamsText: { 
    textAlign: 'center', 
    marginTop: 20, 
    fontSize: 16 
  },
});
