export const STORAGE_KEYS = {
    TEMPLATES: '@timetable_templates',
    CURRENT_TEMPLATE: '@current_template',
    ATTENDANCE_DATA: '@attendance_data',
    EXAMS: '@exams_data',
    THEME: '@theme_id',
  } as const;
  
  export const daysOfWeek = ['月', '火', '水', '木', '金', '土'] as const;
  export const periods = [1, 2, 3, 4, 5, 6] as const;
  
  export const colorPalette = [
    'rgba(255, 179, 186, 0.9)', // 薄いピンク
    'rgba(186, 255, 201, 0.9)', // 薄い緑
    'rgba(186, 225, 255, 0.9)', // 薄い青
    'rgba(255, 255, 186, 0.9)', // 薄い黄色
    'rgba(255, 223, 186, 0.9)', // 薄いオレンジ
  ] as const;
  
  export const predefinedThemes = [
    {
      id: 'default',
      name: 'デフォルト',
      backgroundColor: '#4c669f',
      textColor: '#FFFFFF',
      headerColor: 'rgba(0, 0, 0, 0.2)',
      cellBackgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    {
      id: 'dark',
      name: 'ダーク',
      backgroundColor: '#2c3e50',
      textColor: '#FFFFFF',
      headerColor: 'rgba(0, 0, 0, 0.3)',
      cellBackgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    {
      id: 'light',
      name: 'ライト',
      backgroundColor: '#f5f6fa',
      textColor: '#2c3e50',
      headerColor: 'rgba(0, 0, 0, 0.05)',
      cellBackgroundColor: 'rgba(255, 255, 255, 0.8)',
    },
  ] as const;
  
  export const classTimesStart = {
    '1': { hour: 9, minute: 0 },
    '2': { hour: 10, minute: 40 },
    '3': { hour: 13, minute: 20 },
    '4': { hour: 15, minute: 0 },
    '5': { hour: 16, minute: 40 },
    '6': { hour: 18, minute: 20 },
  } as const;

export const CalendarColors = {
  holiday: '#f44336',           // 休講日：赤
  japaneseHoliday: '#4caf50',   // 日本の祝日：緑
  classHoliday: '#2196f3',      // 休日授業実施日：青
  term: '#ffeb3b',              // 学期開始/終了：黄
  default: '#ff9800',           // その他：オレンジ
};