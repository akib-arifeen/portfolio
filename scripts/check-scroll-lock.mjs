#!/usr/bin/env node
/**
 * Browser regression for the overlays' page lock: opening the booth or the laptop must not move the
 * page behind them, and closing must put it back exactly where it was — every time.
 *
 * This is opt-in, not part of `npm test`: Playwright is not a project dependency. Run it against a
 * production build:
 *
 *   npm run build && npm start -- -p 3113 &
 *   PLAYWRIGHT_MODULE=/path/to/playwright node scripts/check-scroll-lock.mjs
 *
 * BASE overrides the URL (default http://localhost:3113).
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE ?? "playwright");

const BASE = process.env.BASE ?? "http://localhost:3113";
const failures = [];

function check(ok, message) {
  console.log(`  ${ok ? "ok  " : "FAIL"} ${message}`);
  if (!ok) failures.push(message);
}

const scrollY = (page) => page.evaluate(() => window.scrollY);
const settle = (page, ms = 400) => page.waitForTimeout(ms);

async function expectStill(page, expected, message) {
  const at = await scrollY(page);
  check(at === expected, `${message} (page at ${at}, expected ${expected})`);
}

/** Opens an overlay from the hero without letting Playwright scroll the button into view. */
async function openFromHero(page, text) {
  await page.evaluate((label) => {
    const button = [...document.querySelectorAll("button")].find((b) => b.textContent?.includes(label));
    if (!button) throw new Error(`no hero button matching ${label}`);
    button.click();
  }, text);
}

/** Scrolls the first scroller inside the overlay, to prove the lock did not take it away. */
async function scrollInside(page, selector) {
  return page.evaluate((sel) => {
    const root = document.querySelector(sel);
    if (!root) return { found: false };
    for (const el of [root, ...root.querySelectorAll("*")]) {
      if (el.scrollHeight <= el.clientHeight + 16) continue;
      const before = el.scrollTop;
      // the wheel and the keys may already have taken it to the bottom, so test whichever way is open
      el.scrollTop = before > 0 ? 0 : 120;
      const moved = el.scrollTop !== before;
      el.scrollTop = before;
      if (moved) return { found: true, tag: `${el.tagName.toLowerCase()}.${String(el.className).split(" ")[0]}` };
    }
    return { found: false };
  }, selector);
}

async function lockedOverlay(page, expected, { name, overlaySelector, close, requireInner = false }) {
  console.log(`\n${name}`);
  const locked = await page.evaluate(() => ({
    html: getComputedStyle(document.documentElement).overflow,
    body: getComputedStyle(document.body).overflow,
  }));
  check(locked.html === "hidden" && locked.body === "hidden", `document root and body are locked (html: ${locked.html}, body: ${locked.body})`);
  await expectStill(page, expected, "opening did not move the page");

  await page.mouse.move(640, 420);
  await page.mouse.wheel(0, 700);
  await settle(page);
  await expectStill(page, expected, "wheel over the overlay does not move the page");

  await page.keyboard.press("PageDown");
  await page.keyboard.press("End");
  await page.keyboard.press("ArrowDown");
  await settle(page);
  await expectStill(page, expected, "page keys do not move the page");

  const inner = await scrollInside(page, overlaySelector);
  if (inner.found) check(true, `the overlay still scrolls itself (${inner.tag})`);
  else if (requireInner) check(false, "the overlay should have a scrolling region at this viewport");
  else console.log("  skip  no scrolling region inside the overlay at this viewport");

  await close(page);
  await settle(page);
  await expectStill(page, expected, "closing puts the page back where it was");
  const restored = await page.evaluate(() => getComputedStyle(document.documentElement).overflow);
  check(restored !== "hidden", `the lock is released (html overflow: ${restored})`);
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /Open my laptop/ }).waitFor();
  await page.getByRole("button", { name: /Try the photo booth/ }).waitFor();

  // start well down the page, where a stray scroll is visible
  await page.evaluate(() => window.scrollTo(0, 1200));
  const start = await scrollY(page);
  check(start > 600, `page is scrolled to ${start} before the overlays open`);

  const openLaptop = async () => {
    await openFromHero(page, "Open my laptop");
    await page.locator(".desk [role='dialog'], .desk .os, .desk .os-phone").first().waitFor({ state: "visible" });
    await settle(page);
  };
  const deskGone = (p) => p.locator(".desk").waitFor({ state: "detached" });

  // 1 — the lock screen, the first thing a visitor sees, has its own way out
  await openLaptop();
  await page.locator(".os-lock__close").waitFor({ state: "visible" });
  await lockedOverlay(page, start, {
    name: "laptop · first open, closed from the lock screen",
    overlaySelector: ".desk",
    close: (p) => p.locator(".os-lock__close").click(),
  });
  await deskGone(page);

  // 2 — log in, then the menu bar's Close
  await openLaptop();
  await page.locator(".os-lock__btn").click();
  await page.locator(".os-lock").waitFor({ state: "hidden" });
  await lockedOverlay(page, start, {
    name: "laptop · logged in, closed from the menu bar",
    overlaySelector: ".desk",
    close: (p) => p.locator('button[aria-label="Close the laptop"]').click(),
  });
  await deskGone(page);

  // 3 — the session remembers the login: this open lands straight on the desktop
  for (const cycle of [1, 2]) {
    await openLaptop();
    check((await page.locator(".os-lock").count()) === 0, `reopen ${cycle} skips the lock screen`);
    await lockedOverlay(page, start, {
      name: `laptop · reopen ${cycle}`,
      overlaySelector: ".desk",
      close: (p) => p.locator('button[aria-label="Close the laptop"]').click(),
    });
    await deskGone(page);
  }

  for (const cycle of [1, 2, 3]) {
    await openFromHero(page, "Try the photo booth");
    await page.locator("dialog.booth-dialog[open]").waitFor({ state: "visible" });
    await settle(page);
    await lockedOverlay(page, start, {
      name: `booth · open/close ${cycle}`,
      overlaySelector: "dialog.booth-dialog",
      close: (p) => p.locator(".booth__away").click(),
    });
    await page.locator("dialog.booth-dialog[open]").waitFor({ state: "detached" }).catch(() => {});
  }

  // a short window: the booth's own panel has to scroll, and the lock must not stop it
  await page.setViewportSize({ width: 1280, height: 520 });
  await page.evaluate(() => window.scrollTo(0, 1200));
  const short = await scrollY(page);
  await openFromHero(page, "Try the photo booth");
  await page.locator("dialog.booth-dialog[open]").waitFor({ state: "visible" });
  await settle(page);
  await lockedOverlay(page, short, {
    name: `booth · short window (${short})`,
    overlaySelector: "dialog.booth-dialog",
    close: (p) => p.locator(".booth__away").click(),
    requireInner: true,
  });
  await page.locator("dialog.booth-dialog[open]").waitFor({ state: "detached" }).catch(() => {});

  // the phone, where Close has always been visible: the same lock has to hold there
  await page.setViewportSize({ width: 390, height: 780 });
  await page.evaluate(() => window.scrollTo(0, 1200));
  const phoneStart = await scrollY(page);
  await openFromHero(page, "Open my laptop");
  await page.locator(".desk .os-phone").waitFor({ state: "visible" });
  await settle(page);
  await lockedOverlay(page, phoneStart, {
    name: "laptop · phone shell",
    overlaySelector: ".desk",
    close: (p) => p.locator(".os-phone-close").click(),
  });
  await deskGone(page);
} catch (error) {
  failures.push(`script error: ${error.message}`);
  console.error(error);
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(`\n${failures.length} failed:`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("\nScroll lock holds for the laptop and the booth.");
