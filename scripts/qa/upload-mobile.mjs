// QA mobile subida directa: portfolio (sin guardar publicación).
// Uso: node scripts/qa/upload-mobile.mjs <video.mp4>
import { readFileSync } from "node:fs";
import { chromium } from "playwright-core";

const video = process.argv[2];
const BASE = process.env.BASE ?? "http://localhost:3000";
const kill = setTimeout(() => { console.log(JSON.stringify({ fatal: "timeout-150s" })); process.exit(2); }, 150000);

const creds = readFileSync("CREDENTIALS.md", "utf8");
const email = creds.match(/Email:\s*(\S+)/)?.[1];
const password = creds.match(/Password:\s*(\S+)/)?.[1];

const browser = await chromium.launch({ channel: "chrome", headless: true });
const log = [];
try {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 846 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  page.on("response", (r) => {
    const u = r.url();
    if (u.includes("upload-image") || u.includes("/storage/v1/") || u.includes("/api/profesional/video"))
      log.push(`${r.request().method()} ${u.split("?")[0].slice(-70)} -> ${r.status()}`);
  });
  page.on("console", (m) => { if (m.type() === "error") log.push(`console: ${m.text().slice(0, 150)}`); });

  await page.goto(`${BASE}/profesional/login`, { timeout: 30000 });
  await page.getByPlaceholder("tu@email.com").fill(email);
  await page.getByPlaceholder(/nimo 8 caracteres/).fill(password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
  await page.goto(`${BASE}/profesional/dashboard/perfil/zukkodev`, { timeout: 60000 });
  await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});

  await page.getByRole("button", { name: "Nueva publicación" }).tap();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ timeout: 15000 });
  await dialog.locator('input[type="file"]').setInputFiles(video);
  // espera preview del video subido
  await dialog.getByRole("textbox", { name: "Título del archivo" }).first().waitFor({ timeout: 90000 });
  const toasts = await page.locator("[data-sonner-toast]").allInnerTexts();
  await page.screenshot({ path: "scripts/qa/upload-portfolio-mobile.png" });
  const submit = dialog.getByRole("button", { name: "Crear publicación" });
  console.log(JSON.stringify({ ok: true, submitEnabled: await submit.isEnabled(), toasts, log }, null, 1));
} catch (e) {
  console.log(JSON.stringify({ ok: false, error: String(e).slice(0, 300), log }, null, 1));
} finally {
  await browser.close().catch(() => {});
  clearTimeout(kill);
}
