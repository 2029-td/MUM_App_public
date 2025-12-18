// src/features/timetable/screen.tsx
//
// - 年度/学期ごとにテンプレIDを紐づけて保存（TEMPLATE_BY_PERIOD）
// - 年度/学期切替モーダルから switchPeriod を呼び、表示テンプレを切替
// - 共有（export/import）後もテンプレ一覧と currentTemplateId を整合させる
// - テーマは useAppTheme から受け取った theme を利用（light/dark の2本）

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Alert, ActivityIndicator, StyleSheet, useWindowDimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';

// カスタムフック
import { useTemplates } from './hooks/useTemplates';
import { useExams } from './hooks/useExams';
import { useCourseSearch } from './hooks/useCourseSearch';
import { useAppTheme } from '~/hooks/useAppTheme';

import { TimetableGrid } from './components/Timetable/TimetableGrid';
import { AttendanceModal } from './components/Timetable/AttendanceModal';
import { CourseSelectionModal } from './components/Timetable/CourseSelectionModal';
import { YearTermModal } from './components/Timetable/TemplateModal';
import { ExamList, ExamModal } from './components/Exam';
import { ClassRegistrationModal } from './components/Timetable/ClassRegistrationModal';
import SearchCourseBox from './components/Timetable/SearchCourseBox';
import { TemplateShareModal } from './components/Timetable/TemplateShareModal';
import { TimetableSettingsModal } from './components/Timetable/TimetableSettingsModal';
import CalendarView from './components/Calendar/CalendarView';

// サービス
import { storageService } from './services/storage';
import { notificationService } from './services/notifications';
import { loadTimetableFromCSV } from './services/timetableCsvParser';

import { colorPalette } from './constants';
import type { CourseData, Subject, Exam, ActiveTerm } from './types';

// 期間キー（storage.ts と同じ構成に合わせる）
const buildPeriodKey = (year: number, term: ActiveTerm) => `${year}_${term}`;

export default function Page() {
  const { height: windowHeight } = useWindowDimensions();
  const [headerH, setHeaderH] = useState(0);
  const [searchH, setSearchH] = useState(0);

  // 既に時間割に入っている同名・同教員の授業色を使い回す（見た目の一貫性）
  const findExistingColor = (
    timetable: any,
    day: string,
    name?: string,
    professor?: string
  ): string | undefined => {
    const rows = timetable?.[day] || {};
    for (const p of Object.keys(rows)) {
      const s = rows[p];
      if (!s) continue;
      if (s.name === name && (s.professor || '') === (professor || '') && s.color) {
        return s.color;
      }
    }
    return undefined;
  };

  // 決定論的カラー（seed を colorPalette に写像）
  const pickColorBySeed = (seed: string): string => {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
    const idx = Math.abs(h) % colorPalette.length;
    return colorPalette[idx];
  };

  // テンプレ管理（default固定を廃止した useTemplates を想定）
  const {
    templates,
    currentTemplateId,
    isLoading: isTemplateLoading,
    getCurrentTemplate,
    setCurrentTemplateId,
    addTemplate,
    updateSubject,
    updateSubjectMulti,
    setTemplates,
  } = useTemplates();

  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const { exams, addExam, updateExam, deleteExam, getAllRegisteredSubjects, loadExams } =
    useExams({
      currentTemplateId,
      getCurrentTemplate,
    });

  // === 学期（前期/後期のみ） ===
  const [activeYear, setActiveYear] = useState<number>(new Date().getFullYear());
  const [activeTerm, setActiveTerm] = useState<ActiveTerm>('前期');
  const [activeGrade, setActiveGrade] = useState<number>(1);
  const [isYearTermModalVisible, setIsYearTermModalVisible] = useState(false);
  const [isShareModalVisible, setIsShareModalVisible] = useState<boolean>(false);

  // まとめボタン → モーダル表示
  const [isOptionsModalVisible, setIsOptionsModalVisible] = useState<boolean>(false);

  // 土曜日表示のON/OFF（デフォルトは表示）
  const [showSaturday, setShowSaturday] = useState<boolean>(true);

  // === 状態 ===
  const [courseData, setCourseData] = useState<CourseData[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<number>(0);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(true);

  const [examDate, setExamDate] = useState<Date>(new Date());
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  const [isAttendanceModalVisible, setIsAttendanceModalVisible] = useState<boolean>(false);
  const [isCourseModalVisible, setIsCourseModalVisible] = useState<boolean>(false);
  const [isExamModalVisible, setIsExamModalVisible] = useState<boolean>(false);

  const [isClassRegModalVisible, setIsClassRegModalVisible] = useState(false);
  const [pendingSubject, setPendingSubject] = useState<Subject | null>(null);
  const [pendingDay, setPendingDay] = useState<string>('');
  const [pendingPeriods, setPendingPeriods] = useState<string[]>([]);

  // =========================
  // 初期化
  // =========================
  useEffect(() => {
    void initializeApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * 初期化：
   * 1) 通知権限
   * 2) templates を確保（0件なら1件作る）
   * 3) 学期/学年/土曜を復元
   * 4) 年度/学期 -> templateId を解決（無ければ current or 先頭を割当）
   * 5) currentTemplateId を反映
   * 6) CSV読み込み
   */
  const initializeApp = async () => {
    try {
      setIsDataLoading(true);

      // 通知権限（失敗しても落とさない）
      try {
        await notificationService.requestPermissions();
      } catch (e) {
        console.warn('notification permission failed:', e);
      }

      // 1) テンプレ一覧確保（0件なら1件作る）
      let localTemplates = await storageService.getTemplates();
      if (!localTemplates || localTemplates.length === 0) {
        await addTemplate('時間割', {});
        localTemplates = await storageService.getTemplates();
      }
      await setTemplates(localTemplates);

      // 2) 学期/学年/土曜を復元
      const savedTerm = await storageService.getActiveTerm();
      setActiveTerm(savedTerm);

      const savedGrade = await storageService.getActiveGrade();
      setActiveGrade(savedGrade);

      const savedShowSaturday = await storageService.getShowSaturday();
      if (typeof savedShowSaturday === 'boolean') setShowSaturday(savedShowSaturday);

      // 3) period→templateId を解決
      let templateId = await storageService.getTemplateIdForPeriod(activeYear, savedTerm);

      // 4) 無ければ「直近current or 先頭」を割り当てて periodMap に保存
      if (!templateId) {
        const cached = await storageService.getCurrentTemplateId();
        templateId = cached || localTemplates[0]?.id || '';
        if (templateId) {
          await storageService.saveTemplateIdForPeriod(activeYear, savedTerm, templateId);
        }
      }

      // 5) current に反映（ついでにキャッシュも更新）
      if (templateId) {
        await setCurrentTemplateId(templateId);
        await storageService.saveCurrentTemplateId(templateId);
      }

      // 6) CSV
      const classes = await loadTimetableFromCSV();
      setCourseData(classes);

      // 試験も整合させたい場合はここで再ロード（templateIdが確定している前提）
      try {
        await loadExams();
      } catch (e) {
        console.warn('loadExams failed:', e);
      }
    } catch (e) {
      console.error('initializeApp error:', e);
      Alert.alert('エラー', 'アプリの初期化中にエラーが発生しました');
    } finally {
      setIsDataLoading(false);
    }
  };

  // =========================
  // 年度/学期切替
  // =========================
  const switchPeriod = useCallback(
    async (year: number, term: ActiveTerm) => {
      // まず state を変えて UI 上の表示を合わせる
      setActiveYear(year);
      setActiveTerm(term);

      // 1) 対応表から templateId を探す
      let templateId = await storageService.getTemplateIdForPeriod(year, term);

      // 2) なければ「この期間用のテンプレート」を新規作成
      if (!templateId) {
        const name = `${year}年度${term}時間割`;
        await addTemplate(name, {}, year);

        const updatedTemplates = await storageService.getTemplates();
        await setTemplates(updatedTemplates);

        // いま追加したテンプレートの id（末尾の要素と仮定）
        templateId = updatedTemplates[updatedTemplates.length - 1]?.id;

        // 対応表に保存
        if (templateId) {
          await storageService.saveTemplateIdForPeriod(year, term, templateId);
        }
      } else {
        // 対応表にある場合 → templates を最新化（import等の整合性も担保）
        const updatedTemplates = await storageService.getTemplates();
        await setTemplates(updatedTemplates);
      }

      if (!templateId) return;

      // 現在のテンプレートを切り替え
      await setCurrentTemplateId(templateId);
      await storageService.saveCurrentTemplateId(templateId);

      // 試験も templateId 依存なので読み直す（UIのズレ防止）
      try {
        await loadExams();
      } catch (e) {
        console.warn('loadExams failed after switchPeriod:', e);
      }
    },
    [activeYear, addTemplate, loadExams, setCurrentTemplateId, setTemplates]
  );

  // =========================
  // 学期・学年・土曜表示フィルタ
  // =========================
  const coursesByActiveTerm = useMemo(() => {
    return courseData.filter((c) => {
      // 土曜非表示なら、候補も土曜日を除外
      if (!showSaturday && c.曜日 === '土') return false;

      // 学期フィルタ
      const termOk =
        activeTerm === '前期'
          ? c.履修期 === '前期' || c.履修期 === '通年'
          : c.履修期 === '後期' || c.履修期 === '通年';

      if (!termOk) return false;

      // 学年フィルタ（選択した学年以下のみ）
      const grade = Number(c.学年) || 1;
      return grade <= activeGrade;
    });
  }, [courseData, activeTerm, activeGrade, showSaturday]);

  // 検索（学期で絞って渡す）
  const { query, setQuery, results } = useCourseSearch(coursesByActiveTerm);

  const courseCandidatesForModal = useMemo(() => {
    return coursesByActiveTerm.filter(
      (course) =>
        course.曜日 === selectedDay &&
        course.時限.split(',').map((s) => s.trim()).includes(String(selectedPeriod))
    );
  }, [coursesByActiveTerm, selectedDay, selectedPeriod]);

  // === 時間割も学期でフィルタリング ===
  const filteredTimetable = useMemo(() => {
    const timetable = getCurrentTemplate()?.timetable || {};
    const filtered: any = {};

    for (const day of Object.keys(timetable)) {
      filtered[day] = {};
      for (const period of Object.keys(timetable[day])) {
        const subject = timetable[day][period];
        if (!subject) continue;

        const term = subject.term || '';

        if (activeTerm === '前期') {
          if (term.includes('前期') || term.includes('通年') || term.includes('年間')) {
            filtered[day][period] = subject;
          }
        } else {
          if (term.includes('後期') || term.includes('通年') || term.includes('年間')) {
            filtered[day][period] = subject;
          }
        }
      }
    }
    return filtered;
  }, [getCurrentTemplate, activeTerm]);

  // 土曜表示ON/OFFで表示する曜日を切り替え
  const daysOfWeekOverride = useMemo<readonly string[] | undefined>(() => {
    return showSaturday ? undefined : ['月', '火', '水', '木', '金'];
  }, [showSaturday]);

  // 時間割が占めるべき高さ（画面の残り）を計算
  const timetableHeight = useMemo(() => {
    const TOP_PADDING = 10;
    const HEADER_MB = 10;
    const FINE_TUNE = 8;
    const h =
      windowHeight -
      insets.top -
      tabBarHeight -
      TOP_PADDING -
      headerH -
      HEADER_MB -
      searchH -
      FINE_TUNE;
    return h;
  }, [windowHeight, insets.top, tabBarHeight, headerH, searchH]);

  // =========================
  // 出席更新（合算上限チェック付き）
  // =========================
  const handleAttendanceUpdate = useCallback(
    async (type: 'attendance' | 'absence' | 'late') => {
      const template = getCurrentTemplate();
      if (!template) return;

      const day = selectedDay;
      const period = String(selectedPeriod);

      // 最新を読み直す
      const templatesFromStorage = await storageService.getTemplates();
      const fresh = templatesFromStorage.find((t) => t.id === template.id);
      const current: Subject | undefined = fresh?.timetable?.[day]?.[period];
      if (!current) return;

      const cap = current.totalClasses && current.totalClasses > 0 ? current.totalClasses : 15;
      const total = (current.attendance ?? 0) + (current.absence ?? 0) + (current.late ?? 0);
      if (total >= cap) return;

      const next: Subject = { ...current, [type]: (current[type] ?? 0) + 1 };

      await updateSubject(template.id, day, period, next);
      const updatedTemplates = await storageService.getTemplates();
      await setTemplates(updatedTemplates);
      setSelectedSubject(next);
    },
    [getCurrentTemplate, selectedDay, selectedPeriod, updateSubject, setTemplates]
  );

  // =========================
  // Import後の再ロード（重要）
  // =========================
  const reloadAfterImport = useCallback(async () => {
    const updated = await storageService.getTemplates();
    await setTemplates(updated);

    // importTemplateData() は saveCurrentTemplateId(newTemplateId) をする想定
    const cached = await storageService.getCurrentTemplateId();
    if (cached) {
      await setCurrentTemplateId(cached);
      try {
        await loadExams();
      } catch (e) {
        console.warn('loadExams failed after import:', e);
      }
    }
  }, [setTemplates, setCurrentTemplateId, loadExams]);

  // =========================
  // Render
  // =========================
  return isTemplateLoading || isDataLoading ? (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#4CAF50" />
      <Text style={styles.loadingText}>読み込み中...</Text>
    </View>
  ) : (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.backgroundColor }]}
      edges={['top', 'left', 'right']}
    >
      <LinearGradient
        colors={[theme.backgroundColor, theme.backgroundColor]}
        style={styles.gradientBackground}
      >
        <ScrollView
          contentInsetAdjustmentBehavior="never"
          style={styles.scrollView}
          contentContainerStyle={{
            paddingTop: 10,
            paddingHorizontal: 10,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* ヘッダー部分 */}
          <View style={styles.header} onLayout={(e) => setHeaderH(e.nativeEvent.layout.height)}>
            <Text style={[styles.title, { color: theme.textColor }]}>時間割表</Text>

            <View style={styles.headerButtons}>
              {/* 共有ボタン */}
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setIsShareModalVisible(true)}
                accessibilityRole="button"
                accessibilityLabel="共有"
              >
                <Ionicons name="share-outline" size={24} color={theme.textColor} />
              </TouchableOpacity>

              {/* 設定ボタン */}
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setIsOptionsModalVisible(true)}
                accessibilityRole="button"
                accessibilityLabel="オプション"
              >
                <Ionicons name="settings-outline" size={24} color={theme.textColor} />
              </TouchableOpacity>
            </View>
          </View>

          {/* 検索バー */}
          <View onLayout={(e) => setSearchH(e.nativeEvent.layout.height)}>
            <SearchCourseBox
              value={query}
              onChange={setQuery}
              results={results}
              onSelect={(course: CourseData) => {
                const periods = course.時限.split(',').map((p) => p.trim());

                const timetable = getCurrentTemplate()?.timetable || {};
                const seed = `${course.履修期}|${course.曜日}|${course.科目名}|${periods.join('-')}`;
                const decidedColor =
                  findExistingColor(timetable, course.曜日, course.科目名, course.教員) ??
                  pickColorBySeed(seed);

                const subject: Subject = {
                  id: `${course.曜日}-${periods[0]}-${course.科目名}`,
                  campus: course.設置校舎,
                  name: course.科目名,
                  professor: course.教員,
                  credits: course.単位,
                  term: course.履修期,
                  color: decidedColor,
                  notifications: true,
                  room: course.教室 ?? '',
                  attendance: 0,
                  absence: 0,
                  late: 0,
                  totalClasses: 0,
                  note: course.備考 ?? '',
                };

                setPendingSubject(subject);
                setPendingDay(course.曜日);
                setPendingPeriods(periods);
                setIsClassRegModalVisible(true);
                setQuery('');
              }}
            />
          </View>

          {/* 時間割グリッド */}
          <View style={[styles.timetableFill, { height: timetableHeight > 0 ? timetableHeight : undefined }]}>
            <TimetableGrid
              timetable={filteredTimetable}
              theme={theme}
              daysOfWeekOverride={daysOfWeekOverride}
              onCellPress={(day, period) => {
                setSelectedDay(day);
                setSelectedPeriod(period);
                const subject = getCurrentTemplate()?.timetable?.[day]?.[period] ?? null;
                if (subject) {
                  setSelectedSubject(subject);
                  setIsAttendanceModalVisible(true);
                } else {
                  setIsCourseModalVisible(true);
                }
              }}
            />
          </View>

          <View style={styles.examSection}>
            <ExamList
              exams={exams}
              subjects={getAllRegisteredSubjects()}
              theme={theme}
              onExamPress={(exam) => {
                setSelectedExam(exam);
                setExamDate(new Date(exam.date));
                setIsExamModalVisible(true);
              }}
              onAddPress={() => {
                setSelectedExam(null);
                setExamDate(new Date());
                setIsExamModalVisible(true);
              }}
            />
          </View>

          <View style={styles.calendarSection}>
            <Text style={[styles.calendarTitle, { color: theme.textColor }]}>今後の予定</Text>
            <CalendarView theme={theme} />
          </View>
        </ScrollView>

        <CourseSelectionModal
          visible={isCourseModalVisible}
          onClose={() => setIsCourseModalVisible(false)}
          selectedDay={selectedDay}
          selectedPeriod={selectedPeriod}
          courses={courseCandidatesForModal}
          theme={theme}
          onSelect={(course: CourseData) => {
            const periods = course.時限.split(',').map((p) => p.trim());

            const timetable = getCurrentTemplate()?.timetable || {};
            const seed = `${course.履修期}|${course.曜日}|${course.科目名}|${periods.join('-')}`;
            const decidedColor =
              findExistingColor(timetable, course.曜日, course.科目名, course.教員) ?? pickColorBySeed(seed);

            const subject: Subject = {
              id: `${selectedDay}-${periods[0]}-${course.科目名}`,
              campus: course.設置校舎,
              name: course.科目名,
              professor: course.教員,
              credits: course.単位,
              term: course.履修期,
              color: decidedColor,
              notifications: true,
              room: course.教室 ?? '',
              attendance: 0,
              absence: 0,
              late: 0,
              totalClasses: 0,
              note: course.備考 ?? '',
            };

            setPendingSubject(subject);
            setPendingDay(selectedDay);
            setPendingPeriods(periods);
            setIsCourseModalVisible(false);
            setIsClassRegModalVisible(true);
          }}
        />

        {/* まとめモーダル */}
        <TimetableSettingsModal
          visible={isOptionsModalVisible}
          onClose={() => setIsOptionsModalVisible(false)}
          theme={theme}
          showSaturday={showSaturday}
          onToggleShowSaturday={async (next) => {
            setShowSaturday(next);
            await storageService.saveShowSaturday(next);
          }}
          onPressYearTerm={() => {
            setIsOptionsModalVisible(false);
            setIsYearTermModalVisible(true);
          }}
        />

        {/* 出席モーダル */}
        <AttendanceModal
          visible={isAttendanceModalVisible}
          subject={selectedSubject}
          onClose={() => setIsAttendanceModalVisible(false)}
          onUpdate={handleAttendanceUpdate}
          onDelete={async () => {
            const template = getCurrentTemplate();
            const templateId = template?.id;
            if (!templateId) return;

            const templatesFromStorage = await storageService.getTemplates();
            const idx = templatesFromStorage.findIndex((t) => t.id === templateId);
            if (idx < 0) return;

            const day = selectedDay;
            const period = String(selectedPeriod);

            const tt = { ...(templatesFromStorage[idx].timetable || {}) };
            tt[day] = { ...(tt[day] || {}) };

            const target = tt[day]?.[period];
            if (!target) return;

            const keysToDelete = new Set<string>([period]);

            if (target.linkGroupId) {
              for (const d of Object.keys(tt)) {
                for (const p of Object.keys(tt[d] || {})) {
                  if (tt[d][p]?.linkGroupId === target.linkGroupId) keysToDelete.add(p);
                }
              }
            } else if (Array.isArray(target.linkedPeriods) && target.linkedPeriods.length) {
              for (const p of target.linkedPeriods) keysToDelete.add(String(p));
            } else {
              const same = Object.keys(tt[day] || {}).filter((p) => {
                if (p === period) return true;
                const s = tt[day][p];
                return s?.name === target.name && (s?.professor || '') === (target.professor || '');
              });
              same.forEach((p) => keysToDelete.add(p));
            }

            for (const k of keysToDelete) {
              if (tt[day]?.[k]) delete tt[day][k];
            }
            if (tt[day] && Object.keys(tt[day]).length === 0) delete tt[day];

            templatesFromStorage[idx] = { ...templatesFromStorage[idx], timetable: tt };
            await storageService.saveTemplates(templatesFromStorage);

            const refreshed = await storageService.getTemplates();
            await setTemplates(refreshed);

            setSelectedSubject(null);
            setIsAttendanceModalVisible(false);
          }}
          onSubjectUpdate={async (updated) => {
            const templateId = getCurrentTemplate()?.id;
            if (!templateId) return;
            const day = selectedDay;
            const period = String(selectedPeriod);

            await updateSubject(templateId, day, period, updated);
            const updatedTemplates = await storageService.getTemplates();
            await setTemplates(updatedTemplates);
            setSelectedSubject(updated);
          }}
        />

        {/* 試験モーダル */}
        <ExamModal
          visible={isExamModalVisible}
          exam={selectedExam}
          examDate={examDate}
          showDatePicker={showDatePicker}
          subjects={getAllRegisteredSubjects()}
          onClose={() => setIsExamModalVisible(false)}
          onSave={async (examData) => {
            if (examData.id) await updateExam(examData as Exam);
            else await addExam(examData);
            setSelectedExam(null);
            setIsExamModalVisible(false);
          }}
          onDelete={async (id) => {
            await deleteExam(id);
            setIsExamModalVisible(false);
          }}
          onDateChange={(date) => setExamDate(date)}
          onDatePickerVisibilityChange={(visible) => setShowDatePicker(visible)}
        />

        {/* 年度/学期モーダル */}
        <YearTermModal
          visible={isYearTermModalVisible}
          activeYear={activeYear}
          activeTerm={activeTerm}
          activeGrade={activeGrade}
          onChangeYear={(year) => setActiveYear(year)}
          onChangeTerm={(term) => setActiveTerm(term)}
          onChangeGrade={(grade) => {
            setActiveGrade(grade);
            storageService.saveActiveGrade(grade);
          }}
          onClose={async () => {
            // ✕ を押したタイミングでだけテンプレ切り替え
            await switchPeriod(activeYear, activeTerm);
            setIsYearTermModalVisible(false);
          }}
        />

        {/* 共有モーダル */}
        <TemplateShareModal
          visible={isShareModalVisible}
          onClose={() => setIsShareModalVisible(false)}
          templateId={currentTemplateId}
          templateName={getCurrentTemplate()?.name ?? ''}
          onImportSuccess={async () => {
            // import後は templates + currentTemplateId を必ず整合させる
            await reloadAfterImport();
          }}
        />

        {/* 授業登録確認モーダル */}
        <ClassRegistrationModal
          visible={isClassRegModalVisible}
          subject={pendingSubject}
          selectedDay={selectedDay}
          selectedPeriod={selectedPeriod}
          onClose={() => setIsClassRegModalVisible(false)}
          onConfirm={async (color) => {
            const templateId = getCurrentTemplate()?.id;
            if (!templateId || !pendingSubject) return;

            const subject: Subject = { ...pendingSubject, color };

            await updateSubjectMulti(templateId, pendingDay, pendingPeriods, subject);
            const updatedTemplates = await storageService.getTemplates();
            await setTemplates(updatedTemplates);

            setIsClassRegModalVisible(false);
          }}
        />
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ==== 画面全体レイアウト ====
  container: {
    flex: 1,
  },

  // ==== ローディング画面関連 ====
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },

  // ==== スクロール / 背景 ====
  scrollView: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },

  // ==== ヘッダー（タイトル + 共有 / 設定ボタン） ====
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 34,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  timetableFill: {
    minHeight: 0,
  },

  // ==== 試験一覧セクション ====
  examSection: {
    marginTop: 20,
    marginBottom: 20,
  },

  // ==== Google カレンダー「今後の予定」セクション ====
  calendarSection: {
    marginVertical: 20,
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  calendarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
});
