// Records README GIFs from demo data only (no real faces, no API units spent).
// Needs the dev server: npx next dev -p 3100. Usage: node scripts/record-gifs.mjs [flowName]
import { mkdir, readdir, rm, rename } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const OUT = "docs/gifs";
const TMP = "docs/gifs/.tmp";
const VIEW = { width: 390, height: 780 };
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

async function smoothScroll(page, to, ms = 2200) {
  await page.evaluate(
    ([target, duration]) =>
      new Promise((done) => {
        const from = scrollY;
        const t0 = performance.now();
        const tick = (t) => {
          const k = Math.min(1, (t - t0) / duration);
          scrollTo(0, from + (target - from) * (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2));
          if (k < 1) requestAnimationFrame(tick);
          else done();
        };
        requestAnimationFrame(tick);
      }),
    [to, ms],
  );
}

const hideDevUi = (page) => page.addStyleTag({ content: "nextjs-portal{display:none!important}" });

const FLOWS = {
  // The landing page's scroll story.
  landing: async (page) => {
    await page.goto(`${BASE}/`);
    await hideDevUi(page);
    await pause(1800);
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    await smoothScroll(page, Math.min(h - 780, 3600), 9000);
    await pause(800);
  },
  // Demo trial: home → dashboard → verdict.
  trial: async (page) => {
    await page.goto(`${BASE}/demo`);
    await page.waitForURL("**/trials**");
    await hideDevUi(page);
    await pause(1800);
    await page.goto(`${BASE}/trial/demo-acne-serum`);
    await hideDevUi(page);
    await pause(2200);
    await smoothScroll(page, 620, 2500);
    await pause(700);
    await page.goto(`${BASE}/trial/demo-acne-serum/verdict`);
    await hideDevUi(page);
    await pause(2800);
  },
  // Irritation stop on a demo trial.
  stop: async (page) => {
    await page.goto(`${BASE}/demo`);
    await page.waitForURL("**/trials**");
    await page.goto(`${BASE}/trial/demo-glycolic-toner/verdict`);
    await hideDevUi(page);
    await pause(3000);
    await smoothScroll(page, 500, 2000);
    await pause(800);
  },
  // Onboarding and the wizard up to the coin flip (nothing leaves the device).
  onboarding: async (page) => {
    await page.goto(`${BASE}/welcome`);
    await hideDevUi(page);
    await pause(1500);
    for (let i = 0; i < 3; i++) {
      const next = page.getByRole("button", { name: /next|continue/i }).first();
      if (await next.isVisible().catch(() => false)) {
        await next.click();
        await pause(1100);
      }
    }
    await pause(1000);
  },
  // Skin Passport: money saved + patterns.
  passport: async (page) => {
    await page.goto(`${BASE}/demo`);
    await page.waitForURL("**/trials**");
    await page.goto(`${BASE}/passport`);
    await hideDevUi(page);
    await pause(2600);
    await smoothScroll(page, 500, 2000);
    await pause(800);
  },
  // Theme switch.
  theme: async (page) => {
    await page.goto(`${BASE}/settings`);
    await hideDevUi(page);
    await pause(1300);
    await page.getByRole("radio", { name: "Dark" }).click();
    await pause(1400);
    await page.getByRole("radio", { name: "Light" }).click();
    await pause(1200);
  },
};

const executablePath = `${process.env.HOME}/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome`;
await mkdir(TMP, { recursive: true });
const names = process.argv[2] ? [process.argv[2]] : Object.keys(FLOWS);
const browser = await chromium.launch({ executablePath });
for (const name of names) {
  const ctx = await browser.newContext({ viewport: VIEW, deviceScaleFactor: 1, recordVideo: { dir: TMP, size: VIEW } });
  const page = await ctx.newPage();
  await FLOWS[name](page);
  const video = await page.video().path();
  await ctx.close();
  await rename(video, `${TMP}/${name}.webm`);
  // Two-pass palette keeps gradients clean and files small.
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", `${TMP}/${name}.webm`, "-vf", "fps=12,scale=320:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle", `${OUT}/${name}.gif`]);
  console.log("wrote", `${OUT}/${name}.gif`);
}
await browser.close();
await rm(TMP, { recursive: true, force: true });
console.log((await readdir(OUT)).join(", "));
