import { describe, expect, it } from "vitest";
import { CATEGORIES, projectEntries, projectsIn, resolveShow } from "@/lib/projects";
import type { ProjectCategoryId } from "@/lib/projects";
import { allWorks, getWork } from "@/lib/work";

const IDS = CATEGORIES.map((c) => c.id);
const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

describe("the catalog", () => {
  it("lists every published case study exactly once", () => {
    const fromCatalog = projectEntries()
      .filter((p) => p.caseStudy)
      .map((p) => p.slug);
    expect(fromCatalog.sort()).toEqual(allWorks().map((w) => w.slug).sort());
  });

  it("lists each project once, under a kebab-case slug", () => {
    const slugs = projectEntries().map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug, slug).toMatch(KEBAB);
  });

  it("puts every project in exactly one known category", () => {
    for (const p of projectEntries()) {
      expect(IDS, p.slug).toContain(p.category);
    }
    const union = IDS.flatMap((id) => projectsIn(id as ProjectCategoryId).map((p) => p.slug));
    expect(union.sort()).toEqual(projectEntries().map((p) => p.slug).sort());
  });

  it("gives every category something to show", () => {
    for (const id of IDS) {
      expect(projectsIn(id as ProjectCategoryId).length, id).toBeGreaterThan(0);
    }
  });

  it("keeps the status the case study already claims", () => {
    for (const p of projectEntries()) {
      const work = getWork(p.slug);
      if (!work) continue;
      expect(p.status, p.slug).toBe(work.status);
    }
  });

  it("only uses statuses from the case-study vocabulary plus retired", () => {
    const allowed = ["shipped", "in production", "in progress", "concept", "prototype", "rebuilding", "retired"];
    for (const p of projectEntries()) {
      expect(allowed, p.slug).toContain(p.status);
    }
  });

  it("does not carry a case-study link to nowhere", () => {
    for (const p of projectEntries()) {
      if (p.caseStudy === undefined) continue;
      expect(p.caseStudy, p.slug).toBe(`/blog/${p.slug}`);
      expect(getWork(p.slug), p.slug).toBeDefined();
    }
  });

  it("only claims a playable slice where the case study has one", () => {
    for (const p of projectEntries()) {
      if (p.play === undefined) continue;
      expect(p.play, p.slug).toBe(`/play/${p.play.slice("/play/".length)}`);
      const work = getWork(p.slug);
      if (work) expect(p.play, p.slug).toBe(`/play/${work.playSlug}`);
    }
  });

  it("reads names and one-liners from the source record", () => {
    const booth = projectEntries().find((p) => p.slug === "photobooth");
    const work = getWork("photobooth");
    expect(booth?.name).toBe(work?.title);
    expect(booth?.line).toBe(work?.summary);
  });

  it("keeps the retired project with nothing to click", () => {
    const v1 = projectEntries().find((p) => p.slug === "portfolio-v1");
    expect(v1).toBeDefined();
    expect(v1?.status).toBe("retired");
    expect(v1?.caseStudy).toBeUndefined();
    expect(v1?.play).toBeUndefined();
  });
});

describe("resolveShow", () => {
  it("accepts the values that mean something", () => {
    expect(resolveShow(undefined)).toBe("all");
    expect(resolveShow("all")).toBe("all");
    for (const id of IDS) expect(resolveShow(id)).toBe(id);
    expect(resolveShow("media")).toBe("media");
  });

  it("falls back to everything for anything else", () => {
    expect(resolveShow("")).toBe("all");
    expect(resolveShow("nope")).toBe("all");
    expect(resolveShow("PRODUCTS")).toBe("all");
    expect(resolveShow("../games")).toBe("all");
  });
});

describe("categories", () => {
  it("gives each category a title and a blurb", () => {
    expect(IDS).toEqual(["products", "games", "experiments"]);
    for (const c of CATEGORIES) {
      expect(c.title.trim().length, c.id).toBeGreaterThan(0);
      expect(c.blurb.trim().length, c.id).toBeGreaterThan(0);
    }
  });
});
