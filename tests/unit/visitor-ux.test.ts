import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const read = (path: string) => readFileSync(`${ROOT}${path}`, "utf8");

/** Every .ts/.tsx file under a directory, as repo-relative paths. */
function sourcesUnder(dir: string): string[] {
  const out: string[] = [];
  const walk = (rel: string) => {
    for (const entry of readdirSync(`${ROOT}${rel}`, { withFileTypes: true })) {
      const path = `${rel}/${entry.name}`;
      if (entry.isDirectory()) walk(path);
      else if (/\.(ts|tsx)$/.test(entry.name)) out.push(path);
    }
  };
  walk(dir);
  return out;
}

describe("the page behind an overlay", () => {
  const lock = read("lib/use-scroll-lock.ts");

  it("locks the element that actually scrolls, not only the body", () => {
    expect(lock).toContain("document.documentElement");
    expect(lock).toContain('root.style.overflow = "hidden"');
    expect(lock).toContain('body.style.overflow = "hidden"');
  });

  it("remembers where the page was and puts it back exactly", () => {
    expect(lock).toContain("y: window.scrollY");
    expect(lock).toContain("if (window.scrollY !== y) window.scrollTo(0, y)");
  });

  it("counts the locks, so one overlay closing cannot unlock another", () => {
    expect(lock).toContain("locks += 1");
    expect(lock).toContain("if (locks > 0 || !saved) return;");
  });

  it("holds the scrollbar's width, so the page does not jump sideways", () => {
    expect(lock).toContain("window.innerWidth - root.clientWidth");
    expect(lock).toContain('root.style.paddingRight = `${gap}px`');
  });

  it("runs in both overlays", () => {
    for (const path of ["components/desk/Desk.tsx", "components/booth/BoothExperience.tsx"]) {
      expect(read(path), path).toContain('import { useScrollLock } from "@/lib/use-scroll-lock"');
      expect(read(path), path).toContain("useScrollLock();");
    }
  });
});

describe("closing the laptop with the mouse", () => {
  const bar = read("components/os/MenuBar.tsx");

  it("puts a labelled Close in the menu bar, not only in the menu", () => {
    expect(bar).toContain('className="os-bar-exit"');
    expect(bar).toContain('aria-label="Close the laptop"');
    expect(bar).toContain("onClick={onExit}");
  });

  it("takes that exit from the shell, the same one the menu uses", () => {
    expect(read("lib/os/types.ts")).toContain("onExit(): void;");
    expect(read("components/os/OsShell.tsx")).toContain("onExit={onExit}");
  });

  it("is at least 24px tall", () => {
    expect(read("components/os/os-chrome.css")).toMatch(/\.os-bar-exit \{[^}]*height: 24px/);
  });
});

describe("videos that play in place", () => {
  it("never hand a clip to the fullscreen player on a phone", () => {
    const offenders: string[] = [];
    // .tsx only: `<video` in a .ts file is prose, not an element
    for (const path of sourcesUnder("components").filter((p) => p.endsWith(".tsx"))) {
      for (const tag of read(path).match(/<video[\s\S]*?>/g) ?? []) {
        if (!tag.includes("playsInline")) offenders.push(`${path}: ${tag.slice(0, 70)}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe("a screenshot far wider than the frame", () => {
  const item = read("components/work/MediaItem.tsx");

  it("gets a frame of its own shape instead of bands of empty paper", () => {
    expect(item).toContain("item.w / item.h >= 3");
    expect(item).toContain("aspectRatio: `${item.w} / ${item.h}`");
  });

  it("still contains the picture, so nothing is cropped away", () => {
    expect(item).toContain('"media__el media__el--contain"');
  });
});

describe("the sound switch", () => {
  const toggle = read("components/SoundToggle.tsx");

  it("is one control with one exposed state", () => {
    expect(toggle).toContain("aria-pressed={isOn}");
    expect(toggle).toContain("studioSound.setEnabled(next)");
    expect(toggle).toContain('{isOn ? "Sound on" : "Sound off"}');
  });

  it("reads the shared state after hydration, never during render", () => {
    expect(toggle).toContain("useEffect(");
    expect(toggle).not.toMatch(/useState\(studioSound\.enabled\)/);
  });

  it("is on the studio and on every page after it", () => {
    expect(read("components/Hero.tsx")).toContain("<SoundToggle on={soundOn} onToggle={toggleSound} />");
    for (const path of ["app/blog/page.tsx", "app/projects/page.tsx", "app/profile/page.tsx"]) {
      const page = read(path);
      expect(page, path).toContain('import SoundToggle from "@/components/SoundToggle"');
      expect(page, path).toMatch(/<SiteNav current="\/[a-z]+">\s*<SoundToggle \/>/);
    }
  });
});

describe("the clock chip", () => {
  const hero = read("components/Hero.tsx");

  it("never pairs the real time with a light the visitor chose", () => {
    expect(hero).toContain("overridden: boolean");
    expect(hero).toContain("{overridden ? <>Light: {phase}</> : <>{time} · {phase}</>}");
    expect(hero).toContain("`Light: ${phase}, chosen by you. Change the light`");
    expect(hero).toContain("overridden={override !== null}");
  });
});

describe("canonical URLs", () => {
  it("names one URL per page, inside the metadata object each page already had", () => {
    expect(read("app/layout.tsx")).toContain('alternates: { canonical: "/" }');
    expect(read("app/blog/page.tsx")).toContain('alternates: { canonical: "/blog" }');
    expect(read("app/projects/page.tsx")).toContain('alternates: { canonical: "/projects" }');
    expect(read("app/profile/page.tsx")).toContain('alternates: { canonical: "/profile" }');
  });

  it("gives each case study and each playable its own URL", () => {
    expect(read("app/blog/[slug]/page.tsx")).toContain("alternates: { canonical: `/blog/${slug}` }");
    expect(read("app/play/[slug]/page.tsx")).toContain("alternates: { canonical: `/play/${slug}` }");
  });
});

describe("the proof band", () => {
  it("prints each number once in the DOM", () => {
    const count = read("components/home/CountUp.tsx");
    expect(count).not.toContain("visually-hidden");
    expect(count.match(/aria-hidden="true"/g)).toHaveLength(1);
  });

  it("still reads in full, through the link's own name", () => {
    expect(read("components/home/ProofBand.tsx")).toContain("aria-label={`${p.value} ${p.label} ${p.cue}`}");
  });
});
