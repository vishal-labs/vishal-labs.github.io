// Captures the link-preview cards (public/og.png, public/og-resume.png) as real frames of
// the built site, so a shared link shows the loom itself. Run against any served build:
//   npm run og                       (defaults to the local container on :8088)
//   npm run og -- http://localhost:4173/
// Needs a local Chrome; set CHROME to its binary if it isn't in the usual macOS place.
import { chromium } from "playwright-core";

const base = process.argv[2] || "http://127.0.0.1:8088/";
const executablePath = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser = await chromium.launch({ executablePath, headless: true });
const page = await (await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, colorScheme: "dark" })).newPage();

// the hero: the name on its band, the harness of services, the cloth being woven
await page.goto(base, { waitUntil: "networkidle" });
// a card isn't interactive: no hover hint, no sound toggle
await page.addStyleTag({ content: ".thread-reading, .sound-toggle { visibility: hidden; }" });
await page.waitForTimeout(2500);
await page.screenshot({ path: "public/og.png" });

// the résumé: the head of the loom card
await page.goto(new URL("resume/", base).href, { waitUntil: "networkidle" });
await page.addStyleTag({ content: ".resume-bar { visibility: hidden; }" });
await page.waitForTimeout(500);
await page.screenshot({ path: "public/og-resume.png" });

await browser.close();
console.log("wrote public/og.png and public/og-resume.png");
