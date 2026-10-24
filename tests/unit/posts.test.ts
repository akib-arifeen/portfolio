import { describe, expect, it } from "vitest";
import { formatPostDate, getPost, posts, publishedPosts } from "@/lib/posts";
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

describe("formatPostDate", () => {
  it("writes an ISO date as a readable header date", () => {
    expect(formatPostDate("2026-10-24")).toBe("24 October 2026");
    expect(formatPostDate("2026-01-01")).toBe("1 January 2026");
  });
});

/** Every string a reader can see on a post: title, summary, headings and block text. */
const visibleCopy = (p: Post): string[] => {
  const out: string[] = [p.title, p.summary];
  for (const b of p.blocks) {
    if (b.heading) out.push(b.heading);
    switch (b.kind) {
      case "prose":
        out.push(...b.paras);
        break;
      case "steps":
        for (const i of b.items) out.push(i.title, i.body);
        break;
      case "decisions":
        for (const i of b.items) out.push(i.choice, i.why, i.cost);
        break;
      case "facts":
        for (const i of b.items) out.push(i.value, i.label, i.note ?? "");
        break;
      case "media":
        for (const i of b.items) out.push(i.kind === "image" ? i.alt : "", i.caption ?? "");
        break;
      case "code":
        out.push(b.caption, b.source);
        break;
    }
  }
  return out;
};

const copyOf = (slug: string): string => {
  const p = getPost(slug);
  expect(p, slug).toBeDefined();
  return visibleCopy(p as Post).join("\n");
};

/** Prose paragraphs only, which is where the essay itself lives. */
const bodyOf = (p: Post): string =>
  p.blocks.flatMap((b) => (b.kind === "prose" ? b.paras : [])).join(" ");

const wordCount = (s: string): number => s.split(/\s+/).filter((w) => w.length > 0).length;

const GENERIC_CASE_HEADINGS = ["What I learned", "What I would do differently", "What broke"];

describe("editorial invariants", () => {
  it("uses no em dash, en dash or emoji in visible copy", () => {
    const dash = /[\u2013\u2014]/;
    const emoji = /\p{Extended_Pictographic}/u;
    const variationSelector = /\uFE0F/;
    for (const p of published()) {
      for (const s of visibleCopy(p)) {
        expect(dash.test(s), `${p.slug}: ${s}`).toBe(false);
        expect(emoji.test(s), `${p.slug}: ${s}`).toBe(false);
        expect(variationSelector.test(s), `${p.slug}: ${s}`).toBe(false);
      }
    }
  });

  it("leaves no scaffolding copy", () => {
    for (const p of published()) {
      const all = visibleCopy(p).join("\n");
      expect(all, p.slug).not.toMatch(/scaffolding/i);
      expect(all, p.slug).not.toMatch(/Task [13]/);
    }
  });

  it("runs between 350 and 550 words of body copy", () => {
    for (const p of published()) {
      const n = wordCount(bodyOf(p));
      expect(n, `${p.slug}: ${n} words`).toBeGreaterThanOrEqual(350);
      expect(n, `${p.slug}: ${n} words`).toBeLessThanOrEqual(550);
    }
  });

  it("does not reuse the generic case-study headings", () => {
    for (const p of published()) {
      const headings = p.blocks.map((b) => b.heading).filter((h): h is string => Boolean(h));
      for (const h of headings) expect(GENERIC_CASE_HEADINGS, `${p.slug}: ${h}`).not.toContain(h);
    }
  });

  it("keeps the SYP measurements in the SYP essay only", () => {
    const syp = copyOf("the-room-had-no-bright-pixels");
    for (const value of ["0.00%", "2.73%", "237"]) expect(syp, value).toContain(value);
    expect(syp).toMatch(/\b76\b/);

    for (const slug of ["the-queue-that-waits-for-ram", "when-the-photo-booth-had-to-just-work"]) {
      const other = copyOf(slug);
      for (const value of ["0.00%", "2.73%", "237"]) expect(other, `${slug}: ${value}`).not.toContain(value);
      expect(other, `${slug}: p99`).not.toMatch(/p99/);
      expect(other, `${slug}: 76`).not.toMatch(/\b76\b/);
    }
  });

  it("gives the queue essay no queue metric and no speedup figure", () => {
    const queue = copyOf("the-queue-that-waits-for-ram");
    expect(queue).not.toMatch(/433/);
    expect(queue).not.toMatch(/\b99\s*s\b/);
    expect(queue).not.toMatch(/%/);
    expect(queue).not.toMatch(/faster|speedup|speed-up/i);
  });

  it("states the photo booth attendance as the recorded range", () => {
    const booth = copyOf("when-the-photo-booth-had-to-just-work");
    expect(booth).toContain("200-300");
    // "200-300 guests" is the range; a bare "300 guests" would be the precise claim the record does not support.
    expect(booth).not.toMatch(/(?<!-)300 guests/);
    expect(booth).not.toMatch(/300-person|exactly 300/i);
  });
});

/** Copy sentences, so an attribution can be checked within one sentence rather than across a paragraph. */
const sentences = (s: string): string[] => s.split(/(?<=[.!?])\s+/).filter((x) => x.trim().length > 0);

describe("evidence guards", () => {
  it("does not give ComfyUI the narration or the captions", () => {
    const queue = copyOf("the-queue-that-waits-for-ram");
    for (const s of sentences(queue)) {
      if (/narration|caption/i.test(s)) {
        expect(s, `ComfyUI shares a sentence with narration or captions: ${s}`).not.toMatch(/ComfyUI/i);
      }
    }
    // The other two halves of that split are named where they belong.
    expect(queue).toMatch(/Chatterbox/);
    expect(queue).toMatch(/Whisper/);
  });

  it("does not attribute a first implementation of the render queue", () => {
    const queue = copyOf("the-queue-that-waits-for-ram");
    expect(queue).not.toMatch(/first version|my first|I originally/i);
  });

  it("does not generalize about speed figures elsewhere on the site", () => {
    const queue = copyOf("the-queue-that-waits-for-ram");
    expect(queue).not.toMatch(/speed figure|elsewhere on this site|borrow a number/i);
  });

  it("keeps the SYP essay off unmeasured brightness, derived arithmetic and commit hashes", () => {
    const syp = copyOf("the-room-had-no-bright-pixels");
    expect(syp).not.toMatch(/brightest/i);
    expect(syp).not.toMatch(/\b255\b/);
    // A seven-character hex token is a commit hash in prose, not a claim a reader can check in the copy.
    expect(syp).not.toMatch(/\b[0-9a-f]{7}\b/);
  });

  it("does not invent a queue of guests or an exact attendance lift", () => {
    const booth = copyOf("when-the-photo-booth-had-to-just-work");
    expect(booth).not.toMatch(/\bqueue\b/i);
    expect(booth).not.toMatch(/not a developer machine/i);
  });

  it("does not assert an observed guest reaction", () => {
    const booth = copyOf("when-the-photo-booth-had-to-just-work");
    expect(booth).not.toMatch(/guest(s)? (sees|saw|reacts?|notices)/i);
  });

  it("qualifies the loopback binding as a default", () => {
    const booth = copyOf("when-the-photo-booth-had-to-just-work");
    expect(booth).toMatch(/binds to loopback by default/);
    expect(booth).not.toMatch(/loopback only/i);
  });
});
