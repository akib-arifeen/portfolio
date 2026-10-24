import { describe, expect, it } from "vitest";
import { getPost, posts, publishedPosts } from "@/lib/posts";
import type { Post } from "@/lib/posts";
import { getWork } from "@/lib/work";

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const fixture = (slug: string, date: string): Post => ({
  slug,
  title: slug,
  date,
  summary: "inline fixture",
  blocks: [{ kind: "prose", paras: ["inline fixture"] }],
  relatedWork: "photobooth",
});

/** Add inline fixtures to the live registry and always take them back off. */
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

const published = () => publishedPosts();

describe("publishedPosts", () => {
  it("holds the three planned slugs", () => {
    expect(published().map((p) => p.slug).sort()).toEqual([
      "the-queue-that-waits-for-ram",
      "the-room-had-no-bright-pixels",
      "when-the-photo-booth-had-to-just-work",
    ]);
  });

  it("has unique kebab-case slugs", () => {
    const slugs = published().map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(KEBAB);
  });

  it("uses ISO YYYY-MM-DD dates that are real calendar days", () => {
    for (const p of published()) {
      expect(p.date, p.slug).toMatch(ISO_DATE);
      const d = new Date(`${p.date}T00:00:00Z`);
      expect(Number.isNaN(d.getTime()), p.slug).toBe(false);
      expect(d.toISOString().slice(0, 10), p.slug).toBe(p.date);
    }
  });

  it("is newest first", () => {
    const dates = published().map((p) => p.date);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it("sorts newest first across inline fixtures with distinct dates", () => {
    const fixtures = [
      fixture("zzz-oldest", "2020-01-01"),
      fixture("zzz-newest", "2030-12-31"),
      fixture("zzz-middle", "2025-06-15"),
    ];
    withPosts(fixtures, () => {
      const dates = published().map((p) => p.date);
      expect(dates).toEqual([...dates].sort().reverse());
      expect(published()[0].slug).toBe("zzz-newest");
      expect(published().at(-1)?.slug).toBe("zzz-oldest");
    });
  });

  it("excludes drafts", () => {
    const draft: Post = { ...fixture("zzz-draft", "2030-01-01"), draft: true };
    withPosts([draft], () => {
      expect(published().map((p) => p.slug)).not.toContain("zzz-draft");
    });
  });

  it("gives every post at least one prose block", () => {
    for (const p of published()) {
      expect(p.blocks.some((b) => b.kind === "prose"), p.slug).toBe(true);
    }
  });
});

describe("getPost", () => {
  it("finds a published post by slug", () => {
    const p = getPost("the-room-had-no-bright-pixels");
    expect(p?.slug).toBe("the-room-had-no-bright-pixels");
    expect(p?.blocks.length).toBeGreaterThan(0);
  });

  it("returns undefined for an unknown slug", () => {
    expect(getPost("no-such-post")).toBeUndefined();
  });

  it("returns undefined for a draft slug", () => {
    const draft: Post = { ...fixture("zzz-draft", "2030-01-01"), draft: true };
    withPosts([draft], () => {
      expect(getPost("zzz-draft")).toBeUndefined();
    });
  });
});

describe("post links", () => {
  it("points every relatedWork at a published case study", () => {
    for (const p of published()) {
      expect(getWork(p.relatedWork), `${p.slug} -> ${p.relatedWork}`).toBeDefined();
    }
  });

  it("uses HTTPS for every liveUrl", () => {
    for (const p of published()) {
      if (p.liveUrl === undefined) continue;
      expect(p.liveUrl, p.slug).toMatch(/^https:\/\/\S+$/);
      expect(() => new URL(p.liveUrl as string), p.slug).not.toThrow();
    }
  });

  it("has no public live link on the queue and photo booth essays", () => {
    expect(getPost("the-queue-that-waits-for-ram")?.liveUrl).toBeUndefined();
    expect(getPost("when-the-photo-booth-had-to-just-work")?.liveUrl).toBeUndefined();
  });
});
