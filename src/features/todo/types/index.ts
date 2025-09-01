export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  category: string;
  dueDate: Date | null;
  recurring?: boolean;
  createdAt?: Date;
  generatedDates?: string[];
  platform?: 'classroom' | 'canvas' | 'moodle'; // ← 追加
}
