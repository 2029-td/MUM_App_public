import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants';
import type { TimetableTemplate, Exam, Theme, Subject, ActiveTerm } from '../types';

const buildPeriodKey = (year: number, term: ActiveTerm) => `${year}_${term}`;

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

  async getTemplateIdForPeriod(year: number, term: ActiveTerm): Promise<string | null> {
    try {
      const mapStr = await AsyncStorage.getItem(STORAGE_KEYS.TEMPLATE_BY_PERIOD);
      if (!mapStr) return null;
      const map = JSON.parse(mapStr) as Record<string, string>;
      const key = buildPeriodKey(year, term);
      return map[key] ?? null;
    } catch (e) {
      console.error('Error getTemplateIdForPeriod:', e);
      return null;
    }
  },

  async saveTemplateIdForPeriod(
    year: number,
    term: ActiveTerm,
    templateId: string
  ): Promise<void> {
    try {
      const mapStr = await AsyncStorage.getItem(STORAGE_KEYS.TEMPLATE_BY_PERIOD);
      const map: Record<string, string> = mapStr ? JSON.parse(mapStr) : {};
      const key = buildPeriodKey(year, term);
      map[key] = templateId;
      await AsyncStorage.setItem(STORAGE_KEYS.TEMPLATE_BY_PERIOD, JSON.stringify(map));
    } catch (e) {
      console.error('Error saveTemplateIdForPeriod:', e);
      throw e;
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
      const templates = await this.getTemplates();
      const template = templates.find(t => t.id === templateId);
      if (!template) throw new Error('テンプレートが見つかりません');

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
      if (!data || !data.template || !Array.isArray(data.exams)) {
        throw new Error('無効なデータ形式です');
      }

      const existingTemplates = await this.getTemplates();
      const existingExams = await this.getExams();

      const timestamp = Date.now().toString();
      const newTemplateId = `template_${timestamp}`;

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
                { ...subject, id: `subject_${subject.id}_${timestamp}` }
              ])
            )
          ])
        ),
      };

      const updatedExams = data.exams.map((exam: any) => ({
        ...exam,
        id: `exam_${exam.id}_${timestamp}`,
        templateId: newTemplateId,
        subjectId: `subject_${exam.subjectId}_${timestamp}`,
      }));

      await this.saveTemplates([...existingTemplates, updatedTemplate]);
      await this.saveExams([...existingExams, ...updatedExams]);
      await this.saveCurrentTemplateId(newTemplateId);

      return { templateId: newTemplateId, template: updatedTemplate, exams: updatedExams };
    } catch (error) {
      console.error('Error importing template data:', error);
      throw error;
    }
  },

  // === 学期（前期/後期のみ） ===
  async getActiveTerm(): Promise<ActiveTerm> {
    try {
      const v = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_TERM);
      // 旧データで '通年' が入っていても前期に丸める
      if (v === '後期') return '後期';
      return '前期';
    } catch (e) {
      console.error('Error getActiveTerm:', e);
      return '前期';
    }
  },

  // storageService.ts
  async getActiveGrade(): Promise<number> {
    try {
      const v = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_GRADE);
      return v ? Number(v) : 1;
    } catch (e) {
      console.error('Error getActiveGrade:', e);
      return 1;
    }
  },

  async saveActiveGrade(grade: number): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_GRADE, String(grade));
    } catch (e) {
      console.error('Error saveActiveGrade:', e);
      throw e;
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
