import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { films } from "@/lib/media";
import { getWork } from "@/lib/work";

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const desk = read("components/desk/Desk.tsx");
const hero = read("components/Hero.tsx");
const portal = read("components/portal/ProjectPortal.tsx");
const shelf = read("components/portal/FilmShelf.tsx");

describe("the engineering laptop portal", () => {
  it("replaces the shells without deleting their production trees", () => {
    expect(desk).toContain("ProjectPortal");
    expect(desk).not.toContain("OsShell");
    expect(desk).not.toContain("PhoneShell");
    expect(read("components/os/OsShell.tsx")).toBeTruthy();
    expect(read("components/os/PhoneShell.tsx")).toBeTruthy();
  });

  it("keeps scroll lock, scoped inert background, Escape and a bounded close timer", () => {
    expect(desk).toContain("useScrollLock();");
    expect(desk).toContain("!root.current?.contains(el)");
    expect(desk).toContain("el.inert = true");
    expect(desk).toContain('event.key === "Escape"');
    expect(desk).toContain("setTimeout(onClose, 160)");
    expect(desk).toContain("clearTimeout(closeTimer.current)");
  });

  it("wraps focus in both directions", () => {
    expect(desk).toContain("document.addEventListener(\"keydown\", onKey)");
    expect(desk).toContain("event.shiftKey && (active === first || active === root.current)");
    expect(desk).toContain("!event.shiftKey && active === last");
  });

  it("opens content immediately without decorative object transitions", () => {
    const open = hero.slice(hero.indexOf("const openLaptop"), hero.indexOf("const openBooth"));
    expect(open).toContain("setDeskOpen(true)");
    expect(open).not.toContain("setTimeout");
    expect(hero).not.toContain("DoorTransition");
    expect(hero).not.toContain("doorOrigin");
  });

  it("puts system facts and engineering judgment before media", () => {
    expect(portal).toContain("getWork(project.slug)");
    expect(portal).toContain("href={`/blog/${project.slug}`}");
    expect(portal).toContain("data-status={work.status}");
    expect(portal).toContain("work.role");
    expect(portal).toContain("work.stack.join");
    expect(portal).toContain("engineeringItems(work)");
    expect(portal).toContain("Trade-off:");
    expect(portal.indexOf("portal-facts")).toBeLessThan(portal.indexOf("portal-project__media"));
    expect(portal).toContain("/work/video-studio/create-screen.png");
  });
});

describe("the sketchbook", () => {
  it("offers all four released films with native explicit playback", () => {
    expect(films.map((film) => film.slug)).toEqual(["eleven-doors", "golden-angle", "sand-song", "out-of-step"]);
    expect(shelf).toContain("films.map");
    expect(shelf).toContain("controls");
    expect(shelf).toContain("playsInline");
    expect(shelf).toContain('preload="none"');
    expect(shelf).not.toContain("autoPlay");
  });

  it("keeps source, making-of and download links outside the video", () => {
    expect(shelf).toContain("Source & making-of");
    expect(shelf).toContain("href={film.film}");
    expect(shelf).toContain("href={film.src} download");
    expect(shelf.indexOf("Source & making-of")).toBeGreaterThan(shelf.indexOf("</video>"));
  });

  it("publishes the collection without Paper Boat", () => {
    const work = getWork("code-drawn");
    expect(work).toBeDefined();
    expect(work?.links.map((link) => link.href)).toEqual(films.map((film) => film.film));
    expect(read("lib/cases/code-drawn.ts")).not.toMatch(/paper boat/i);
    expect(portal).toContain('href="/blog/code-drawn"');
  });
});

describe("the workstation evidence", () => {
  it("uses real product screens rather than playful film frames", () => {
    const studio = read("components/studio/Studio.tsx");
    expect(studio).toContain("/work/video-studio/create-screen.png");
    expect(studio).toContain("/work/lesson-pipeline/review-page.png");
    expect(studio).not.toContain("eleven-doors-poster.jpg");
  });
});
