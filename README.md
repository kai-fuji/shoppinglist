# 買い物リストアプリ

Next.js + Tailwind CSS + SQLite (@libsql/client) で作った買い物リスト管理アプリです。

## 機能

| 画面 | 内容 |
| --- | --- |
| 買い物リスト (`/`) | 商品一覧・購入先フィルター・売り順グループ化・購入済みチェック（取り消し線アニメ）・商品削除・ネットで探す・テキスト入力（入力して追加）・メモ・通知設定（リマインダー・プッシュ通知） |
| 定期購入品 (`/recurring`) | よく買う商品の登録・編集・削除、ワンタップで買い物リストへ追加 |
| マイページ (`/mypage`) | 購入先の管理・商品カテゴリーの管理・アプリ設定（履歴・全データ削除） |

## 起動方法

```bash
npm install
npm run dev
```

http://localhost:3000 を開きます。

## データベース

- 環境変数 `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` を設定すると Turso を使用します。
- 未設定の場合はローカルの `shopping.db`（SQLite）を使用します。
- テーブル: `shopping_items` / `recurring_items` / `app_settings` / `push_subscriptions`

## 通知について

- ベルボタンから通知設定を開けます。
- 「お買い物リマインダー」はアプリを開いている間、指定時刻にブラウザ通知を出します。
- 「プッシュ通知」は Web Push（Service Worker + VAPID）を使用し、アプリを閉じていても指定時刻にホーム画面のアプリへ通知します。
  - 事前に `npm install` で `web-push` をインストールしてください（VAPID 鍵は初回起動時に自動生成され `app_settings` に保存されます）。
  - プッシュ通知には HTTPS 接続が必要です（iOS は 16.4 以降 + ホーム画面追加済みが条件です）。
  - 通知の送信はアプリのサーバー（`npm run dev` 等が動いている PC）が起動している間に行われます。
