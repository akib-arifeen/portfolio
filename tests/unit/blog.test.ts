import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { blogEntries, blogHref, caseEntries, essayEntries, getBlogItem } from "@/lib/blog";
import { posts, publishedPosts } from "@/lib/posts";
import type { Post } from "@/lib/posts";
import { allWorks } from "@/lib/work";

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Add an inline fixture to the live registry and always take it back off. */
const withPosts = <T,>(fixtures: Post[], run: () => T): T => {
  posts.push(...fixtures);
  try {
    return run();
  } finally {
    for (const f of fixtures) {
      const i = posts.indexOf(f);
      if (i !== -1) posts.splice(i, 1);
    }
  }
};

const draftEssay = (slug: string): Post => ({
  slug,
  title: "inline fixture",
  date: "2030-01-01",
  summary: "inline fixture",
  blocks: [{ kind: "prose", paras: ["inline fixture"] }],
  relatedWork: "photobooth",
  draft: true,
});

describe("the union", () => {
  it("holds every published case study exactly once", () => {
    const slugs = caseEntries().map((c) => c.slug);
    expect(slugs).toEqual(allWorks().map((w) => w.slug));
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("holds every published essay exactly once", () => {
    const slugs = essayEntries().map((e) => e.slug);
    expect(slugs).toEqual(publishedPosts().map((p) => p.slug));
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("never shares a slug between a case study and an essay", () => {
    const cases = new Set(caseEntries().map((c) => c.slug));
    const collisions = essayEntries().filter((e) => cases.has(e.slug)).map((e) => e.slug);
    expect(collisions).toEqual([]);
    const all = blogEntries().map((e) => e.slug);
    expect(new Set(all).size).toBe(all.length);
  });

  it("puts cases before essays", () => {
    const kinds = blogEntries().map((e) => e.kind);
    expect(kinds.indexOf("essay")).toBe(kinds.lastIndexOf("case") + 1);
  });
});

describe("entries", () => {
  it("gives every entry a kebab-case slug and its /blog href", () => {
    for (const e of blogEntries()) {
      expect(e.slug, e.slug).toMatch(KEBAB);
      expect(e.href, e.slug).toBe(`/blog/${e.slug}`);
      expect(blogHref(e.slug), e.slug).toBe(e.href);
    }
  });

  it("gives every entry a title, a summary and a kicker", () => {
    for (const e of blogEntries()) {
      expect(e.title.trim().length, e.slug).toBeGreaterThan(0);
      expect(e.summary.trim().length, e.slug).toBeGreaterThan(0);
      expect(e.kicker.trim().length, e.slug).toBeGreaterThan(0);
    }
  });

  it("gives every case a cover, a status and no date", () => {
    for (const c of caseEntries()) {
      expect(c.cover, c.slug).toBeDefined();
      expect(c.status, c.slug).toBeTruthy();
      expect(c.date, c.slug).toBeUndefined();
    }
  });

  it("gives every essay an ISO date and no cover", () => {
    for (const e of essayEntries()) {
      expect(e.date, e.slug).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(e.cover, e.slug).toBeUndefined();
      expect(e.status, e.slug).toBeUndefined();
    }
  });

  it("keeps the outcome figure a case study already had", () => {
    const booth = caseEntries().find((c) => c.slug === "photobooth");
    expect(booth?.outcome).toEqual({ value: "200 to 300 guests", note: "per event, SCMUN 2026 and the AAI dinner" });
  });

  it("hides a draft essay", () => {
    withPosts([draftEssay("zzz-draft-essay")], () => {
      expect(essayEntries().map((e) => e.slug)).not.toContain("zzz-draft-essay");
      expect(getBlogItem("zzz-draft-essay")).toBeUndefined();
    });
  });
});

describe("getBlogItem", () => {
  it("resolves every index entry to a page of the same kind", () => {
    for (const e of blogEntries()) {
      const item = getBlogItem(e.slug);
      expect(item, e.slug).toBeDefined();
      expect(item?.kind, e.slug).toBe(e.kind);
      expect(item?.href, e.slug).toBe(e.href);
    }
  });

  it("carries the source record the template renders", () => {
    const c = getBlogItem("video-studio");
    expect(c?.kind).toBe("case");
    if (c?.kind === "case") {
      expect(c.work.title).toBe("AI video generation platform");
      expect(c.work.blocks.length).toBeGreaterThan(0);
    }

    const e = getBlogItem("the-queue-that-waits-for-ram");
    expect(e?.kind).toBe("essay");
    if (e?.kind === "essay") {
      expect(e.post.date).toBe("2026-10-24");
      expect(e.post.blocks.length).toBeGreaterThan(0);
    }
  });

  it("returns undefined for an unknown slug", () => {
    expect(getBlogItem("no-such-page")).toBeUndefined();
    expect(getBlogItem("")).toBeUndefined();
  });
});

describe("old URLs", () => {
  const config = readFileSync(new URL("../../next.config.mjs", import.meta.url), "utf8");

  it("sends /work and /writing to /blog, permanently", () => {
    for (const source of ["/work", "/writing"]) {
      expect(config, source).toContain(`source: "${source}", destination: "/blog", permanent: true`);
    }
  });

  it("sends one slug to the same slug on /blog", () => {
    for (const source of ["/work/:slug", "/writing/:slug"]) {
      expect(config, source).toContain(`source: "${source}", destination: "/blog/:slug", permanent: true`);
    }
  });

  it("keeps the CV redirect it had before", () => {
    expect(config).toContain(
      'source: "/Akib_Arifeen_Resume.pdf", destination: "/akib-arifeen-cv.pdf", permanent: false',
    );
  });
});
