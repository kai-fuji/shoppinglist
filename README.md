# 買い物リストアプリ

Next.js + Tailwind CSS + SQLite (@libsql/client) で作った買い物リスト管理アプリです。

## 機能

| 画面 | 内容 |
| --- | --- |
| 買い物リスト (`/`) | 商品一覧・購入先フィルター・売り順グループ化・購入済みチェック・ネットで探す・音声入力（話して追加）・テキスト入力（入力して追加）・メモ |
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
- テーブル: `shopping_items` / `recurring_items` / `app_settings`

## 音声入力について

Web Speech API を使用しています。Chrome または Safari でお使いください（マイクの許可が必要です）。
