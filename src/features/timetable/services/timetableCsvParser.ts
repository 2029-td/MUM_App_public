import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import Papa from 'papaparse';
import type { CourseData, Term } from '../types';

// 表記ゆれを正規化して Term 型で返す
const normalizeTerm = (raw?: string): Term => {
  if (!raw) return '';
  const s = raw.trim();
  if (s.includes('年間')) return '通年';
  if (s.includes('夏季集中')) return '前期';
  if (s.includes('春季集中') || s.includes('後期集中')) return '後期';
  if (s.includes('前期')) return '前期';
  if (s.includes('後期')) return '後期';
  return '';
};

export const loadTimetableFromCSV = async (): Promise<CourseData[]> => {
  const asset = Asset.fromModule(require('../../../assets/data/timetable.csv'));
  await asset.downloadAsync();

  const csv = await FileSystem.readAsStringAsync(asset.localUri!, { encoding: 'utf8' });

  const raw = Papa.parse<string[]>(csv, { header: false, skipEmptyLines: true }).data as string[][];
  if (raw.length < 2) return [];

  const header = raw[0].map(cell => cell.trim());
  const rows = raw.slice(1);

  const findIdx = (name: string) => header.findIndex(h => h === name);

  const termIdx   = findIdx('履修期名') > -1 ? findIdx('履修期名') : findIdx('履修期');
  const subjectIdx = findIdx('科目名');
  const dayIdx     = findIdx('曜日');
  const noteIdx    = findIdx('特記事項');
  const creditIdx  = findIdx('単位');
  const gradeIdx   = findIdx('学年');          // ★ 学年列の index

  const periodIndexes = [1, 2, 3, 4, 5, 6].map(p => findIdx(p.toString()));
  const teacherIndexes = header.map((h, i) => (h === '教員' ? i : -1)).filter(i => i >= 0);
  const roomIndexes    = header.map((h, i) => (h === '教室' ? i : -1)).filter(i => i >= 0);

  const courses: CourseData[] = [];

  for (const row of rows) {
    const day = row[dayIdx]?.trim();
    const subject = row[subjectIdx]?.trim();
    if (!subject || !day) continue;

    const teachers = teacherIndexes
      .map(i => (row[i] ?? '').trim())
      .filter(Boolean)
      .join('、');

    const rooms = roomIndexes
      .map(i => (row[i] ?? '').trim())
      .filter(Boolean)
      .join('、');

    const termNorm: Term = normalizeTerm(row[termIdx]?.trim());
    const note = row[noteIdx]?.trim() || '';

    // ★ 学年（"1", "1年" みたいな表記を想定）
    let grade = 1;
    if (gradeIdx >= 0) {
      const rawGrade = (row[gradeIdx] ?? '').toString().trim();
      const m = rawGrade.match(/\d+/); // 先頭の数字だけ取る
      if (m) {
        const n = Number(m[0]);
        if (Number.isFinite(n)) grade = n;
      }
    }

    const periods: string[] = [];
    periodIndexes.forEach((idx, i) => {
      const mark = (idx >= 0 ? row[idx] : '')?.trim();
      if (mark === '○') periods.push(String(i + 1));
    });
    if (periods.length === 0) continue;

    let credit = 0;
    if (creditIdx >= 0) {
      const v = (row[creditIdx] ?? '').toString().trim();
      const n = Number(v);
      credit = Number.isFinite(n) ? n : 0;
    }

    courses.push({
      学年: grade,               // ★ ここでセット
      科目名: subject,
      教員: teachers,
      教室: rooms,
      曜日: day,
      時限: periods.join(','),   // 例: "3,4"
      履修期: termNorm,
      単位: credit,
      備考: note,
    });
  }

  return courses;
};
