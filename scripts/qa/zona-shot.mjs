// QA puntual: abre home, abre el selector de Ubicación, prueba un clic real en
// "Palermo" (mitad inferior de la lista, antes bloqueada por el chatbot) y
// captura el panel. Uso: node scripts/qa/zona-shot.mjs [w] [h]
import { chromium } from "playwright-core";

const W = Number(process.argv[2] ?? 1280);
const H = Number(process.argv[3] ?? 800);
const kill = setTimeout(() => {
  console.log(JSON.stringify({ fatal: "timeout-forzado-60s" }));
  process.exit(2);
}, 60000);

const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  await page.goto("http://localhost:3000/", { timeout: 30000 });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  const opened = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button")).filter(
      (b) =>
        (b.getAttribute("aria-label") === "Ubicación" || b.getAttribute("aria-label") === "Zona") &&
        b.getBoundingClientRect().width > 0
    );
    if (btns.length === 0) return false;
    btns[0].click();
    return true;
  });
  await page.waitForTimeout(1200);

  const panelInfo = await page.evaluate(() => {
    const panel = document.querySelector('[role="listbox"]')?.parentElement;
    if (!panel) return { panel: false };
    const pr = panel.getBoundingClientRect();
    const input = panel.querySelector("input");
    const ir = input?.getBoundingClientRect();
    let topOverInput = "";
    if (ir) {
      const el = document.elementFromPoint(ir.left + ir.width / 2, ir.top + ir.height / 2);
      topOverInput = el ? `${el.tagName}.${String(el.className).slice(0, 50)}` : "null";
    }
    return {
      panel: true,
      rect: { l: Math.round(pr.left), t: Math.round(pr.top), r: Math.round(pr.right), b: Math.round(pr.bottom) },
      topOverInput,
      vw: window.innerWidth,
    };
  });

  // clic real sobre "Palermo" (queda en la mitad inferior de la lista)
  let clickResult = { ok: false, triggerText: null, error: "" };
  try {
    const opt = page.locator('[role="option"]', { hasText: "Palermo" }).first();
    await opt.click({ timeout: 5000 });
    await page.waitForTimeout(400);
    const triggerText = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find(
        (b) => b.getAttribute("aria-label") === "Ubicación" && b.getBoundingClientRect().width > 0
      );
      return btn?.textContent?.trim() ?? null;
    });
    clickResult = { ok: triggerText === "Palermo", triggerText, error: "" };
  } catch (e) {
    clickResult = { ok: false, triggerText: null, error: String(e).slice(0, 120) };
  }

  // reabrir para la captura (el clic cierra el panel)
  if (clickResult.ok) {
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find(
        (b) => b.getAttribute("aria-label") === "Ubicación" && b.getBoundingClientRect().width > 0
      );
      btn?.click();
    });
    await page.waitForTimeout(800);
  }
  await page.screenshot({ path: "scripts/qa/zona-open.png" });
  console.log(JSON.stringify({ opened, ...panelInfo, clickResult }));
} finally {
  await browser.close().catch(() => {});
  clearTimeout(kill);
}
