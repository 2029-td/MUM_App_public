import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import Papa from 'papaparse';
import type { CourseData } from '../types';

export const loadTimetableFromCSV = async (): Promise<CourseData[]> => {
  const asset = Asset.fromModule(require('assets/data/timetable.csv'));
  await asset.downloadAsync();

  const csv = await FileSystem.readAsStringAsync(asset.localUri!, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const raw = Papa.parse<string[]>(csv, {
    header: false,
    skipEmptyLines: true,
  }).data as string[][];

  if (raw.length < 2) return [];

  const header = raw[0].map(cell => cell.trim());
  const rows = raw.slice(1);

  const subjectIdx = header.findIndex(h => h === '科目名');
  const dayIdx = header.findIndex(h => h === '曜日');
  const termIdx = header.findIndex(h => h === '履修期');
  const noteIdx = header.findIndex(h => h === '特記事項');

  const periodIndexes = [1, 2, 3, 4, 5, 6].map(p =>
    header.findIndex(h => h === p.toString())
  );

  const teacherIndexes = header.map((h, i) => h === '教員' ? i : -1).filter(i => i >= 0);
  const roomIndexes = header.map((h, i) => h === '教室' ? i : -1).filter(i => i >= 0);

  const courses: CourseData[] = [];

  for (const row of rows) {
    const day = row[dayIdx]?.trim();
    const subject = row[subjectIdx]?.trim();
    if (!subject || !day) continue;

    const teachers = teacherIndexes.map(i => (row[i] ?? '').trim()).filter(Boolean).join('、');
    const rooms = roomIndexes.map(i => (row[i] ?? '').trim()).filter(Boolean).join('、');
    const term = row[termIdx]?.trim() || '';
    const note = row[noteIdx]?.trim() || '';

    const periods: string[] = [];

    periodIndexes.forEach((idx, i) => {
      const mark = row[idx]?.trim();
      if (mark === '○') {
        periods.push((i + 1).toString());
      }
    });

    if (periods.length === 0) continue;

    courses.push({
      科目名: subject,
      教員: teachers,
      教室: rooms,
      曜日: day,
      時限: periods.join(','), // 例: "3,4"
      履修期: term,
      単位: 0,
      備考: note,
    });
  }

  return courses;
};
