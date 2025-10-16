// src/features/timetable/hooks/useCourseSearch.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import type { CourseData } from '../types';

type Options = {
  /** true: 曜日/時限で絞る（モーダル等）/ false: 無視（通常検索） */
  applySlotFilter?: boolean;
  /** マッチ対象を授業名のみに限定（教員ではヒットさせない） */
  nameOnly?: boolean;
  /** サジェストは必ず検索文字があるときだけ表示（無入力時は出さない） */
  requireQuery?: boolean;
  /** 戻り値上限 */
  limit?: number;
};

export const useCourseSearch = (
  allCourses: CourseData[],
  selectedDay: string,
  selectedPeriod: number,
  options: Options = {}
) => {
  const {
    applySlotFilter = false,
    nameOnly = true,
    requireQuery = true,
    limit = 200,
  } = options;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CourseData[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const norm = (s?: string) => (s ?? '').toLowerCase().normalize('NFKC').trim();

  const runSearch = useCallback(() => {
    const q = norm(query);

    // 無入力なら必ず空（＝サジェストを出さない）
    if (requireQuery && !q) {
      setResults([]);
      return;
    }

    if (!Array.isArray(allCourses) || allCourses.length === 0) {
      setResults([]);
      return;
    }

    const matchKeyword = (c: CourseData) => {
      const nameHit = norm(c.科目名).includes(q);
      if (nameOnly) return nameHit;
      // nameOnly=false の場合は教員も対象に
      return nameHit || norm(c.教員).includes(q);
    };

    const matchDay = (c: CourseData) =>
      applySlotFilter && selectedDay ? c.曜日 === selectedDay : true;

    const matchPeriod = (c: CourseData) => {
      if (!applySlotFilter || !selectedPeriod) return true;
      const tokens = (c.時限 ?? '')
        .replace(/限/g, '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      return tokens.includes(String(selectedPeriod));
    };

    const out = allCourses
      .filter(c => matchKeyword(c) && matchDay(c) && matchPeriod(c))
      .slice(0, limit);

    setResults(out);
  }, [query, allCourses, selectedDay, selectedPeriod, applySlotFilter, nameOnly, requireQuery, limit]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(runSearch, 150);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query, allCourses, selectedDay, selectedPeriod, runSearch]);

  return { query, setQuery, results };
};
