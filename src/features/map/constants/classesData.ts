import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import Papa from 'papaparse';

export interface ClassInfo {
  name: string;        // 授業名
  room: string;        // 教室（複数可を「、」連結）
  buildingId: string;  // 建物ID（room の最初の番号から）
  teacher: string;     // 教員名（複数可を「、」連結）
}

export const loadClassesData = async (): Promise<ClassInfo[]> => {
  // bundled CSV を取得
  const asset = Asset.fromModule(
    require('assets/data/timetable.csv')
  );
  await asset.downloadAsync();

  // ファイル読み込み
  const csv = await FileSystem.readAsStringAsync(asset.localUri!, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  // ヘッダなしでパースすることで列数・重複ヘッダを気にしない
  const raw = Papa.parse<string[]>(csv, {
    header: false,
    skipEmptyLines: true,
  }).data as string[][];

  if (raw.length < 2) return [];

  // 1行目をヘッダ行、残りをデータ行
  const header = raw[0].map(cell => cell.trim());
  const rows   = raw.slice(1);

  // ヘッダ中で「科目名」と一致するインデックスを拾う
  const subjectIdx = header.findIndex(h => h === '科目名');
  // ヘッダ中で「教室」と完全一致する列のインデックスを拾う
  const roomIdxs = header.map((h,i) => (h === '教室' ? i : -1)).filter(i => i >= 0);
  // ヘッダ中で「教員」と完全一致する列のインデックスを拾う
  const teacherIdxs = header.map((h, i) => h === '教員' ? i : -1).filter(i => i >= 0);

  const classes: ClassInfo[] = rows
    .map(row => {
      // 授業名
      const name = (row[subjectIdx] ?? '').trim();

      // 複数「教室」列から空でないものを集めて「、」連結
      const rooms = roomIdxs.map(i => (row[i] ?? '').trim()).filter(v => v.length > 0);
      const room = rooms.join('、');

      // buildingId は最初の教室番号から
      let buildingId = '0'; // ← 初期値を '0' にしておく（fallback）
      
      if (rooms.length > 0) {
        const roomName = rooms[0];
        
        if (roomName.includes('階段教室')) {
          buildingId = '15';
        } else {
          const m = roomName.match(/\d+/);
          if (m) {
            const d = m[0];
            buildingId =
            d.length === 4 ? d.slice(0,2)
            : d.length === 3 ? d.slice(0,1)
            : '0';
          }
        }
      }

      // 複数「教員」列から空でないものを集めて「、」連結
      const teachers = teacherIdxs.map(i => (row[i] ?? '').trim()).filter(v => v.length > 0);
      const teacher = teachers.join('、');

      return { name, room, buildingId, teacher };
    })
    // 授業名が空行は除外
    .filter(c => c.name.length > 0);

  return classes;
};
