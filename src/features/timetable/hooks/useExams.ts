import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { storageService } from '../services/storage';
import { notificationService } from '../services/notifications';
import type { Exam, Subject } from '../types';

interface UseExamsProps {
  currentTemplateId: string;
  getCurrentTemplate: () => {
    id: string;
    timetable: {
      [day: string]: {
        [period: string]: Subject;
      };
    };
  } | undefined;
}

export const useExams = ({ currentTemplateId, getCurrentTemplate }: UseExamsProps) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 試験データの読み込み
  const loadExams = async () => {
    try {
      setIsLoading(true);
      const storedExams = await storageService.getExams();
      // 現在のテンプレートに関連する試験のみをフィルタリング
      const filteredExams = storedExams.filter(exam => exam.templateId === currentTemplateId);
      setExams(filteredExams);
    } catch (error) {
      console.error('Error loading exams:', error);
      Alert.alert('エラー', '試験データの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // テンプレートIDが変更されたら試験データを再読み込み
  useEffect(() => {
    loadExams();
  }, [currentTemplateId]);

  // 試験の追加
  const addExam = async (examData: Omit<Exam, 'id' | 'templateId'>) => {
    try {
      const newExam: Exam = {
        ...examData,
        id: Date.now().toString(),
        templateId: currentTemplateId,
      };

      // 通知の設定
      const examDate = new Date(newExam.date);
      const currentTemplate = getCurrentTemplate();
      if (currentTemplate) {
        const subject = Object.values(currentTemplate.timetable)
          .flatMap(day => Object.values(day))
          .find(subject => subject.id === newExam.subjectId);

        if (subject) {
          await notificationService.scheduleExamNotification(
            `${subject.name}の試験が明日です`,
            `場所: ${newExam.location}\n${newExam.note || ''}`,
            examDate
          );
        }
      }

      const storedExams = await storageService.getExams();
      const updatedExams = [...storedExams, newExam];
      await storageService.saveExams(updatedExams);
      await loadExams(); // 試験データを再読み込み
      return newExam;
    } catch (error) {
      console.error('Error adding exam:', error);
      Alert.alert('エラー', '試験の追加に失敗しました');
      throw error;
    }
  };

  // 試験の更新
  const updateExam = async (updatedExam: Exam) => {
    try {
      const storedExams = await storageService.getExams();
      const updatedExams = storedExams.map(exam =>
        exam.id === updatedExam.id ? updatedExam : exam
      );
      await storageService.saveExams(updatedExams);
      await loadExams(); // 試験データを再読み込み

      // 通知の更新
      const examDate = new Date(updatedExam.date);
      const currentTemplate = getCurrentTemplate();
      if (currentTemplate) {
        const subject = Object.values(currentTemplate.timetable)
          .flatMap(day => Object.values(day))
          .find(subject => subject.id === updatedExam.subjectId);

        if (subject) {
          await notificationService.scheduleExamNotification(
            `${subject.name}の試験が明日です`,
            `場所: ${updatedExam.location}\n${updatedExam.note || ''}`,
            examDate
          );
        }
      }
    } catch (error) {
      console.error('Error updating exam:', error);
      Alert.alert('エラー', '試験の更新に失敗しました');
      throw error;
    }
  };

  // 試験の削除
  const deleteExam = async (id: string) => {
    try {
      const storedExams = await storageService.getExams();
      const updatedExams = storedExams.filter(exam => exam.id !== id);
      await storageService.saveExams(updatedExams);
      await loadExams(); // 試験データを再読み込み
    } catch (error) {
      console.error('Error deleting exam:', error);
      Alert.alert('エラー', '試験の削除に失敗しました');
      throw error;
    }
  };

  // 全登録科目の取得
  const getAllRegisteredSubjects = useCallback(() => {
    const currentTemplate = getCurrentTemplate();
    if (!currentTemplate) return [];

    const subjects = new Map<string, Subject>();
    Object.values(currentTemplate.timetable).forEach(daySchedule => {
      Object.values(daySchedule).forEach(subject => {
        subjects.set(subject.id, subject);
      });
    });
    return Array.from(subjects.values());
  }, [getCurrentTemplate]);

  return {
    exams,
    isLoading,
    loadExams,
    addExam,
    updateExam,
    deleteExam,
    getAllRegisteredSubjects,
  };
};