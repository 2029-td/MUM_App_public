import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants';
import type { TimetableTemplate, Exam, Theme, Subject } from '../types';

export const storageService = {
  async getTemplates(): Promise<TimetableTemplate[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.TEMPLATES);
      if (!data) return [];
      const templates = JSON.parse(data);
      return templates.map((template: TimetableTemplate) => ({
        ...template,
        examIds: template.examIds || [],
      }));
    } catch (error) {
      console.error('Error getting templates:', error);
      return [];
    }
  },

  async saveTemplates(templates: TimetableTemplate[]): Promise<void> {
    try {
      const data = JSON.stringify(templates);
      await AsyncStorage.setItem(STORAGE_KEYS.TEMPLATES, data);
    } catch (error) {
      console.error('Error saving templates:', error);
      throw error;
    }
  },

  async getCurrentTemplateId(): Promise<string> {
    try {
      const id = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_TEMPLATE);
      return id || 'default';
    } catch (error) {
      console.error('Error getting current template ID:', error);
      return 'default';
    }
  },

  async saveCurrentTemplateId(id: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_TEMPLATE, id);
    } catch (error) {
      console.error('Error saving current template ID:', error);
      throw error;
    }
  },

  async getExams(): Promise<Exam[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.EXAMS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting exams:', error);
      return [];
    }
  },

  async saveExams(exams: Exam[]): Promise<void> {
    try {
      const data = JSON.stringify(exams);
      await AsyncStorage.setItem(STORAGE_KEYS.EXAMS, data);
    } catch (error) {
      console.error('Error saving exams:', error);
      throw error;
    }
  },

  async exportTemplateData(templateId: string) {
    try {
      // テンプレートの取得
      const templates = await this.getTemplates();
      const template = templates.find(t => t.id === templateId);
      if (!template) {
        throw new Error('テンプレートが見つかりません');
      }

      // 関連する試験の取得
      const exams = await this.getExams();
      const templateExams = exams.filter(exam => exam.templateId === templateId);

      return {
        template,
        exams: templateExams,
        version: '1.0',
        exportDate: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error exporting template data:', error);
      throw error;
    }
  },

  async importTemplateData(data: any) {
    try {
      // データの検証
      if (!data || !data.template || !Array.isArray(data.exams)) {
        throw new Error('無効なデータ形式です');
      }

     // 既存のデータを取得
     const existingTemplates = await this.getTemplates();
     const existingExams = await this.getExams();

     // 新しいIDを生成
     const timestamp = Date.now().toString();
     const newTemplateId = `template_${timestamp}`;


           // テンプレートの更新（IDの更新含む）
           const updatedTemplate = {
            ...data.template,
            id: newTemplateId,
            name: `${data.template.name} (コピー)`,
            timetable: Object.fromEntries(
              Object.entries(data.template.timetable).map(([day, periods]) => [
                day,
                Object.fromEntries(
                  Object.entries(periods as { [key: string]: Subject }).map(([period, subject]) => [
                    period,
                    {
                      ...subject,
                      id: `subject_${subject.id}_${timestamp}`,
                    }
                  ])
                )
              ])
            ),
          };
    
          // 試験データの更新（IDの更新含む）
          const updatedExams = data.exams.map((exam: any) => ({
            ...exam,
            id: `exam_${exam.id}_${timestamp}`,
            templateId: newTemplateId,
            subjectId: `subject_${exam.subjectId}_${timestamp}`,
          }));
    
          // データを保存（順序を守って実行）
          await this.saveTemplates([...existingTemplates, updatedTemplate]);
          await this.saveExams([...existingExams, ...updatedExams]);
          await this.saveCurrentTemplateId(newTemplateId);
    
          return {
            templateId: newTemplateId,
            template: updatedTemplate,
            exams: updatedExams,
          };
        } catch (error) {
          console.error('Error importing template data:', error);
          throw error;
        }
      },

  async getThemeId(): Promise<string> {
    try {
      const themeId = await AsyncStorage.getItem(STORAGE_KEYS.THEME);
      return themeId || 'default';
    } catch (error) {
      console.error('Error getting theme ID:', error);
      return 'default';
    }
  },

  async saveThemeId(themeId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.THEME, themeId);
    } catch (error) {
      console.error('Error saving theme ID:', error);
      throw error;
    }
  },
};