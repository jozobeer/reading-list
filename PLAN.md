# PLAN — 読書リスト

## 1. 概要

読みたい本のタイトルを登録し、読み終えたら「読了」に切り替えて管理する静的単一ページ Web アプリを作る。登録した本の一覧とステータス（未読/読了）は localStorage に保存され、ページをリロードしても復元される。バニラ JS・単一 `public/index.html`（CSS/JS インライン）・ビルドなしで完結し、Cloudflare Workers assets で配信する。

## 2. 意図（明示）

読みたい本がどんどん増えていく人が、後で見返せるようにタイトルをメモしつつ、読み終えたものと積読中のものを区別して管理するために使う。

## 3. 受け入れ条件

- [ ] 本のタイトルを入力して追加すると、一覧に表示される
- [ ] 空文字（空白のみを含む）のタイトルは追加できない
- [ ] 各本の「読了」ボタンでステータス（未読/読了）を切り替えられ、読了の本は見た目で未読と区別できる
- [ ] 「読了」ボタンをもう一度押すと未読に戻せる
- [ ] ページをリロードしても、登録した本の一覧と各本のステータスが復元される

## 4. 実装方針

### 技術スタック（AGENTS.md の不変制約に従う）

- バニラ JS・単一 `public/index.html` に CSS/JS をインラインで記述。ビルドなし
- 配信: Cloudflare Workers assets（`wrangler.jsonc`、テンプレート生成済み）
- テスト: Playwright（`tests/app.spec.ts`、`npm test`）。雛形のスモークテストは残し、受け入れ条件ごとのテストを追記する
- `scripts/persist-test.mjs` の scenario / verify を本アプリの操作（本の追加・読了切替 → リロード後の復元確認）に書き換える

### データモデルと永続化

- 状態は本の配列 1 本で持つ: `[{ id: string, title: string, done: boolean }, ...]`
- localStorage キー: `reading-list-books`（JSON 文字列で保存）
- 読み込み時に `JSON.parse` が失敗した場合や配列でない場合は空配列にフォールバックし、壊れたデータでアプリが起動不能にならないようにする

### レイアウト

- 上部: アプリタイトル（h1）＋ 追加フォーム（テキスト入力 + 追加ボタン、`<form>` の submit で Enter 追加にも対応）
- 中央: 本の一覧（`<ul>`）。各行にタイトルと「読了」/「未読に戻す」トグルボタンを表示。読了の本は打ち消し線＋淡色で区別
- 一覧が空のときは空状態メッセージ（例:「まだ本がありません」）を表示
- 最下部: hub へのフッター導線（AGENTS.md 指定のマークアップを使用）。body を `display: flex; flex-direction: column` 等のセンタリングにする場合はフッターのレイアウト崩れに注意し、通常フロー最下部に統合する
- `<head>` に favicon を `<link rel="icon" href="data:image/svg+xml,...">` のインライン data URI で含める（本のアイコンなどテーマに合った絵柄）

### 主要関数

- `loadBooks(): Book[]` — localStorage から状態を読み込む（破損時は空配列）
- `saveBooks(books)` — 状態を localStorage へ JSON 保存
- `render()` — 状態配列から一覧 DOM を再構築する（状態→描画の一方向。DOM を直接ソースオブトゥルースにしない）
- `addBook(title)` — trim 後に空なら無視。新規 Book を配列に追加し `saveBooks` → `render`
- `toggleDone(id)` — 該当 Book の `done` を反転し `saveBooks` → `render`

状態変更は必ず「配列を更新 → 保存 → 再描画」の順で一貫させ、保存漏れによる復元不整合を防ぐ。

### 完成条件

- 上記の受け入れ条件をすべて満たす
- `npm run verify` と `npm test` が通る
