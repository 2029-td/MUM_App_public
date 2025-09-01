import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import Papa from 'papaparse';

export interface ClassInfo {
  name: string;
  room: string;
  buildingId: string;
  teacher: string;
}

export const loadClassesData = async (): Promise<ClassInfo[]> => {
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
  const roomIdxs = header.map((h, i) => h === '教室' ? i : -1).filter(i => i >= 0);
  const teacherIdxs = header.map((h, i) => h === '教員' ? i : -1).filter(i => i >= 0);

  const classes: ClassInfo[] = rows.map(row => {
    const name = (row[subjectIdx] ?? '').trim();
    const rooms = roomIdxs.map(i => (row[i] ?? '').trim()).filter(v => v.length > 0);
    const room = rooms.join('、');

    let buildingId = '0';
    if (rooms.length > 0) {
      const r = rooms[0];
      if (r.includes('階段教室')) {
        buildingId = '15';
      } else {
        const m = r.match(/\d+/);
        if (m) {
          const d = m[0];
          buildingId = d.length === 4 ? d.slice(0, 2) : d.length === 3 ? d.slice(0, 1) : '0';
        }
      }
    }

    const teachers = teacherIdxs.map(i => (row[i] ?? '').trim()).filter(v => v.length > 0);
    const teacher = teachers.join('、');

    return { name, room, buildingId, teacher };
  }).filter(c => c.name.length > 0);

  return classes;
};
