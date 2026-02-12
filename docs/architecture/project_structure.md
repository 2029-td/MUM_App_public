## **MUM フォルダ構成**

**src**  
├── **@types**  
│   └── svg.d.ts　# SVG import の型定義（react-native-svg 用）  
├── **assets**  
│   ├── **data**  
│   │   └── timetable.csv　# 時間割データファイル  
│   └── **fonts**  
│       └── SpaceMono-Regular.ttf　# アプリで使うカスタムフォント  
├── **components**  
│   ├── **__tests__**  
│   │   ├── **__snapshots__**  
│   │   │   └── StyledText-test.js.snap　# StyledText のスナップショット（Jest）  
│   │   └── StyledText-test.js　# StyledText のテスト（Jest）  
│   └── useColorScheme.ts　# ダーク/ライトモード自動切替のカスタムフック  
├── **features**  
│   ├── **map**  
│   │   ├── **assets**  
│   │   │   ├── **icons**  
│   │   │   │   ├── vending_machine_filter.png　# 自動販売機フィルターボタン  
│   │   │   │   └── vending_machine_icon.png　# 自動販売機アイコン  
│   │   │   └── **images**  
│   │   │       ├── map.jpg　# jpgマップ画像  
│   │   │       └── map.svg　# svgマップ画像  
│   │   ├── **constants**  
│   │   │   ├── classesData.ts　# 授業データの読み込み  
│   │   │   ├── labData.ts　# 研究室データ  
│   │   │   ├── mapData.ts　# 建物データ  
│   │   │   └── vendingMachineLocations.ts　# 自動販売機の位置座標  
│   │   └── screen.tsx　# マップメイン画面  
│   ├── **others**  
│   │   ├── **components**  
│   │   │   └── ThemeSelector.tsx　# テーマ選択UI  
│   │   └── screen.tsx　# その他メイン画面  
│   ├── **timetable**  
│   │   ├── **components**  
│   │   │   ├── **Calendar**  
│   │   │   │   └── CalendarView.tsx　# Googleカレンダー表示  
│   │   │   ├── **Exam**  
│   │   │   │   ├── ExamForm.tsx　# 試験入力フォーム  
│   │   │   │   ├── ExamList.tsx　# 試験一覧表示  
│   │   │   │   ├── ExamModal.tsx　# 試験編集モーダル  
│   │   │   │   └── index.ts　# Exam集約export  
│   │   │   └── **Timetable**  
│   │   │       ├── AttendanceModal.tsx　# 時間割詳細ページ  
│   │   │       ├── ClassRegistrationModal.tsx　# 授業登録モーダル  
│   │   │       ├── CourseSelectionModal.tsx　# 授業選択モーダル  
│   │   │       ├── SearchCourseBox.tsx　# 授業検索UI  
│   │   │       ├── showDeleteConfirm.tsx　# 削除確認ダイアログ  
│   │   │       ├── SubjectSettingsModal.tsx　# 授業の単位数や削除等を行う設定モーダル  
│   │   │       ├── TemplateModal.tsx　# 学年、学期の切り替えモーダル  
│   │   │       ├── TemplateShareModal.tsx　# 時間割共有モーダル  
│   │   │       ├── TimetableGrid.tsx　# 時間割グリッド表示  
│   │   │       └── TimetableSettingsModal.tsx　# 時間割表の設定モーダル  
│   │   ├── **constants**  
│   │   │   └── index.ts　# カラーパレット、テーマカラー、カレンダーカラーの定義  
│   │   ├── **hooks**  
│   │   │   ├── useCourseSearch.ts　# 授業検索ロジック  
│   │   │   ├── useExams.ts　# 試験CRUD＋通知  
│   │   │   └── useTemplates.ts　# 時間割テンプレート管理  
│   │   ├── **services**  
│   │   │   ├── notifications.ts　# 試験通知管理  
│   │   │   ├── storage.ts　# 時間割・試験の永続化処理  
│   │   │   └── timetableCsvParser.ts　# csv読み込み→CourseData変換  
│   │   ├── **types**  
│   │   │   └── index.ts　# 時間割のデータ型を定義  
│   │   └── screen.tsx　# 時間割メイン画面  
│   └── **todo**  
│       ├── **components**  
│       │   ├── AddEditTodoModal.tsx　# Todoのタスク追加モーダル  
│       │   ├── TodoDetailModal.tsx　# Todoのタスクの詳細画面  
│       │   ├── TodoItem.tsx　# タスクのカード  
│       │   ├── TodoList.tsx　# Todoリストの画面  
│       │   └── TodoListWithCategoryFilter.tsx　# 絞り込み＋ソートUI付きのToDo一覧  
│       ├── **hooks**  
│       │   └── useTodos.ts　# 定期追加のシステム定義  
│       ├── **types**  
│       │   └── index.ts　# ToDoリストのデータ型を定義  
│       ├── **utils**  
│        │  └── storage.ts　# ToDoの補助関数やストレージ  
│       └── screen.tsx　# ToDoリストメイン画面  
├── **hooks**  
│   ├── useAppTheme.tsx　# アプリ全体のテーマ状態管理（Context）  
└── **styles**  
　├── color.ts　# 色合成・rgba→不透明化など色ユーティリティ  
　└── index.ts　# テーマに基づく共通スタイル＆色（useStyles）  

 app.json　# Expoアプリ設定（名前、アイコン、スプラッシュなど）  
 App.tsx　# React Nativeアプリのエントリーポイント  
 babel.config.js　# Babel設定（パスエイリアスなど）  
 expo-env.d.ts　# Expo専用型定義（環境補助）  
 package-lock.json　# npm依存のロックファイル  
 package.json　# プロジェクトの依存・スクリプト定義  
 README.md　# プロジェクトの概要説明ファイル  
 tsconfig.json　# TypeScriptの設定（エイリアス、型補完など）  