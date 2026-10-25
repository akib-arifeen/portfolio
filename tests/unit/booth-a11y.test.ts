import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

const screen = read("components/booth/BoothScreen.tsx");
const photobooth = read("lib/cases/photobooth.ts");

describe("the countdown has one voice", () => {
  it("keeps the numeral out of the accessibility tree", () => {
    expect(screen).toContain('className="booth__count" key={b.count} aria-hidden="true"');
    expect(screen).not.toMatch(/booth__count[^>]*aria-live/);
  });

  it("leaves the panel's sentence as the only status in the countdown", () => {
    // one polite region for the developing facts, one status sentence for the countdown
    expect(screen.match(/aria-live=/g)).toHaveLength(1);
    expect(screen.match(/role="status"/g)).toHaveLength(1);
    expect(screen).toContain('<p className="booth__text" role="status">The shutter goes in {b.count}.</p>');
  });
});

describe("the booth's privacy copy is scoped to this site", () => {
  it("makes no absolute claim about storage", () => {
    expect(screen).not.toMatch(/Nothing is stored/);
    expect(screen).not.toMatch(/Nothing you take is stored/);
  });

  it("says what the site does and names the service that gets the photo", () => {
    expect(screen).toContain("Nothing you take is kept by this site.");
    expect(screen).toContain("This site stores nothing; the AI service handles the photo for the restyle.");
    expect(screen).toContain("your photo goes once to kie.ai");
  });
});

describe("the booth screenshots are described as they are", () => {
  it("marks the red cabinet as the earlier build rather than the live booth", () => {
    expect(photobooth).toContain("the booth's earlier red cabinet");
    expect(photobooth).toContain("the earlier red-booth build");
    expect(photobooth).not.toMatch(/held in front of the red booth/);
    expect(photobooth).not.toMatch(/with the red photobooth marked PHOTOS beside a plant/);
  });
});
