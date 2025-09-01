// src/features/timetable/hooks/useTimetableFromCSV.ts
import { useEffect, useState } from 'react';
import { loadTimetableFromCSV } from '../services/timetableCsvParser';
import type { CourseData } from '../types';

export function useTimetableFromCSV(csvPath: string) {
  const [timetable, setTimetable] = useState<CourseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    loadTimetableFromCSV()
      .then((data) => {
        if (mounted) {
          setTimetable(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err);
          setLoading(false);
        }
      });
      
    return () => {
      mounted = false;
    };
  }, [csvPath]);

  return { timetable, loading, error };
}
