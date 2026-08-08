# 読書リスト

読みたい本のタイトルを登録し、「読了」/「未読に戻す」でステータスを切り替える静的単一ページ Web アプリ。状態は localStorage（キー `reading-list-books`）に `[{ id, title, done }, ...]` として保存され、リロード後も復元される。空・空白のみのタイトルは追加されず、読了の本は打ち消し線と淡色で区別する。実装は `public/index.html` 単一ファイルに完結している。

## 構成

- `public/index.html` — アプリ本体（HTML/CSS/JS インラインの単一ファイル）
- `tests/app.spec.ts` — Playwright による機能テスト（現状の正）
- `scripts/persist-test.mjs` — 永続化シナリオ検証
- `wrangler.jsonc` — Cloudflare Workers assets 配信設定
- `PLAN.md` — 初回実装時の計画（歴史的文書。現行仕様の正ではない）
- `README.md` — アプリ説明・公開URL・開発コマンド（人間向けの現状説明）

## 技術スタック（不変）

- バニラJS・単一 `public/index.html`（CSS/JSインライン）・ビルドなし
- 配信: Cloudflare Workers assets（`wrangler.jsonc`）
- テスト: Playwright（`tests/app.spec.ts`、`npm test`）
- 保守時もこのスタックを維持すること。フレームワーク・ビルドツール・宣言外ライブラリの導入は禁止

## 品質不変条件

次を壊さないこと。変更後は `npm run verify` が通る状態を維持する。

- **favicon**: `<link rel="icon" href="data:image/svg+xml,...">` のインライン data URI（外部ファイル・外部 URL 不可）
- **hub フッター**: リンク先 `https://apps.jozo.beer` とリンクテキスト `apps.jozo.beer` を維持する。マークアップの目安:

  ```html
  <footer style="margin-top:3rem;text-align:center;font-size:.8rem;opacity:.6">
    <a href="https://apps.jozo.beer" style="color:inherit">apps.jozo.beer</a>
  </footer>
  ```

  スタイル（リンク色を含む）はテーマに合わせて調整してよい。配置は縦方向フローの最下部（メインコンテナ末尾、または `flex-direction: column` にした body 内）。センタリング用の flex/grid で footer が横並びアイテムにならないようにする。

その他の制約:

- 静的アプリ（`public/` 配下のみ）。サーバコード・外部 API・ビルドツールは使わない
- `public/index.html` を単一ファイルで完結させる（CSS/JS インライン可）
- 主要な状態を localStorage に永続化し、リロード後に復元すること
- apple-touch-icon / manifest / og-image / robots / sitemap は公開基盤側で扱うため、このリポジトリでは追加しない

## 現状の正

- **人間向けの説明**: `README.md`
- **振る舞いの契約**: `tests/app.spec.ts`（および `npm run verify`）
- `PLAN.md` は初回実装時の計画であり歴史的文書。現行仕様と食い違う場合は README とテストを正とする

## 保守の進め方

1. 変更前に、追加・変更する受け入れ条件を `tests/app.spec.ts` のテストとして書く（または既存テストを更新する）
2. `public/index.html` を実装・修正する
3. `npm test` が通ることを確認する（あわせて `npm run verify` も通し、品質不変条件を崩していないことを確認する）
4. `git commit` したうえで `git push` する
5. `npm run deploy` で Cloudflare Workers へ公開する
