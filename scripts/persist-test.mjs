// L1 永続化検証シナリオ。kojo の persistGate が chromium 上で実行する:
//   1. scenario(page) — アプリを操作し、localStorage に保存されるべき状態を作る
//   2. （kojo 側が page.reload() する）
//   3. verify(page) — リロード後の復元状態を検証する。不一致なら throw すること
// page は Playwright の Page。セレクタはこのアプリの実装に合わせて書き換える。

export async function scenario(page) {
  await page.fill("#title-input", "永続化テストの本");
  await page.click('#add-form button[type="submit"]');
  await page.click(".book-item .toggle-done");
}

export async function verify(page) {
  const items = page.locator(".book-item");
  const count = await items.count();
  if (count !== 1) {
    throw new Error(`expected 1 book after reload, got ${count}`);
  }

  const title = await items.first().locator(".book-title").textContent();
  if (title !== "永続化テストの本") {
    throw new Error(`expected title "永続化テストの本", got ${JSON.stringify(title)}`);
  }

  const className = (await items.first().getAttribute("class")) || "";
  if (!/\bdone\b/.test(className)) {
    throw new Error("expected book to be done after reload");
  }
}
