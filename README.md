# 読書リスト

読みたい本のタイトルを登録し、読み終えたら「読了」に切り替えて管理する静的単一ページアプリ。登録内容はlocalStorageに保存され、リロードしても残る。

## 公開URL

https://reading-list.jozo.beer

## 開発

[kojo](https://github.com/jozobeer/kojo)（1日1アプリ自動生成基盤）により生成されたリポジトリです。

初回セットアップ: `npm install`（Playwright ブラウザ未取得の環境では `npx playwright install chromium`）

- `npm test` — Playwright によるブラウザテスト
- `npm run verify` — 不変条件チェック（favicon / apps.jozo.beer フッター）
- `npm run deploy` — Cloudflare Workers へデプロイ

## 構成

- `public/index.html` — アプリ本体（CSS/JSインラインの単一ファイル）
- `PLAN.md` — 受け入れ条件付きの実装計画
