// src/features/timetable/hooks/useTemplates.ts

import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { storageService } from '../services/storage';
import type { TimetableTemplate, Subject, Timetable } from '../types';
import { colorPalette } from '../constants';

export const useTemplates = () => {
  const [templates, setTemplates] = useState<TimetableTemplate[]>([]);
  const [currentTemplateId, setCurrentTemplateId] = useState<string>(''); // ★ default固定を廃止
  const [isLoading, setIsLoading] = useState(true);

  // 初期データの読み込み
  useEffect(() => {
    void loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * 初期データ読み込み
   * - templates が 0 件なら、空のテンプレを 1 件だけ作る（idは採番）
   * - currentTemplateId は、
   *    1) 保存済み currentTemplateId が templates 内に存在すればそれ
   *    2) それ以外は先頭テンプレ
   */
  const loadInitialData = async () => {
    try {
      const storedTemplates = await storageService.getTemplates();
      const storedCurrentId = await storageService.getCurrentTemplateId();

      // 1) テンプレが既にある場合
      if (storedTemplates.length > 0) {
        setTemplates(storedTemplates);

        const exists = storedCurrentId
          ? storedTemplates.some((t) => t.id === storedCurrentId)
          : false;

        const resolvedId = exists
          ? storedCurrentId
          : storedTemplates[0]?.id || '';

        setCurrentTemplateId(resolvedId);

        // キャッシュ（CURRENT_TEMPLATE）も整合させておく（任意だが安全）
        if (resolvedId && resolvedId !== storedCurrentId) {
          await storageService.saveCurrentTemplateId(resolvedId);
        }

        return;
      }

      // 2) 0件なら「空テンプレ」を1件作る
      const firstTemplate: TimetableTemplate = {
        id: Date.now().toString(),
        name: '時間割',
        timetable: {},
        examIds: [],
        year: new Date().getFullYear(),
      };

      setTemplates([firstTemplate]);
      await storageService.saveTemplates([firstTemplate]);

      setCurrentTemplateId(firstTemplate.id);
      await storageService.saveCurrentTemplateId(firstTemplate.id);
    } catch (error) {
      console.error('Error loading template data:', error);
      Alert.alert('エラー', 'テンプレートの読み込みに失敗しました');

      // エラー時は空にしておく（screen側の初期化ロジックで救済できる）
      setTemplates([]);
      setCurrentTemplateId('');
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
    if (!templates.length) return undefined;
    return templates.find((t) => t.id === currentTemplateId) || templates[0];
  }, [templates, currentTemplateId]);

  /**
   * 新しいテンプレートの追加（timetable を任意で渡せるようにする）
   * - ここでは currentTemplateId の自動切替はしない（呼び出し側が決める）
   */
  const addTemplate = async (
    name: string,
    timetable: Timetable = {},
    year: number = new Date().getFullYear()
  ) => {
    try {
      const newTemplate: TimetableTemplate = {
        id: Date.now().toString(),
        name: name.trim() || '時間割',
        timetable,
        examIds: [],
        year,
      };

      const updated = [...templates, newTemplate];
      await updateTemplates(updated);
      return newTemplate.id;
    } catch (error) {
      console.error('Error adding template:', error);
      Alert.alert('エラー', 'テンプレートの追加に失敗しました');
      return null;
    }
  };

  /**
   * テンプレートの削除
   * - “defaultテンプレ” の概念は廃止
   * - 最後の1件だけは削除できない（年度/学期の割当先が必ず必要なため）
   */
  const deleteTemplate = async (id: string) => {
    try {
      if (templates.length <= 1) {
        Alert.alert('エラー', '最後のテンプレートは削除できません');
        return;
      }

      const updatedTemplates = templates.filter((t) => t.id !== id);
      await updateTemplates(updatedTemplates);

      // current を消した場合は先頭に切替
      if (currentTemplateId === id) {
        const nextId = updatedTemplates[0]?.id || '';
        setCurrentTemplateId(nextId);
        await storageService.saveCurrentTemplateId(nextId);
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      Alert.alert('エラー', 'テンプレートの削除に失敗しました');
    }
  };

  /**
   * 科目の追加/更新
   * - period が "3,4" のような形式でも更新できるように分割して登録
   * - color が無ければ palette からランダムで付与
   */
  const updateSubject = async (
    templateId: string,
    day: string,
    period: string,
    subject: Subject
  ) => {
    try {
      const periods = period.split(',').map((p) => p.trim()).filter(Boolean); // 複数時限に対応

      const updatedTemplates = templates.map((template) => {
        if (template.id !== templateId) return template;

        const existingTimetable = template.timetable || {};
        const daySchedule = { ...(existingTimetable[day] ?? {}) };

        // 各時限に subject を登録
        periods.forEach((p) => {
          daySchedule[p] = {
            ...subject,
            color:
              subject.color ||
              colorPalette[Math.floor(Math.random() * colorPalette.length)],
          };
        });

        const updatedTimetable = {
          ...existingTimetable,
          [day]: daySchedule,
        };

        return { ...template, timetable: updatedTimetable };
      });

      await updateTemplates(updatedTemplates);
      // 必要ならここで再読み込みしてもOK（現状は呼び出し側でやっているので省略）
    } catch (error) {
      console.error('Error updating subject:', error);
      Alert.alert('エラー', '科目の更新に失敗しました');
    }
  };

  /**
   * 複数時限の一括更新
   * - 連続コマなどを periodList でまとめて登録
   */
  const updateSubjectMulti = async (
    templateId: string,
    day: string,
    periodList: string[],
    subject: Subject
  ) => {
    try {
      const updatedTemplates = templates.map((template) => {
        if (template.id !== templateId) return template;

        const existingTimetable = template.timetable || {};
        const daySchedule = existingTimetable[day] || {};

        const updatedDaySchedule = { ...daySchedule };
        periodList.forEach((period) => {
          const p = String(period).trim();
          if (!p) return;

          updatedDaySchedule[p] = {
            ...subject,
            id: subject.id || `${day}-${p}-${subject.name}`,
            color:
              subject.color ||
              colorPalette[Math.floor(Math.random() * colorPalette.length)],
          };
        });

        const updatedTimetable = {
          ...existingTimetable,
          [day]: updatedDaySchedule,
        };

        return { ...template, timetable: updatedTimetable };
      });

      await updateTemplates(updatedTemplates);
    } catch (error) {
      console.error('Error in updateSubjectMulti:', error);
      Alert.alert('エラー', '複数時限の更新に失敗しました');
    }
  };

  // 科目の削除
  const deleteSubject = async (templateId: string, day: string, period: string) => {
    try {
      const updatedTemplates = templates.map((template) => {
        if (template.id !== templateId) return template;

        const updatedTimetable = { ...(template.timetable || {}) };
        if (updatedTimetable[day]) {
          const updatedDay = { ...updatedTimetable[day] };
          delete updatedDay[period];
          updatedTimetable[day] = updatedDay;
        }
        return { ...template, timetable: updatedTimetable };
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
    setCurrentTemplateId, // screen側で期間切替時に使う
    setTemplates: updateTemplates,
    addTemplate,
    deleteTemplate,
    updateSubject,
    updateSubjectMulti,
    deleteSubject,
  };
};
