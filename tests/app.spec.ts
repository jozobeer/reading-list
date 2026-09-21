import { test, expect } from "@playwright/test";
import { pathToFileURL } from "node:url";

// 静的アプリなのでサーバ不要。kojo の visualGate と同じ file:// 方式で開く
const APP_URL = pathToFileURL("public/index.html").href;

test("ページがロードできページエラーが出ない", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(String(err)));
  await page.goto(APP_URL);
  await expect(page.locator("body")).toBeVisible();
  expect(errors).toEqual([]);
});

// このスモークは削除しないこと。機能テストは PLAN.md の受け入れ条件ごとに追記する

test("本のタイトルを入力して追加すると一覧に表示される", async ({ page }) => {
  await page.goto(APP_URL);
  await page.fill("#title-input", "ノルウェイの森");
  await page.click('#add-form button[type="submit"]');
  await expect(page.locator(".book-item .book-title")).toHaveText("ノルウェイの森");
});

test("空文字（空白のみを含む）のタイトルは追加できない", async ({ page }) => {
  await page.goto(APP_URL);
  await page.fill("#title-input", "   ");
  await page.click('#add-form button[type="submit"]');
  await expect(page.locator(".book-item")).toHaveCount(0);
  await expect(page.locator("#empty-message")).toBeVisible();
});

test("読了ボタンでステータスを切り替えられ見た目で区別できる", async ({ page }) => {
  await page.goto(APP_URL);
  await page.fill("#title-input", "海辺のカフカ");
  await page.click('#add-form button[type="submit"]');

  const item = page.locator(".book-item").first();
  await expect(item).not.toHaveClass(/done/);
  await item.locator(".toggle-done").click();
  await expect(item).toHaveClass(/done/);
  await expect(item.locator(".toggle-done")).toHaveText("未読に戻す");
  await expect(item.locator(".book-title")).toHaveCSS("text-decoration-line", "line-through");
});

test("読了ボタンをもう一度押すと未読に戻せる", async ({ page }) => {
  await page.goto(APP_URL);
  await page.fill("#title-input", "1Q84");
  await page.click('#add-form button[type="submit"]');

  const item = page.locator(".book-item").first();
  const toggle = item.locator(".toggle-done");
  await toggle.click();
  await expect(item).toHaveClass(/done/);
  await toggle.click();
  await expect(item).not.toHaveClass(/done/);
  await expect(toggle).toHaveText("読了");
});

test("リロード後も本の一覧とステータスが復元される", async ({ page }) => {
  await page.goto(APP_URL);
  await page.fill("#title-input", "ねじまき鳥クロニクル");
  await page.click('#add-form button[type="submit"]');
  await page.fill("#title-input", "騎士団長殺し");
  await page.click('#add-form button[type="submit"]');
  await page.locator(".book-item").nth(0).locator(".toggle-done").click();

  await page.reload();

  const items = page.locator(".book-item");
  await expect(items).toHaveCount(2);
  await expect(items.nth(0).locator(".book-title")).toHaveText("ねじまき鳥クロニクル");
  await expect(items.nth(0)).toHaveClass(/done/);
  await expect(items.nth(1).locator(".book-title")).toHaveText("騎士団長殺し");
  await expect(items.nth(1)).not.toHaveClass(/done/);
});

test("meta description があり content が空でない", async ({ page }) => {
  await page.goto(APP_URL);
  const content = await page.evaluate(
    () => document.querySelector('meta[name="description"]')?.getAttribute("content") ?? ""
  );
  expect(content.trim()).toBeTruthy();
});

test("JSON-LD に WebApplication の必須フィールドがある", async ({ page }) => {
  await page.goto(APP_URL);
  const raw = await page.evaluate(
    () => document.querySelector('script[type="application/ld+json"]')?.textContent ?? ""
  );
  expect(raw.trim()).toBeTruthy();

  const parsed = JSON.parse(raw);
  const nodes = collectJsonLdNodes(parsed);
  const app = nodes.find((node) => {
    const type = node["@type"];
    return type === "WebApplication" || (Array.isArray(type) && type.includes("WebApplication"));
  });

  expect(app).toBeTruthy();
  expect(String(app!.name ?? "").trim()).toBeTruthy();
  expect(String(app!.description ?? "").trim()).toBeTruthy();
  expect(String(app!.url ?? "").trim()).toBeTruthy();
  expect(String(app!.applicationCategory ?? "").trim()).toBeTruthy();
  expect(app!.offers?.price).toBe("0");
});

test("使い方と FAQ のセクションがページ上にある", async ({ page }) => {
  await page.goto(APP_URL);
  await expect(page.getByRole("heading", { name: "使い方" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "FAQ" })).toBeVisible();
});

test("1冊目を削除すると一覧とリロード後から消える", async ({ page }) => {
  await page.goto(APP_URL);
  await page.fill("#title-input", "一冊目");
  await page.click('#add-form button[type="submit"]');
  await page.fill("#title-input", "二冊目");
  await page.click('#add-form button[type="submit"]');

  await page.locator(".book-item").nth(0).locator(".delete-book").click();

  await expect(page.locator(".book-item")).toHaveCount(1);
  await expect(page.locator(".book-title")).toHaveText("二冊目");

  await page.reload();

  await expect(page.locator(".book-item")).toHaveCount(1);
  await expect(page.locator(".book-title")).toHaveText("二冊目");
  await expect(page.locator("body")).not.toContainText("一冊目");
});

test("最後の1冊を削除すると空メッセージが出る", async ({ page }) => {
  await page.goto(APP_URL);
  await page.fill("#title-input", "一冊目");
  await page.click('#add-form button[type="submit"]');

  await page.locator(".delete-book").click();

  await expect(page.locator(".book-item")).toHaveCount(0);
  await expect(page.locator("#empty-message")).toBeVisible();
});

test("読了本の削除を取り消すと位置と読了が残りリロード後も残る", async ({ page }) => {
  await page.goto(APP_URL);
  await page.fill("#title-input", "一冊目");
  await page.click('#add-form button[type="submit"]');
  await page.fill("#title-input", "二冊目");
  await page.click('#add-form button[type="submit"]');
  await page.locator(".book-item").nth(0).locator(".toggle-done").click();

  await page.locator(".book-item").nth(0).locator(".delete-book").click();
  await expect(page.locator("#undo-delete")).toBeVisible();
  await expect(page.locator("#undo-delete")).toHaveText("元に戻す");

  await page.locator("#undo-delete").click();

  const items = page.locator(".book-item");
  await expect(items).toHaveCount(2);
  await expect(items.nth(0).locator(".book-title")).toHaveText("一冊目");
  await expect(items.nth(0)).toHaveClass(/done/);
  await expect(items.nth(0).locator(".toggle-done")).toHaveText("未読に戻す");
  await expect(items.nth(0).locator(".book-title")).toHaveCSS(
    "text-decoration-line",
    "line-through"
  );

  await page.reload();

  const restored = page.locator(".book-item");
  await expect(restored).toHaveCount(2);
  await expect(restored.nth(0).locator(".book-title")).toHaveText("一冊目");
  await expect(restored.nth(0)).toHaveClass(/done/);
  await expect(restored.nth(0).locator(".toggle-done")).toHaveText("未読に戻す");
  await expect(restored.nth(0).locator(".book-title")).toHaveCSS(
    "text-decoration-line",
    "line-through"
  );
});

test("削除前とリロード後は元に戻すを出さない", async ({ page }) => {
  await page.goto(APP_URL);
  await expect(page.locator("#undo-delete")).toBeHidden();

  await page.fill("#title-input", "一冊目");
  await page.click('#add-form button[type="submit"]');
  await expect(page.locator("#undo-delete")).toBeHidden();

  await page.locator(".delete-book").click();
  await expect(page.locator("#undo-delete")).toBeVisible();

  await page.reload();
  await expect(page.locator("#undo-delete")).toBeHidden();
});

test("旧形式の localStorage データでもタイトルと読了状態を表示する", async ({ page }) => {
  await page.goto(APP_URL);
  await page.evaluate(() => {
    localStorage.setItem(
      "reading-list-books",
      JSON.stringify([{ id: "old-1", title: "旧データの本", done: true }])
    );
  });
  await page.reload();

  const item = page.locator(".book-item");
  await expect(item).toHaveCount(1);
  await expect(item.locator(".book-title")).toHaveText("旧データの本");
  await expect(item).toHaveClass(/done/);
  await expect(item.locator(".toggle-done")).toHaveText("未読に戻す");
});

function collectJsonLdNodes(parsed: unknown): Array<Record<string, any>> {
  if (Array.isArray(parsed)) {
    return parsed.flatMap(collectJsonLdNodes);
  }
  if (!parsed || typeof parsed !== "object") return [];
  const node = parsed as Record<string, any>;
  const graph = Array.isArray(node["@graph"]) ? node["@graph"].flatMap(collectJsonLdNodes) : [];
  return [node, ...graph];
}
