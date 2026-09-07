// QA mobile autocontenido: abre Chrome del sistema, loguea, audita una URL.
// Uso: node scripts/qa/audit.mjs <url> [shot.png]  (viewport 375x846)
// Lee credenciales de CREDENTIALS.md. Siempre termina (timeout forzado 100s).
import { readFileSync } from "node:fs";
import { chromium } from "playwright-core";

const url = process.argv[2] ?? "http://localhost:3000/zukkodev/portfolio";
const shot = process.argv[3] ?? "scripts/qa/last.png";
const kill = setTimeout(() => {
  console.log(JSON.stringify({ fatal: "timeout-forzado-100s" }));
  process.exit(2);
}, 100000);

const creds = readFileSync("CREDENTIALS.md", "utf8");
const email = creds.match(/Email:\s*(\S+)/)?.[1];
const password = creds.match(/Password:\s*(\S+)/)?.[1];
if (!email || !password) throw new Error("sin credenciales en CREDENTIALS.md");

const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 375, height: 846 } });
  await page.goto("http://localhost:3000/profesional/login", { timeout: 30000 });
  await page.getByPlaceholder("tu@email.com").fill(email, { timeout: 15000 });
  await page.getByPlaceholder(/nimo 8 caracteres/).fill(password, { timeout: 15000 });
  await page.getByRole("button", { name: "Ingresar" }).click({ timeout: 15000 });
  await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
  await page.goto(url, { timeout: 30000 });
  await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
  const data = await page.evaluate(() => {
    const se = document.scrollingElement;
    const vw = window.innerWidth;
    const bad = [];
    document.querySelectorAll("*").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.right > vw + 1 || r.left < -1) {
        bad.push(
          `${el.tagName}.${String(el.className || "").split(" ").slice(0, 4).join(".")}` +
            ` L${Math.round(r.left)} R${Math.round(r.right)}`
        );
      }
    });
    return { vw, docScrollW: se.scrollWidth, overflows: se.scrollWidth > vw, bad: bad.slice(0, 15) };
  });
  await page.screenshot({ path: shot });
  console.log(JSON.stringify(data));
} finally {
  await browser.close().catch(() => {});
  clearTimeout(kill);
}
