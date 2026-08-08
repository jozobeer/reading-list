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
