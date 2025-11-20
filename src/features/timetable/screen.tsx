// src/features/timetable/screen.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import useGoogleAuth from '~/hooks/useGoogleAuth';
import { Chip } from 'react-native-paper';
// カレンダー月表示用
import CalendarView from './components/Calendar/CalendarView';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Alert, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// カスタムフック
import { useTemplates } from './hooks/useTemplates';
import { useTheme } from './hooks/useTheme';
import { useExams } from './hooks/useExams';
import { usePullToRefreshCalendar } from './hooks/usePullToRefreshCalendar';
import { useCalendarEvents } from './hooks/useCalendarEvents';
import { useCourseSearch } from './hooks/useCourseSearch';
import { useAppTheme } from '~/hooks/useAppTheme';
import { useStyles } from '~/styles';

import { TimetableGrid } from './components/Timetable/TimetableGrid';
import { AttendanceModal } from './components/Timetable/AttendanceModal';
import { CourseSelectionModal } from './components/Timetable/CourseSelectionModal';
import { YearTermModal } from './components/Timetable/TemplateModal';
import { ExamList, ExamModal } from './components/Exam';
import SearchCourseBox from './components/Timetable/SearchCourseBox';
import { colorPalette } from './constants'; 

// サービス
import { storageService } from './services/storage';
import { notificationService } from './services/notifications';
import { loadTimetableFromCSV } from './services/timetableCsvParser';

import { TemplateShareModal } from './components/Timetable/TemplateShareModal';

import type { CourseData, Subject, Exam, ActiveTerm } from './types';

export default function Page() {
  // 既存 timetable から、同じ“連結っぽい”授業で使っている色があれば再利用
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

  // カスタムフックの初期化
  const {
    templates,
    currentTemplateId,
    isLoading: isTemplateLoading,
    getCurrentTemplate,
    setCurrentTemplateId,
    addTemplate,
    deleteTemplate,
    updateSubject,
    updateSubjectMulti,
    deleteSubject,
    setTemplates,
  } = useTemplates();

  const { currentThemeId, getCurrentTheme, updateTheme } = useTheme();
  const currentTheme = getCurrentTheme();
  const { theme } = useAppTheme();
  const { colors } = useStyles();
  const {
    exams,
    addExam,
    updateExam,
    deleteExam,
    getAllRegisteredSubjects,
  } = useExams({ currentTemplateId, getCurrentTemplate });

  const { accessToken } = useGoogleAuth();
  const { events, loading: calLoading, error: calError, refetch } = useCalendarEvents();
  const { refreshing, onRefresh } = usePullToRefreshCalendar(refetch);

  useEffect(() => { if (accessToken) refetch(); }, [accessToken]);

  // === 学期（前期/後期のみ） ===
  const [activeYear, setActiveYear] = useState<number>(new Date().getFullYear());
  const [activeTerm, setActiveTerm] = useState<ActiveTerm>('前期');
  const [activeGrade, setActiveGrade] = useState<number>(1);
  const [isYearTermModalVisible, setIsYearTermModalVisible] = useState(false);
  const [isShareModalVisible, setIsShareModalVisible] = useState<boolean>(false);

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

  // 初期化
  useEffect(() => { initializeApp(); }, []);

  const initializeApp = async () => {
    try {
      setIsDataLoading(true);
      await notificationService.requestPermissions();

      const existingTemplates = await storageService.getTemplates();
      if (!existingTemplates || existingTemplates.length === 0) {
        const emptyTimetable = {};
        await addTemplate('デフォルト時間割', emptyTimetable);
        const updatedTemplates = await storageService.getTemplates();
        await setTemplates(updatedTemplates);
        const firstId = updatedTemplates[0]?.id;
        if (firstId) {
          await setCurrentTemplateId(firstId);
          await storageService.saveCurrentTemplateId(firstId);
        }
      } else {
        await setTemplates(existingTemplates);
        const currentId = await storageService.getCurrentTemplateId();
        await setCurrentTemplateId(currentId);
      }

      // 学期の復元（前期/後期のみ）
      const savedTerm = await storageService.getActiveTerm();
      setActiveTerm(savedTerm);

      // ★ ここで「今の年度＋学期」→ currentTemplateId を紐づけておく
      const currentId = await storageService.getCurrentTemplateId();
      await storageService.saveTemplateIdForPeriod(
        activeYear,        // useState の初期値（今年）をそのまま使う
        savedTerm,
        currentId,
      );

      // CSVから候補を読み込み
      const classes = await loadTimetableFromCSV();
      setCourseData(classes);
    } catch (error) {
      console.error('Error initializing app:', error);
      Alert.alert('エラー', 'アプリの初期化中にエラーが発生しました');
    } finally {
      setIsDataLoading(false);
    }
  };

  // initializeApp の下あたりに追加

const switchPeriod = useCallback(
  async (year: number, term: ActiveTerm) => {
    // まず state を変えて UI 上の表示を合わせる
    setActiveYear(year);
    setActiveTerm(term);
    await storageService.saveActiveTerm(term);

    // 1) 対応表から templateId を探す
    let templateId = await storageService.getTemplateIdForPeriod(year, term);

    // 2) なければ「この期間用のテンプレート」を新規作成
    if (!templateId) {
      // 空テンプレートを追加（既存の addTemplate を流用）
      const name = `${year}年度${term}時間割`;
      await addTemplate(name, {});   // timetable は空オブジェクト

      const updatedTemplates = await storageService.getTemplates();
      await setTemplates(updatedTemplates);

      // いま追加したテンプレートの id（末尾の要素と仮定）
      templateId = updatedTemplates[updatedTemplates.length - 1].id;

      // 対応表に保存
      await storageService.saveTemplateIdForPeriod(year, term, templateId);
    } else {
      // 対応表にある場合 → templates と currentTemplateId を揃える
      const updatedTemplates = await storageService.getTemplates();
      await setTemplates(updatedTemplates);
    }

    if (!templateId) return;

    // 現在のテンプレートを切り替え
    await setCurrentTemplateId(templateId);
    await storageService.saveCurrentTemplateId(templateId);
  },
  [addTemplate, setTemplates, setCurrentTemplateId]
);


  // === 学期フィルタ：前期→(前期/通年), 後期→(後期/通年) を表示 ===
  const coursesByActiveTerm = useMemo(() => {
    return courseData.filter(c => {
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
  }, [courseData, activeTerm, activeGrade]);

  // 検索（学期で絞って渡す）
  const { query, setQuery, results } = useCourseSearch(
    coursesByActiveTerm,    // ← これで学年も効く
    selectedDay,
    selectedPeriod
  );

  const courseCandidatesForModal = useMemo(() => {
    return coursesByActiveTerm.filter(
      course =>
        course.曜日 === selectedDay &&
        course.時限.split(',').map(s => s.trim()).includes(String(selectedPeriod))
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
        if (subject) {
          // 前期選択時 → 前期 or 通年 or 年間 or 前期隔週 or 年間隔週
          // 後期選択時 → 後期 or 通年 or 年間 or 後期隔週 or 年間隔週
          const term = subject.term || '';
          if (activeTerm === '前期') {
            if (term.includes('前期') || term.includes('通年') || term.includes('年間')) {
              filtered[day][period] = subject;
            }
          } else {
            // 後期
            if (term.includes('後期') || term.includes('通年') || term.includes('年間')) {
              filtered[day][period] = subject;
            }
          }
        }
      }
    }

    return filtered;
  }, [getCurrentTemplate, activeTerm]);

  const handleAttendanceUpdate = useCallback(
    async (type: 'attendance' | 'absence' | 'late') => {
      const template = getCurrentTemplate();
      if (!template) return;

      const day = selectedDay;
      const period = String(selectedPeriod);

      // ★ ここがポイント：storage から最新を読み直す
      const templates = await storageService.getTemplates();
      const fresh = templates.find(t => t.id === template.id);
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

  return (
    isTemplateLoading || isDataLoading ? (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    ) : (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={[getCurrentTheme().backgroundColor, getCurrentTheme().backgroundColor]}
          style={styles.gradientBackground}
        >
          <ScrollView
            style={styles.scrollView}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            <ScrollView
              style={styles.scrollView}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
              {/* ヘッダー部分 */}
              <View style={styles.header}> 
                <Text style={[styles.title, { color: getCurrentTheme().textColor }]}>
                  時間割表
                </Text>
                <View style={styles.headerButtons}>
                  {/* ここに共有ボタン */}
                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={() => setIsShareModalVisible(true)}   // ★ ここで true にする
                  >
                    <Text style={styles.shareButtonText}>共有</Text>
                  </TouchableOpacity>

                  <Chip
                    mode="flat"
                    compact
                    style={{
                      backgroundColor: colors.surfaceSolid,
                      borderColor: colors.border,
                      borderWidth: 1,
                    }}
                    textStyle={{ color: theme.textColor }}
                    onPress={() => setIsYearTermModalVisible(true)}
                  >
                    <Text style={{ color: theme.textColor }}>年度/学期</Text>
                  </Chip>
                </View>
              </View>

              {/* 検索バー */}
              <SearchCourseBox
                value={query}
                onChange={setQuery}
                results={results}
                onSelect={async (course: CourseData) => {
                  const templateId = getCurrentTemplate()?.id;
                  if (!templateId) return;

                  const periods = course.時限.split(',').map(p => p.trim());

                  // ★ 色を決める
                  const timetable = getCurrentTemplate()?.timetable || {};
                  const seed = `${course.履修期}|${course.曜日}|${course.科目名}|${periods.join('-')}`;
                  const decidedColor =
                    findExistingColor(timetable, course.曜日, course.科目名, course.教員)
                    ?? pickColorBySeed(seed);

                  const subject: Subject = {
                    id: `${course.曜日}-${periods[0]}-${course.科目名}`,
                    name: course.科目名,
                    professor: course.教員,
                    credits: course.単位,
                    term: course.履修期,
                    color: decidedColor,           // ← ここだけ追加
                    notifications: true,
                    room: course.教室 ?? '',
                    attendance: 0,
                    absence: 0,
                    late: 0,
                    totalClasses: 0,
                    note: course.備考 ?? '',
                  };

                  await updateSubjectMulti(templateId, course.曜日, periods, subject);
                  const updatedTemplates = await storageService.getTemplates();
                  await setTemplates(updatedTemplates);
                  setQuery('');
                  setIsCourseModalVisible(false);
                }}
              />

              {/* 時間割グリッド */}
              <TimetableGrid
                timetable={getCurrentTemplate()?.timetable || {}}
                theme={getCurrentTheme()}
                onCellPress={(day, period) => {
                  setSelectedDay(day);
                  setSelectedPeriod(period);
                  const subject = getCurrentTemplate()?.timetable?.[day]?.[period] ?? null;
                  if (subject) {
                    setSelectedSubject(subject);
                    setIsAttendanceModalVisible(true); // 登録済み → 出席モーダルを表示
                  } else {
                    setIsCourseModalVisible(true); // 未登録 → 授業候補モーダルを表示
                  }
                }}
              />

              <View style={styles.examSection}>
                <ExamList
                  exams={exams}
                  subjects={getAllRegisteredSubjects()}
                  theme={getCurrentTheme()}
                  onExamPress={(exam) => {
                    setSelectedExam(exam);
                    setIsExamModalVisible(true); // 編集用モーダルを開く
                  }}
                  onAddPress={() => {
                    setSelectedExam(null); // 新規登録モード
                    setExamDate(new Date()); // 初期日付設定（必要なら）
                    setIsExamModalVisible(true); // ✅ モーダル表示
                  }}
                />
              </View>

              {/* Google カレンダー「今後の予定」 */}
              <View style={styles.calendarSection}>
                <Text style={[styles.calendarTitle, { color: currentTheme.textColor }]}>今後の予定</Text>
                {calLoading && <ActivityIndicator size="small" color={currentTheme.textColor} />}
                {calError && <Text style={[styles.errorText, { color: currentTheme.textColor }]}>予定の取得に失敗しました</Text>}
                <CalendarView events={events} theme={currentTheme} />
              </View>
            </ScrollView>
          </ScrollView>
          <CourseSelectionModal
            visible={isCourseModalVisible}
            onClose={() => setIsCourseModalVisible(false)}
            selectedDay={selectedDay}
            selectedPeriod={selectedPeriod}
            courses={courseCandidatesForModal}
            theme={getCurrentTheme()}
            onSelect={async (course: CourseData) => {
              const templateId = getCurrentTemplate()?.id;
              if (!templateId) return;

              const periods = course.時限.split(',').map(p => p.trim());

              // ★ 色を決める
              const timetable = getCurrentTemplate()?.timetable || {};
              const seed = `${course.履修期}|${course.曜日}|${course.科目名}|${periods.join('-')}`;
              const decidedColor =
                findExistingColor(timetable, course.曜日, course.科目名, course.教員)
                ?? pickColorBySeed(seed);

              const subject: Subject = {
                id: `${selectedDay}-${periods[0]}-${course.科目名}`,
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

              await updateSubjectMulti(templateId, course.曜日, periods, subject);
              const updatedTemplates = await storageService.getTemplates();
              await setTemplates(updatedTemplates);
              setIsCourseModalVisible(false);
            }}
          />

          {/* モーダル類 */}
          <AttendanceModal
            visible={isAttendanceModalVisible}
            subject={selectedSubject}
            onClose={() => setIsAttendanceModalVisible(false)}
            // ← 親側の合算上限チェック付きロジックを渡す
            onUpdate={handleAttendanceUpdate}
            onDelete={async () => {
              const template = getCurrentTemplate();
              const templateId = template?.id;
              if (!templateId) return;

              // 1) 最新を読み直す（保存競合・古い参照を避ける）
              const templates = await storageService.getTemplates();
              const idx = templates.findIndex(t => t.id === templateId);
              if (idx < 0) return;

              const day = selectedDay;
              const period = String(selectedPeriod);

              // timetable をミュータブルに扱うためコピー（必要に応じて浅いコピーでOK）
              const tt = { ...(templates[idx].timetable || {}) };
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
                const same = Object.keys(tt[day] || {}).filter(p => {
                  if (p === period) return true;
                  const s = tt[day][p];
                  return s?.name === target.name && (s?.professor || '') === (target.professor || '');
                });
                same.forEach(p => keysToDelete.add(p));
              }

              for (const k of keysToDelete) {
                if (tt[day]?.[k]) delete tt[day][k];
              }
              if (tt[day] && Object.keys(tt[day]).length === 0) delete tt[day];

              templates[idx] = { ...templates[idx], timetable: tt };
              await storageService.saveTemplates(templates);
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
            onDelete={async (id) => { await deleteExam(id); setIsExamModalVisible(false); }}
            onDateChange={(date) => setExamDate(date)}
            onDatePickerVisibilityChange={(visible) => setShowDatePicker(visible)}
          />

          {/* テンプレート & 学期モーダル（前期/後期のみ） */}
          <YearTermModal
            visible={isYearTermModalVisible}
            activeYear={activeYear}
            activeTerm={activeTerm}
            activeGrade={activeGrade}                    // ★ 追加
            onChangeYear={(year) => {
              setActiveYear(year);
            }}
            onChangeTerm={(term) => {
              setActiveTerm(term);
            }}
            onChangeGrade={(grade) => {                  // ★ 追加
              setActiveGrade(grade);
            }}
            onClose={async () => {
              // ✕ を押したタイミングでだけテンプレ切り替え
              await switchPeriod(activeYear, activeTerm);
              setIsYearTermModalVisible(false);
            }}
          />

          <TemplateShareModal
            visible={isShareModalVisible}
            onClose={() => setIsShareModalVisible(false)}
            templateId={currentTemplateId}
            templateName={getCurrentTemplate()?.name ?? ''}
            onImportSuccess={async () => {
              // インポート後にテンプレ一覧を更新
              const updated = await storageService.getTemplates();
              await setTemplates(updated);
            }}
          />
        </LinearGradient>
      </SafeAreaView>
    )
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
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
  loginButton: {
    backgroundColor: '#4285F4',
    padding: 12,
    borderRadius: 4,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerButtons: {
  flexDirection: 'row',
  alignItems: 'center',
},
  shareButton: {
    marginRight: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#ffffff88',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  themeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 8,
    borderRadius: 5,
    marginRight: 10,
  },
  examSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Google カレンダーセクション用スタイル
  calendarSection: {
    marginVertical: 20,
    paddingHorizontal: 10,
  },
  calendarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  eventItem: {
    marginBottom: 6,
  },
  eventTitle: {
    fontSize: 16,
  },
  eventTime: {
    fontSize: 14,
    opacity: 0.8,
  },
  errorText: {
    fontSize: 14,
    marginVertical: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginVertical: 10,
  },
});