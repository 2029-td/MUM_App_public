import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { storageService } from '../services/storage';
import type { TimetableTemplate, Subject, Timetable } from '../types';
import { colorPalette } from '../constants';

export const useTemplates = () => {
  const [templates, setTemplates] = useState<TimetableTemplate[]>([]);
  const [currentTemplateId, setCurrentTemplateId] = useState<string>('default');
  const [isLoading, setIsLoading] = useState(true);

  // 初期データの読み込み
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const storedTemplates = await storageService.getTemplates();
      const storedCurrentId = await storageService.getCurrentTemplateId();

      if (storedTemplates.length > 0) {
        setTemplates(storedTemplates);
      } else {
        // デフォルトテンプレートの作成
        const defaultTemplate: TimetableTemplate = {
          id: 'default',
          name: 'デフォルト時間割',
          timetable: {},
          examIds: [], // 追加
        };
        setTemplates([defaultTemplate]);
        await storageService.saveTemplates([defaultTemplate]);
      }

      setCurrentTemplateId(storedCurrentId || 'default');
    } catch (error) {
      console.error('Error loading template data:', error);
      Alert.alert('エラー', 'テンプレートの読み込みに失敗しました');
      
      // エラー時はデフォルトテンプレートを設定
      const defaultTemplate: TimetableTemplate = {
        id: 'default',
        name: 'デフォルト時間割',
        timetable: {},
        examIds: [], // 追加
      };
      setTemplates([defaultTemplate]);
      setCurrentTemplateId('default');
    } finally {
      setIsLoading(false);
    }
  };

  // テンプレートの更新とストレージへの保存
  const updateTemplates = async (newTemplates: TimetableTemplate[]) => {
    try {
      await storageService.saveTemplates(newTemplates);
      setTemplates(newTemplates);
    } catch (error) {
      console.error('Error updating templates:', error);
      Alert.alert('エラー', 'テンプレートの更新に失敗しました');
    }
  };

  // 現在のテンプレートを取得
  const getCurrentTemplate = useCallback(() => {
    return templates.find(t => t.id === currentTemplateId) || templates[0];
  }, [templates, currentTemplateId]);

  // 新しいテンプレートの追加（timetable を任意で渡せるようにする）
const addTemplate = async (name: string, timetable: Timetable = {}) => {
  try {
    const newTemplate: TimetableTemplate = {
      id: Date.now().toString(),
      name: name.trim(),
      timetable, // ここで渡す
      examIds: [], // 追加
    };
    const updatedTemplates = [...templates, newTemplate];
    await updateTemplates(updatedTemplates);
  } catch (error) {
    console.error('Error adding template:', error);
    Alert.alert('エラー', 'テンプレートの追加に失敗しました');
  }
};

  // テンプレートの削除
  const deleteTemplate = async (id: string) => {
    try {
      if (id === 'default') {
        Alert.alert('エラー', 'デフォルトテンプレートは削除できません');
        return;
      }

      const updatedTemplates = templates.filter(t => t.id !== id);
      await updateTemplates(updatedTemplates);

      if (currentTemplateId === id) {
        setCurrentTemplateId('default');
        await storageService.saveCurrentTemplateId('default');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      Alert.alert('エラー', 'テンプレートの削除に失敗しました');
    }
  };

  // 科目の追加/更新
  const updateSubject = async (
    templateId: string,
    day: string,
    period: string,
    subject: Subject
  ) => {
    try {
      const periods = period.split(',').map(p => p.trim()); // 複数時限に対応
      const updatedTemplates = templates.map(template => {
        if (template.id !== templateId) return template;
        const existingTimetable = template.timetable || {};
        const daySchedule = { ...(existingTimetable[day] ?? {}) };

        // 各時限に subject を登録
        periods.forEach(p => {
          daySchedule[p] = {
            ...subject,
            color: subject.color || colorPalette[Math.floor(Math.random() * colorPalette.length)],
          };
        });
  
        const updatedTimetable = {
          ...existingTimetable,
          [day]: daySchedule,
        };
  
        const updatedTemplate = { ...template, timetable: updatedTimetable };
        return updatedTemplate;
      });
  
      await updateTemplates(updatedTemplates);
      const savedTemplates = await storageService.getTemplates();
    } catch (error) {
      console.error('Error updating subject:', error);
      Alert.alert('エラー', '科目の更新に失敗しました');
    }
  };

  // useTemplates.ts 内で下記を追加
  const updateSubjectMulti = async (
    templateId: string,
    day: string,
    periodList: string[],
    subject: Subject
  ) => {
    try {
      const updatedTemplates = templates.map(template => {
        if (template.id !== templateId) return template;

        const existingTimetable = template.timetable || {};
        const daySchedule = existingTimetable[day] || {};

        const updatedDaySchedule = { ...daySchedule };
        periodList.forEach(period => {
          updatedDaySchedule[period] = {
            ...subject,
            id: `${day}-${period}-${subject.name}`,
            color: subject.color || colorPalette[Math.floor(Math.random() * colorPalette.length)],
          };
        });

        const updatedTimetable = {
          ...existingTimetable,
          [day]: updatedDaySchedule,
        };

        return {
          ...template,
          timetable: updatedTimetable,
        };
      });

      await updateTemplates(updatedTemplates);
      const savedTemplates = await storageService.getTemplates();
    } catch (error) {
      console.error('Error in updateSubjectMulti:', error);
      Alert.alert('エラー', '複数時限の更新に失敗しました');
    }
  };

  // 科目の削除
  const deleteSubject = async (templateId: string, day: string, period: string) => {
    try {
      const updatedTemplates = templates.map(template => {
        if (template.id === templateId) {
          const updatedTimetable = { ...template.timetable };
          if (updatedTimetable[day]) {
            const updatedDay = { ...updatedTimetable[day] };
            delete updatedDay[period];
            updatedTimetable[day] = updatedDay;
          }
          return { ...template, timetable: updatedTimetable };
        }
        return template;
      });
  
      await updateTemplates(updatedTemplates);
    } catch (error) {
      console.error('Error deleting subject:', error);
      Alert.alert('エラー', '科目の削除に失敗しました');
    }
  };  

  return {
    templates,
    currentTemplateId,
    isLoading,
    getCurrentTemplate,
    setCurrentTemplateId,
    setTemplates: updateTemplates,
    addTemplate,
    deleteTemplate,
    updateSubject,
    updateSubjectMulti,
    deleteSubject,
  };
};