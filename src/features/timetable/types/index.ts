// CSVファイルから取得する科目データの型
export interface CourseData {
  科目名: string;
  教員: string;
  単位: number;
  履修期: string;
  曜日: string;
  時限: string;
  曜日時限?: string;
  教室?: string;
  備考?: string;
}

// 時間割に登録される科目の型
export interface Subject {
  id: string;
  name: string;         // 科目名
  professor: string;    // 教員
  credits: number;      // 単位数
  term: string;        // 履修期
  color: string;       // 表示色
  notifications: boolean;
  room?: string;       // 教室
  attendance: number;   // 出席数
  absence: number;     // 欠席数
  late: number;        // 遅刻数
  totalClasses: number; // 総授業回数
  nextClassDate?: string;
  note?: string;
}

// 時間割の型（曜日と時限で科目を管理）
export interface Timetable {
  [day: string]: {
    [period: string]: Subject;
  };
}

// 時間割テンプレートの型
export interface TimetableTemplate {
  id: string;
  name: string;
  timetable: Timetable;
  examIds: string[];  // 関連する試験のID配列
}

// 試験の型
export interface Exam {
  id: string;
  templateId: string;   // 関連するテンプレートのID
  subjectId: string;    // 関連する科目のID
  date: string;         // 試験日
  location: string;     // 試験会場
  note?: string;        // メモ（オプション）
}

// 授業時間の型
export interface ClassTime {
  hour: number;
  minute: number;
}

// 授業時間の設定
export interface ClassTimes {
  [key: string]: ClassTime;
}

// 出席警告の型
export interface AttendanceWarning {
  type: 'danger' | 'warning';
  message: string;
}

// テーマの型
export interface Theme {
  id: string;
  name: string;
  backgroundColor: string;
  textColor: string;
  headerColor: string;
  cellBackgroundColor: string;
}

// カレンダーイベントの型
export interface CalendarEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string; };
  end:   { dateTime?: string; date?: string; };
  calendarId: string; // カレンダーのID
  // 他に必要なフィールドがあれば追加
}