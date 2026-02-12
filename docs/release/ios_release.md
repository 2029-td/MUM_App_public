# iOSリリース手順書（App Store）

本書は，Expo（EAS）を用いたiOSアプリのビルド生成から，App Store Connectへの登録，審査提出，公開までの手順をまとめたものである．  
※ 公開用リポジトリには，鍵・証明書・アカウント情報等の機微情報は含めない．


## ✅ 前提条件

- Apple Developer Program に登録済み（年会費が必要）
- App Store Connect にチームアカウントがある
- app.json に iOS 設定が含まれている（下記例だと`"bundleIdentifier": "com.example.mumapp"`, `"usesNonExemptEncryption": false`）
- app.json にアイコン設定が含まれている（下記例だと`"icon": "assets/images/icon.png"`）
    
    ```
    "ios": {
    	"icon": "assets/images/icon.png",
    	"supportsTablet": false,
    	"bundleIdentifier": "com.example.mumapp",
    	"buildNumber": "1",
    	"config": {
    		"usesNonExemptEncryption": false
      }
    }
    ```
    

---

## **1. App Store 提出用のスクリーンショットを撮影**

- Xcode でプロジェクトを開く
- メニューから **Product → Destination** を選択
- 使用するデバイスを選択（例：iPhone 14 Pro Max）
- シミュレーター起動後に必要な画面のスクリーンショットを撮影

<aside>
💡

**補足**：App Store 提出時は、以下のサイズが必要

- **6.5インチ**（1242×2688px）
- **5.5インチ**（1242×2208px）
</aside>

---

## **2. App ID と Apple Developer サイトの同期確認**

- Apple Developer にログイン
- 左メニューから **Identifiers** を選択
- App Store に提出するアプリの **Bundle ID** の有無を確認（なかったら3.、あったら4.へ）

---

## 3.  App ID を作成

- **Apple Developer** の「Identifiers」ページ右上の「＋」ボタンをクリック
- **App IDs** を選択 → 「Continue」
- **App type** は「App」を選択 → 「Continue」
- **Description** にアプリ名を入力（例：MUM -日大応情学習支援アプリ）
- **Bundle ID** に Expoの設定ファイル（`app.json`）内の値を入力（下記例だと`com.example.mumapp`）
    
    ```json
    "ios": {
      "bundleIdentifier": "com.example.mumapp"
    }
    ```
    
- 必要な機能（Push通知など）をチェック
- **Continue → Register** をクリックして登録完了

---

## **4. アプリを App Store Connect に登録**

- **My App** を選択
- **App** の右側にある「＋」ボタンから新規作成を選択
- プラットフォームとして **iOS** にチェック
- **アプリ名** を入力
- **Bundle ID**（2.または3.で作成したもの）を選択
- **SKU** を入力
- **言語設定** で「日本語」または「Full Access」を選択
- **Create** をクリック

---

## **5. アプリの一般情報を編集**

- 1.で作成したスクリーンショットをアップロード
- **プロモーション用テキスト** (App Storeの説明の上に表示される文章) を入力（任意）
- **概要** (特長や機能の詳細など、アプリに関する説明文) を入力
- **キーワード** (App Storeの検索キーワード) を入力
- **サポートURL** (アプリの公式サイトURL) を入力
- **マーケティングURL** を入力（任意）
- **著作権** を入力（担当者名もしくは組織名）
- **Build** は設定せずに空欄のまま
- **App Reviewに関する情報** を設定（審査時の連絡先を入力）
- **メモ** (審査担当者への補足メッセージ) を記入
- **App Storeバージョンのリリース** を選択（**手動**・**自動**・**日付指定**どれでも可）
- 画面右上の **保存** をクリックして内容を保存

---

## **6. アプリ情報を設定**

- 左メニューから **アプリ情報** を選択
- **名前** (3.で設定したアプリ名) を記入
- **サブタイトル** (App Storeのアプリ名の下に表示される、アプリの概要文) を設定（任意）
- **アプリのカテゴリー** を選択
- **コンテンツ配信権** を設定
- **年齢制限指定** (アプリの対象年齢) を設定
- **アプリの暗号化に関する書類** をアップロード（独自の暗号化アルゴリズムまたは国際標準化団体 (IEEE、IETF、ITUなど) の標準化認定を受けていない暗号化アルゴリズムが含まれる場合なので、基本的にはアップロードしない）
- 画面右上の **保存** をクリックして内容を保存

---

## **7. アプリのプライバシーを設定**

- 左メニューから **アプリのプライバシー** を選択
- **プライバシーポリシーURL** にアプリのプライバシーポリシーを記載したページのURLを入力
- **Get Started** を押して質問に回答
※ 個人情報を収集して第三者に渡すことがなければNoを選択
- **Publish** をクリックして入力内容を確定
- タブを閉じる

---

## 8. アプリのアクセシビリティを設定

- **デバイスを追加** をクリック
- 対応するデバイスをチェックして **保存** をクリック
- **iPhoneのサポート機能** の横にある **編集** をクリック
- **はい** か **いいえ** を選択して **次へ → 保存** をクリック
- 画面右上の **公開** をクリックして内容を公開

---

## **9. 価格および配信状況を設定**

- 左メニューから **価格および配信状況** を選択
- **価格** として「JPY 0(Free)」を選択
- **アプリの配信状況** として「すべての国または地域」を選択
- 画面右上の **保存** をクリックして内容を保存

---

## **10. アプリをアップロード（10.1 か 10.2 のどちらかを実行）**

### 10.1 Visual Studio Code のターミナルを利用してアップロードする方法（推奨）

- Visual Studio Code のターミナルを開く
- ターミナルで下記コマンドを実行（iOSビルドを作成）
    
    ```bash
    eas build -p ios --profile production
    ```
    
    主なプロンプトと推奨回答：
    
    | 表示 | 回答例 |
    | --- | --- |
    | Do you want to log in to your Apple account? | **yes** |
    | Apple ID / Password / 2FA | App Store 公開に使用するチームの Apple ID でログイン（2FA含む） |
    | Generate a new Apple Distribution Certificate? | **Y**（初回は新規発行推奨） |
    | Would you like to set up Push Notifications? | **Yes**（将来の通知対応に備える） |
    | Generate a new APNs key? | **Y**（未所持なら作成） |
- 自動アップロードがされなかったらターミナルで下記コマンドを実行（App Store Connect へ提出）
    
    ```bash
    eas submit -p ios --latest
    ```
    
    主なプロンプトと推奨回答：
    
    | 表示 | 回答例 |
    | --- | --- |
    | Log in to your Apple Developer account | Apple IDでログイン（2FA含む） |
    | Generate a new App Store Connect API Key? | **yes**（未作成なら作成推奨） |
- 「Your binary has been successfully uploaded to App Store Connect!」と表示されたら成功

### 10.2 Xcode を利用してアップロードする方法

- Xcode でプロジェクトを開く
- メニューから **Product** → **Archive** を選択
- アーカイブ一覧画面が表示されたら **Distribute App** を押す
- **App Store Connect** を選択して**Distribute** を押す
- 「App upload complete」と表示されたら成功
- **Done** を押して Xcode を閉じる

---

## **11. アプリのビルド情報を編集**

- メールが届いたら App Store Connect を開く
- **My App** を選択
- 編集途中のアプリを選択
- **Build** の右側にある「＋」ボタンを押す
- バージョン番号とビルド番号を確認してアプリを選択
- **Export Compliance Information** に回答
- **Done** を押す

---

## **12. アプリを申請**

- ページ上部の **審査用に追加** をクリック
- ページ内の **審査へ提出** をクリックするとメールが届く
- 審査開始まで数時間から数日待機
- 「Your submission was accepted」「MyApp is now “Ready for Sale”」というメールが届けば承認完了

---

## 📕（補足）審査通過後のアプリアップデート

- `version` を +0.0.1
- `buildNumber` を +1
- 上記の設定を行ったら10. ~ 12. を再実行