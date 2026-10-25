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

describe("the retired route trees", () => {
  it("no longer ships /work or /writing page files", () => {
    for (const dir of ["app/work", "app/writing"]) {
      expect(() => readdirSync(`${ROOT}${dir}`), dir).toThrow();
    }
  });

  it("keeps the redirects that make the old URLs work", () => {
    const config = read("next.config.mjs");
    for (const source of ["/work", "/writing"]) {
      expect(config, source).toContain(`source: "${source}", destination: "/blog", permanent: true`);
    }
    for (const source of ["/work/:slug", "/writing/:slug"]) {
      expect(config, source).toContain(`source: "${source}", destination: "/blog/:slug", permanent: true`);
    }
  });

  it("leaves no code importing the removed routes", () => {
    const files = [...sourcesUnder("app"), ...sourcesUnder("components"), ...sourcesUnder("lib"), ...sourcesUnder("tests")];
    const offenders = files.filter((path) => /from\s+["'][^"']*app\/(work|writing)/.test(read(path)));
    expect(offenders).toEqual([]);
  });

  it("points the README at /blog instead", () => {
    const readme = read("README.md");
    expect(readme).toContain("/blog/<slug>");
    expect(readme).not.toContain("/work/<slug>");
    expect(readme).not.toContain("/writing/");
    expect(readme).not.toContain("work/         case study index");
  });
});

describe("copy that used to pin a count", () => {
  it("does not hardcode how many essays there are", () => {
    const page = read("app/blog/page.tsx");
    expect(page).not.toMatch(/Three shorter pieces/);
    expect(page).not.toMatch(/\b(three|four|five|six) (shorter pieces|essays)/i);
  });
});
