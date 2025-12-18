// src/features/timetable/constants/index.ts
//
// - テーマ定義は useAppTheme.tsx 側に寄せる（light/dark の2本）
// - このファイルは timetable 機能の定数のみを持つ

export const STORAGE_KEYS = {
  TEMPLATES: '@timetable_templates',
  CURRENT_TEMPLATE: '@current_template',
  ATTENDANCE_DATA: '@attendance_data',
  EXAMS: '@exams_data',

  // 保存するのは "system" | "light" | "dark"
  THEME: '@theme_id',

  ACTIVE_TERM: 'ACTIVE_TERM',
  ACTIVE_GRADE: 'ACTIVE_GRADE',
  TEMPLATE_BY_PERIOD: 'TEMPLATE_BY_PERIOD',
  SHOW_SATURDAY: 'SHOW_SATURDAY',
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

export const classTimesStart = {
  '1': { hour: 9, minute: 0 },
  '2': { hour: 10, minute: 40 },
  '3': { hour: 13, minute: 20 },
  '4': { hour: 15, minute: 0 },
  '5': { hour: 16, minute: 40 },
  '6': { hour: 18, minute: 20 },
} as const;
