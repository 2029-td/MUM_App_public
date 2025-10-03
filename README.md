# MUM(Mutsulab Utility Multisupport) - 学習支援アプリ

> 日本大学理工学部応用情報工学科の学生の大学生活を支援する学生支援アプリケーションです。時間割管理や学内マップ、ToDoリストなどの機能を提供します。

## 📱 主な機能

### 🗓️ 時間割管理
- CSVファイルから時間割をインポート（検索ボックスから授業候補を選ぶだけで **曜日/時限/教員/教室** を自動反映）
- 授業の登録・編集・削除・連続コマの一括登録
- テンプレート切替・共有機能
- 試験日程の登録・編集・削除・前日通知
- 大学カレンダーとの同期

### 🗺️ 学内マップ
- 画質が荒くならないsvg形式の学内マップ
- 授業・建物・研究室の検索
- 自動販売機の位置をアイコンで表示
- ピンチズーム・パン操作対応

### ✅ ToDoリスト
- タスクの作成・編集・削除
- カテゴリ（タグ）絞り込み、**期限/追加日**の並び替え
- **週次の自動生成**（定期課題）に対応

### ⚙️ 設定
- テーマ切り替え（デフォルト/ダーク/ライト）
- お問い合わせ・利用者アンケート・プライバシーポリシーへのリンク

## 🚀 セットアップ

### 必要要件

- **Node.js**: v16以上
- **npm**: v7以上
- **Expo CLI**: 最新版推奨
- **iOS開発**: Xcode（iOS開発の場合）
- **Android開発**: Android Studio（Android開発の場合）

### 1. リポジトリのクローン

```bash
git clone https://github.com/your-username/MUM_App.git
cd MUM_App
```

### 2. 依存関係のインストール

```bash
npm ci
```

### 3. アプリケーションの起動

```bash
# Expo開発サーバーの起動
npx expo start -c

# iOSシミュレーターで起動
i

# Androidエミュレーターで起動
a

# Webブラウザで起動
w
```

## 📂 プロジェクト構成

```
MUM_App/
├── App.tsx                 # アプリケーションのエントリーポイント
├── src/
│   ├── features/          # 機能別モジュール
│   │   ├── timetable/    # 時間割機能
│   │   ├── map/          # マップ機能
│   │   ├── todo/         # ToDoリスト機能
│   │   └── setting/      # 設定機能
│   ├── components/        # 共通コンポーネント
│   ├── hooks/            # カスタムフック
│   ├── services/         # API・認証サービス
│   ├── styles/           # スタイル定義
│   ├── constants/        # 定数定義
│   └── @types/           # 型定義
├── assets/               # 画像・フォントなどのリソース
├── .env                  # 環境変数（要作成）
└── package.json          # プロジェクト設定
```

### 機能別ディレクトリ構成

各機能は以下の構造で整理されています：

```
features/[feature-name]/
├── screen.tsx           # メイン画面コンポーネント
├── components/          # 機能固有のコンポーネント
├── hooks/              # 機能固有のカスタムフック
├── services/           # 機能固有のサービス・API
├── types/              # 型定義
├── utils/              # ユーティリティ関数
└── constants/          # 定数定義
```

## 🛠️ 開発ガイド

### コーディング規約

- **言語**: TypeScript
- **スタイル**: React Native + React Navigation
- **状態管理**: React Hooks（useState, useEffect等）
- **非同期処理**: async/await
- **スタイリング**: React Native Paper + NativeWind (Tailwind CSS)

### 新機能の追加方法

1. **機能ディレクトリの作成**
   ```bash
   mkdir -p src/features/your-feature/{components,hooks,services,types}
   ```

2. **画面コンポーネントの作成**
   - `src/features/your-feature/screen.tsx` を作成

3. **タブナビゲーションへの追加**
   - `App.tsx` でインポートして `Tab.Screen` を追加

4. **型定義の追加**
   - `src/features/your-feature/types/index.ts` に型を定義

### よく使う開発コマンド

```bash
# 依存関係の追加
npm install [package-name]

# キャッシュのクリア
npx expo start -c

# TypeScriptの型チェック
npx tsc --noEmit
```

## 📚 主要ライブラリ

| ライブラリ | 用途 |
|----------|------|
| React Native | モバイルアプリフレームワーク |
| Expo | React Nativeの開発・ビルドツール |
| React Navigation | ナビゲーション |
| React Native Paper | UIコンポーネント |
| AsyncStorage | ローカルストレージ |
| Expo Calendar | カレンダー連携 |
| Axios | HTTP通信 |
| PapaParse | CSV解析 |
| React Native Calendars | カレンダー表示 |

## 🔧 トラブルシューティング

### よくある問題と解決方法

#### 1. `npm install` が失敗する

```bash
# node_modulesとlock fileを削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

#### 2. Metro bundler がクラッシュする

```bash
# キャッシュをクリアして再起動
npx expo start -c
```

#### 3. iOS/Androidでビルドエラーが出る

```bash
# iOS: Podのインストール
cd ios && pod install && cd ..

# Android: クリーンビルド
cd android && ./gradlew clean && cd ..
```

#### 4. 環境変数が読み込まれない

- `.env` ファイルがプロジェクトルートに存在するか確認
- アプリを完全に再起動（expo start --clear）

## 🤝 開発への参加方法

### プルリクエストの流れ

1. **リポジトリをフォーク**

2. **機能ブランチを作成**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **変更をコミット**
   ```bash
   git add .
   git commit -m "Add: 新機能の説明"
   ```

4. **プッシュしてプルリクエスト作成**
   ```bash
   git push origin feature/your-feature-name
   ```

### コミットメッセージの規約

- `Add:` 新機能追加
- `Fix:` バグ修正
- `Update:` 既存機能の更新
- `Refactor:` リファクタリング
- `Docs:` ドキュメント更新
- `Style:` コードスタイルの修正

## 📝 ライセンス

このプロジェクトはプライベートリポジトリです。

## 📮 お問い合わせ

質問や提案がある場合は、Issueを作成してください。

---

**Happy Coding! 🎉**
