# 読書リスト

本のタイトルを入力して追加し、「読了」/「未読に戻す」でステータスを切り替える静的単一ページアプリ。一覧は localStorage（キー `reading-list-books`）に `{ id, title, done }` の配列として保存され、リロード後も復元される。空・空白のみのタイトルは追加されない。読了の本は打ち消し線と淡色で区別し、一覧が空のときは「まだ本がありません」を表示する。

## 機能

- タイトル入力＋「追加」（フォーム submit / Enter）で一覧へ追加
- 空文字・空白のみのタイトルは追加されない
- 各本の「読了」ボタンで未読 ↔ 読了をトグル（読了時はボタン文言が「未読に戻す」）
- 読了の本は打ち消し線＋淡色で見た目を区別
- リロード後も本の一覧と各本のステータスを復元
- 0件のときは空状態メッセージを表示

## 公開URL

https://reading-list.jozo.beer

## 開発

[kojo](https://github.com/jozobeer/kojo)（1日1アプリ自動生成基盤）により生成されたリポジトリです。

初回セットアップ: `npm install`（Playwright ブラウザ未取得の環境では `npx playwright install chromium`）

- `npm test` — Playwright によるブラウザテスト
- `npm run verify` — 不変条件チェック（favicon / apps.jozo.beer フッター）
- `npm run deploy` — Cloudflare Workers へデプロイ

## 構成

- `public/index.html` — アプリ本体（CSS/JSインラインの単一ファイル。状態キー `reading-list-books`）
- `tests/app.spec.ts` — 受け入れ条件に対応する Playwright テスト（現状の正）
- `PLAN.md` — 初回実装時の計画（歴史的文書）
