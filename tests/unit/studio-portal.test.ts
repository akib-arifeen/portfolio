import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { films } from "@/lib/media";
import { getWork } from "@/lib/work";

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const desk = read("components/desk/Desk.tsx");
const hero = read("components/Hero.tsx");
const portal = read("components/portal/ProjectPortal.tsx");
const projectApp = read("components/portal/ProjectApp.tsx");
const blogApp = read("components/portal/BlogApp.tsx");
const boothApp = read("components/portal/PhotoboothApp.tsx");
const shelf = read("components/portal/FilmShelf.tsx");
const sound = read("lib/sound.ts");

describe("the personal device workspace", () => {
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
    expect(desk).toContain("setTimeout(onClose, 140)");
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

  it("changes the physical device and workspace wording without changing the deep link", () => {
    expect(hero).toContain('matchMedia("(max-width: 47.99rem)")');
    expect(hero).toContain('phoneLayout === null ? "Open my workspace" : phoneLayout ? "Open my phone" : "Open my laptop"');
    expect(hero).toContain("phone={phoneLayout === true}");
    expect(hero).toContain("phoneLayout === null ? null");
    expect(desk).toContain('phone ? "phone" : "laptop"');
    expect(read("lib/hash-nav.ts")).toContain('"laptop"');
  });

  it("keeps the laptop and poses the avatar for a phone in the mobile scene", () => {
    const studio = read("components/studio/Studio.tsx");
    // without the avatar, hiding the laptop left the phone stage with an empty desk
    expect(studio).toContain('spot("laptop"');
    expect(studio).not.toContain("!phone ? spot");
    expect(studio).toContain('pose={phone ? "phone_idle" : "laptop_idle"}');
    expect(read("lib/studio/avatar.ts")).toContain('AVATAR_POSES = ["laptop_idle", "phone_idle"]');
  });
});

describe("workspace apps and natural Blogs", () => {
  it("opens projects as apps, not just outbound links", () => {
    expect(portal).toContain("openProject(project.id)");
    expect(portal).toContain("<ProjectApp");
    expect(projectApp).toContain("PlayFrame");
    expect(projectApp).toContain('"walkthrough" | "systems" | "evidence" | "live"');
  });

  it("keeps system facts and engineering judgment with the app", () => {
    expect(projectApp).toContain("href={`/blog/${project.slug}`}");
    expect(projectApp).toContain("work.role");
    expect(projectApp).toContain("work.stack.join");
    expect(projectApp).toContain("engineeringItems(work)");
    expect(projectApp).toContain("Trade-off:");
    expect(projectApp).toContain("/work/video-studio/create-screen.png");
  });

  it("uses first-person Blog framing", () => {
    expect(blogApp).toContain("blogEntries()");
    expect(blogApp).toContain("Read the Blog");
    expect(portal).not.toMatch(/case files/i);
    expect(read("app/blog/page.tsx")).toContain("Blogs and build notes");
    expect(read("components/home/WorkGrid.tsx")).toContain("Read the Blog");
  });

  it("mounts the real booth flow inside the workspace", () => {
    expect(boothApp).toContain("useBooth(true)");
    expect(boothApp).toContain("<BoothScreen");
    expect(boothApp).toContain("onStepAway");
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

describe("sound and the retired character", () => {
  it("defaults on but gates context creation and resume on a valid gesture", () => {
    expect(sound).toContain("enabled = true");
    expect(sound).toContain("!this.ctx && !this.gesture()");
    expect(sound).toContain("navigator.userActivation?.isActive === true");
    expect(sound).toContain("ctx.resume().catch");
  });

  it("persists preference and suspends hidden or torn-down audio", () => {
    expect(sound).toContain("window.localStorage.setItem(PREFERENCE_KEY");
    expect(sound).toContain('document.addEventListener("visibilitychange"');
    expect(sound).toContain('window.addEventListener("pagehide"');
    expect(sound).toContain("ctx.close().catch");
  });

  it("retires the code-built character instead of shipping it", () => {
    expect(() => read("components/studio/Akib.tsx")).toThrow();
    expect(read("components/studio/Studio.tsx")).not.toContain("Akib reducedMotion");
    expect(read("components/studio/Avatar.tsx")).toContain("EmptyStool");
  });

  it("uses the real laptop screen and no rear monitor", () => {
    const studio = read("components/studio/Studio.tsx");
    expect(studio).toContain("/work/video-studio/create-screen.png");
    expect(studio).not.toContain("function Monitor");
    expect(studio).not.toContain("spot(\"video\"");
    expect(studio).not.toContain("monitor-loop");
    expect(read("components/Hero.tsx")).not.toContain('"video", "lessons"');
  });
});
