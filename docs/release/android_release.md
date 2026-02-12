# Androidビルド・Google Play Console提出手順書

本書は，Expo（EAS）を用いたAndroidアプリのビルド生成（AAB）から，Google Play Console への提出，公開までの手順をまとめたものである．  
※ 公開用リポジトリには，鍵・証明書・アカウント情報・ログ等の機微情報は含めない．

---

## 🟦 **1. 前準備（ローカル環境の確認）**

### ① `.nvmrc` に指定した Node バージョンを使用する

```bash
nvm use
```

### ② Node バージョンの確認

```bash
node -v
```

→ `.nvmrc` に指定されたバージョンになっていることを確認する．

### ③ expo-doctor の確認

```bash
npx expo-doctor
```

→ `17/17 checks passed` が出ればOK

### ④ Expo SDK に不一致があれば更新

```bash
npx expo install --check
```

→ 必要なら「yes」で修正

→ 正しく反映されたら再度：

```bash
npx expo-doctor
```

→ `17/17 checks passed` が出ればOK

---

## 🟦 **2. Git の準備（バージョン更新用ブランチ作成）**

### ① build ブランチへ切り替え

```bash
git checkout build
```

### ② 最新の main を取り込む

```bash
git merge main
```

### ③ バージョン更新・細かい修正を行う

（例：`app.json` の `version`、必要ならコードの修正など）

```bash
"expo": {
	"version": "1.x.y",
}
```

→上記 "version": "1.x.y" を + 0.0.1 する（前回が1.0.1なら今回が1.0.2）
　※大きい変更の場合は + 1.0.0

⭐️ EAS は `appVersionSource: "remote"` のため **versionCode は自動で上がる**

　 → app.json の `android.versionCode` は記述不要（残っていてもビルドには影響なし）

### ④ コミット（日本語でOK）

```bash
git add .
git commit -m "バージョン更新とビルド準備"
```

### ⑤ main に反映するため push

```bash
git push origin build
```

---

## 🟦 **3. main ブランチへの統合**

### ① main に移動

```bash
git checkout main
```

### ② build を main にマージ

```bash
git merge build
```

### ③ push

```bash
git push origin main
```

---

## 🟦 **4. Android ビルド（EAS Build）**

### ① production プロファイルでビルド

```bash
npx eas build -p android --profile production
```

### 🔸 MUM -日大応情学習支援アプリ の `eas.json`

```json
"production": {
  "autoIncrement": true}
```

➡ versionCode が毎回自動インクリメントされる

➡ `app.json` の version を自分で上げればOK

### ② 完了したら、コンソールに AAB の URL が表示される

例：

```
🤖 Android app:
https://expo.dev/artifacts/eas/xxxxxx.aab
```

→ コンソールに表示された https://expo.dev/artifacts/eas/xxxxxx.aab を「**command + クリック」**
　 でダウンロードする

---

## 🟦 **5. Google Play Console への提出**

### ① Google Play Console にアクセス

1. アプリ欄から「**MUM - 日大応情学習支援アプリ**」を選ぶ
2. 「**テストとリリース**」をクリック
3. 「**製品版**」をクリック
4. 「**新しいリリースを作成**」をクリック

### ② **App Bundle に** AAB をアップロード

（4.②でダウンロードしたファイル）

### ③ リリースノートを記入

（**MUM - 日大応情学習支援アプリ** の場合、毎回今回の更新内容だけで良い）

### ④ 提出（レビュー開始）

1. 「**次へ**」をクリック 
2. 「**保存**」をクリック
3. 「**公開の概要に移動**」をクリック
4. 「**一般的な問題のクイック チェックを実行する**」のゲージが完了するまで待機
5. 「**変更内容を審査に送信できるようになりました。アプリの審査時に他の問題が見つかることがあります。**」が表示されたら「**１件の変更を審査に送信**」をクリック
6. 「**変更を審査に送信**」をクリック

---

## 🟩 **✔ 最終まとめ（短縮版）**

1. `nvm use`
2. `expo-doctor` / `expo install --check`
3. `git checkout build`
4. `git merge main`
5. バージョン更新 → コミット（日本語でOK）
6. `git push origin build`
7. `git checkout main`
8. `git merge build`
9. `git push origin main`
10. `npx eas-cli build -p android --profile production`
11. AAB を手動アップロード（Google Play Console）

---