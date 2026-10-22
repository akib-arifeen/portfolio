import { notes, photos } from "@/lib/desk";
import { allWorks, getWork } from "@/lib/work";
import { describe, expect, it } from "vitest";
import { apps } from "@/lib/os/apps";
import { KIND_ORDER, buildIndex, fold, searchItems } from "@/lib/os/search";
import type { SearchItem, SearchKind } from "@/lib/os/types";

function item(id: string, title: string, over: Partial<SearchItem> = {}): SearchItem {
  return { id, kind: "app", title, action: { type: "search" }, ...over };
}
const ids = (xs: SearchItem[]) => xs.map((x) => x.id);

describe("KIND_ORDER", () => {
  it("is the documented tie-break order", () => {
    expect([...KIND_ORDER]).toEqual(["app", "project", "page", "note", "file", "photo", "site", "command"]);
  });
});

describe("fold", () => {
  it("documented example", () => {
    expect(fold("  Léyci  Store ")).toBe("leyci store");
  });
  it("lowercases and strips combining marks", () => {
    expect(fold("ÀÉÎõü")).toBe("aeiou");
    expect(fold("Crème Brûlée")).toBe("creme brulee");
  });
  it("collapses all whitespace and trims", () => {
    expect(fold("A\tB\nC   D")).toBe("a b c d");
    expect(fold("   ")).toBe("");
    expect(fold("")).toBe("");
  });
});

describe("searchItems: empty queries", () => {
  const items = [item("a", "Notes")];
  it("empty and whitespace-only queries return []", () => {
    expect(searchItems("", items)).toEqual([]);
    expect(searchItems("   ", items)).toEqual([]);
    expect(searchItems("\t\n", items)).toEqual([]);
  });
  it("no items returns []", () => {
    expect(searchItems("notes", [])).toEqual([]);
  });
  it("no match returns []", () => {
    expect(searchItems("zzzz", items)).toEqual([]);
  });
});

describe("searchItems: score tiers", () => {
  // Every item shares kind "app", so only the score decides order.
  const tiers = [
    item("eq", "notes"),
    item("starts", "Notes app"),
    item("wordstart", "My notes"),
    item("contains", "Footnotes"),
    item("keyword", "Zed", { keywords: ["notestaking"] }),
    item("subtitle", "Zzz", { subtitle: "has notes inside" }),
    item("none", "Other", { subtitle: "nothing here", keywords: ["unrelated"] }),
  ];

  it("ranks equals > starts > word-start > contains > keyword > subtitle, and drops non-matches", () => {
    const r = searchItems("notes", tiers);
    expect(ids(r)).toEqual(["eq", "starts", "wordstart", "contains", "keyword", "subtitle"]);
  });

  it("ranking does not depend on input order", () => {
    const r = searchItems("notes", [...tiers].reverse());
    expect(ids(r)).toEqual(["eq", "starts", "wordstart", "contains", "keyword", "subtitle"]);
  });

  it("score beats kind order", () => {
    const items: SearchItem[] = [
      item("lowscore-app", "Zzz", { kind: "app", subtitle: "has notes inside" }),
      item("highscore-command", "Notes", { kind: "command" }),
    ];
    expect(ids(searchItems("notes", items))).toEqual(["highscore-command", "lowscore-app"]);
  });

  it("matching is case- and accent-insensitive on both sides", () => {
    const items = [item("a", "Léyci Store")];
    expect(ids(searchItems("LEYCI", items))).toEqual(["a"]);
    expect(ids(searchItems("léyci", items))).toEqual(["a"]);
    expect(ids(searchItems("  leyci   ", items))).toEqual(["a"]);
    expect(ids(searchItems("store", [item("b", "LEYCI STORE")]))).toEqual(["b"]);
  });

  it("an equal title beats a prefix match", () => {
    const r = searchItems("mail", [item("pre", "Mailbox"), item("eq", "Mail")]);
    expect(ids(r)).toEqual(["eq", "pre"]);
  });

  it("keywords only match by prefix", () => {
    const items = [item("k", "Zed", { keywords: ["terminal"] })];
    expect(ids(searchItems("term", items))).toEqual(["k"]);
    expect(ids(searchItems("minal", items))).toEqual([]);
  });

  it("subtitle matches by containment", () => {
    const items = [item("s", "Zed", { subtitle: "a quick lookup tool" })];
    expect(ids(searchItems("lookup", items))).toEqual(["s"]);
    expect(ids(searchItems("ookup", items))).toEqual(["s"]);
  });

  it("returns the original item objects", () => {
    const a = item("a", "Notes");
    expect(searchItems("notes", [a])[0]).toBe(a);
  });

  it("does not mutate or reorder the input", () => {
    const input = [...tiers].reverse();
    const copy = [...input];
    searchItems("notes", input);
    expect(input).toEqual(copy);
  });
});

describe("searchItems: multiple words", () => {
  it("requires every word to score", () => {
    const items = [item("both", "Creative AI Agent Quest"), item("one", "Agent Smith"), item("other", "Quest Log")];
    expect(ids(searchItems("agent quest", items))).toEqual(["both"]);
  });

  it("words may match in different fields", () => {
    const items = [item("x", "Quest log", { subtitle: "agent diary" })];
    expect(ids(searchItems("quest agent", items))).toEqual(["x"]);
  });

  it("sums the per-word scores and ranks by the total", () => {
    const items = [
      item("c-subtitle", "Quest log", { subtitle: "agent diary" }), // 80 + 15
      item("b-prefix", "Agent Quest Deluxe"), // 80 + 60
      item("a-equals", "Agent Quest"), // title === whole query
    ];
    expect(ids(searchItems("agent quest", items))).toEqual(["a-equals", "b-prefix", "c-subtitle"]);
  });

  it("word order in the query does not drop matches", () => {
    const items = [item("a", "Creative AI Agent Quest")];
    expect(ids(searchItems("quest agent", items))).toEqual(["a"]);
  });
});

describe("searchItems: tie-breaks", () => {
  it("equal scores sort by KIND_ORDER", () => {
    const kinds: SearchKind[] = ["command", "site", "photo", "file", "note", "page", "project", "app"];
    const items = kinds.map((k) => item(`id-${k}`, "Same title", { kind: k }));
    const r = searchItems("same", items, 20);
    expect(r.map((x) => x.kind)).toEqual([...KIND_ORDER]);
  });

  it("equal score and kind sort by title A to Z", () => {
    const items = [item("c", "Alpine"), item("a", "Alpaca"), item("b", "Alpha")];
    expect(ids(searchItems("alp", items))).toEqual(["a", "b", "c"]);
  });

  it("kind comes before title", () => {
    const items = [item("note-a", "Alpaca", { kind: "note" }), item("app-z", "Alpine", { kind: "app" })];
    expect(ids(searchItems("alp", items))).toEqual(["app-z", "note-a"]);
  });
});

describe("searchItems: limit", () => {
  const many = Array.from({ length: 12 }, (_, i) => item(`n${i}`, `Note ${String(i).padStart(2, "0")}`));

  it("defaults to 8", () => {
    expect(searchItems("note", many)).toHaveLength(8);
  });
  it("honours a custom limit", () => {
    expect(searchItems("note", many, 3)).toHaveLength(3);
    expect(searchItems("note", many, 1)).toHaveLength(1);
    expect(searchItems("note", many, 20)).toHaveLength(12);
  });
  it("keeps the best items when truncating", () => {
    const items = [...many, item("exact", "note")];
    expect(searchItems("note", items, 2)[0].id).toBe("exact");
  });
  it("returns fewer than the limit when fewer match", () => {
    expect(searchItems("note 03", many)).toHaveLength(1);
  });
});

describe("buildIndex", () => {
  const index = buildIndex();

  it("is not empty and every item is well-formed", () => {
    expect(index.length).toBeGreaterThan(apps.length);
    for (const it of index) {
      expect(it.id.length).toBeGreaterThan(0);
      expect(it.title.length).toBeGreaterThan(0);
      expect(KIND_ORDER).toContain(it.kind);
      expect(it.action).toBeDefined();
    }
  });

  it("ids are unique", () => {
    const all = index.map((i) => i.id);
    expect(new Set(all).size).toBe(all.length);
  });

  it("includes every registry app", () => {
    for (const a of apps) {
      const hit = index.find((i) => i.kind === "app" && i.action.type === "open" && i.action.app === a.id);
      expect(hit, a.id).toBeDefined();
    }
  });

  it("finds an app by its name", () => {
    const r = searchItems("terminal", index);
    expect(r.some((i) => i.kind === "app" && i.action.type === "open" && i.action.app === "terminal")).toBe(true);
  });
});


/* ── buildIndex shape ────────────────────────────────────────────── */

const FOLDER_SLUG: Record<string, string> = {
  "AI video generation platform": "video-studio",
  "AI photobooth": "photobooth",
  "AI lesson pipeline": "lesson-pipeline",
  "Zoom recording automation": "zoom-backup",
  "AI workout planner": "workout-planner",
  "Culinary Companion": "culinary-companion",
  "Creative AI Agent Quest": "agent-quest",
  LoopCraft: "loopcraft",
  "Gravity Wars": "gravity-wars",
  "Léyci storefront": "leyci",
  "Shortest-path engine": "shortest-path",
  "Twinkle Star": "twinkle-star",
};

describe("buildIndex: shape", () => {
  const index = buildIndex();
  const byTitleKind = (title: string, kind: SearchKind) => index.filter((i) => i.title === title && i.kind === kind);

  it("ids are unique", () => {
    const all = index.map((i) => i.id);
    expect(all.filter((id, n) => all.indexOf(id) !== n)).toEqual([]);
  });

  it("each published case-study slug is reachable through exactly one item", () => {
    for (const w of allWorks()) {
      const hits = index.filter((i) => i.action.type === "href" && i.action.href === `/work/${w.slug}`);
      expect(hits.map((h) => h.id), w.slug).toHaveLength(1);
    }
  });

  it("has no file: items for anything under /Users/akib/Projects", () => {
    expect(index.filter((i) => i.id.startsWith("file:/Users/akib/Projects"))).toEqual([]);
    expect(index.some((i) => i.id.startsWith("file:"))).toBe(true);
  });

  it("file items use the folder as subtitle, e.g. ~/Documents", () => {
    const f = index.find((i) => i.id === "file:/Users/akib/Documents/How I work.txt");
    expect(f).toBeDefined();
    expect(f!.kind).toBe("file");
    expect(f!.title).toBe("How I work.txt");
    expect(f!.subtitle).toBe("~/Documents");
    expect(f!.action).toEqual({ type: "open", app: "preview", arg: { path: "/Users/akib/Documents/How I work.txt" } });
  });

  it("pages: the CV opens in a new tab, the others do not", () => {
    const pages = index.filter((i) => i.id.startsWith("page:"));
    expect(pages.map((p) => p.title).sort()).toEqual(["About", "All work", "CV", "Home", "Sound"].sort());
    for (const p of pages) {
      expect(p.kind).toBe("page");
      expect(p.action.type).toBe("href");
      if (p.id === "page:cv") expect(p.action).toEqual({ type: "href", href: "/akib-arifeen-cv.pdf", newTab: true });
      else expect((p.action as { newTab?: boolean }).newTab, p.id).toBeFalsy();
    }
    expect(index.find((i) => i.id === "page:home")?.action).toEqual({ type: "href", href: "/" });
    expect(index.find((i) => i.id === "page:work")?.action).toEqual({ type: "href", href: "/work" });
  });

  it("project folders with a published case study open /work/<slug>", () => {
    for (const [folder, slug] of Object.entries(FOLDER_SLUG)) {
      if (!getWork(slug)) continue;
      const hit = index.find((i) => i.kind === "project" && i.subtitle === "Project" && i.title === folder);
      expect(hit, folder).toBeDefined();
      expect(hit!.action, folder).toEqual({ type: "href", href: `/work/${slug}` });
    }
  });

  it("the Leyci folder maps to /work/leyci", () => {
    const hit = index.find((i) => i.kind === "project" && i.title === "Léyci storefront" && i.subtitle === "Project");
    expect(hit?.action).toEqual({ type: "href", href: "/work/leyci" });
  });

  it("project folders without a published case study open Files at their path", () => {
    for (const [folder, slug] of Object.entries(FOLDER_SLUG)) {
      if (getWork(slug)) continue;
      const hit = index.find((i) => i.kind === "project" && i.subtitle === "Project" && i.title === folder);
      expect(hit, folder).toBeDefined();
      expect(hit!.action, folder).toEqual({ type: "open", app: "files", arg: { path: `/Users/akib/Projects/${folder}` } });
    }
  });

  it("every Projects folder has a project item", () => {
    for (const folder of Object.keys(FOLDER_SLUG)) {
      expect(index.some((i) => i.kind === "project" && i.subtitle === "Project" && i.title === folder), folder).toBe(true);
    }
  });

  it("playground items are projects with subtitle Playground", () => {
    const play = index.filter((i) => i.subtitle === "Playground");
    expect(play.length).toBeGreaterThan(0);
    for (const p of play) {
      expect(p.kind).toBe("project");
      expect(p.action).toMatchObject({ type: "open", app: "playground" });
    }
  });

  it("includes the 'git log' command item, which runs in Terminal", () => {
    const hit = byTitleKind("git log", "command");
    expect(hit).toHaveLength(1);
    expect(hit[0].subtitle).toBeUndefined();
    expect(hit[0].action).toEqual({ type: "open", app: "terminal", arg: { command: "git log" } });
  });

  it("notes: subtitle is the date, action opens the note", () => {
    for (const n of notes) {
      const hit = index.find((i) => i.kind === "note" && i.title === n.title);
      expect(hit, n.id).toBeDefined();
      expect(hit!.subtitle).toBe(n.date);
      expect(hit!.action).toEqual({ type: "open", app: "notes", arg: { noteId: n.id } });
    }
  });

  it("photos: caption title, date subtitle, index in the action", () => {
    photos.forEach((p, n) => {
      const hit = index.find((i) => i.kind === "photo" && i.action.type === "open" && i.action.arg?.photoIndex === n);
      expect(hit, p.caption).toBeDefined();
      expect(hit!.title).toBe(p.caption);
      expect(hit!.subtitle).toBe(p.date);
    });
  });

  it("apps carry their id as a keyword, so 'preview' finds Preview", () => {
    const preview = index.find((i) => i.kind === "app" && i.action.type === "open" && i.action.app === "preview");
    expect(preview).toBeDefined();
    expect(preview!.keywords).toContain("preview");
    expect(preview!.title).toBe("Preview");
    const r = searchItems("preview", index);
    expect(r[0]).toBe(preview);
  });

  it("an app whose name differs from its id is found by the id", () => {
    const r = searchItems("about", index);
    expect(r.some((i) => i.kind === "app" && i.action.type === "open" && i.action.app === "about")).toBe(true);
  });

  it("accent-free queries find accented titles", () => {
    const r = searchItems("leyci", index, 20);
    expect(r.some((i) => i.title === "Léyci storefront")).toBe(true);
  });

  it("an exact title outranks titles that merely start with the query", () => {
    const r = searchItems("terminal", index);
    expect(r[0].title).toBe("Terminal");
    expect(r[0].kind).toBe("app");
  });
});

describe("searchItems: exact beats prefix", () => {
  it("single word, even against a better kind", () => {
    const items = [
      item("pre", "Mailbox", { kind: "app" }),
      item("eq", "Mail", { kind: "command" }),
    ];
    expect(ids(searchItems("mail", items))).toEqual(["eq", "pre"]);
  });

  it("multi-word: title equal to the whole query beats a longer title that starts with it", () => {
    const items = [
      item("longer", "Gravity Wars Deluxe", { kind: "app" }),
      item("exact", "Gravity Wars", { kind: "command" }),
    ];
    expect(ids(searchItems("gravity wars", items))).toEqual(["exact", "longer"]);
  });

  it("multi-word: starts-with beats word-start beats contains", () => {
    const items = [
      item("contains", "Xgravity Xwars"),
      item("wordstart", "The gravity wars"),
      item("starts", "Gravity wars again"),
    ];
    expect(ids(searchItems("gravity wars", items))).toEqual(["starts", "wordstart", "contains"]);
  });
});

describe("buildIndex: stack keywords and command subtitles", () => {
  const index = buildIndex();

  it("project items with a published case study carry the work's stack as keywords", () => {
    const linked = index.filter((i) => i.kind === "project" && i.subtitle === "Project" && i.action.type === "href");
    expect(linked.length).toBeGreaterThan(0);
    for (const p of linked) {
      const slug = (p.action as { href: string }).href.replace("/work/", "");
      const work = getWork(slug)!;
      expect(work, slug).toBeDefined();
      for (const tech of work.stack) expect(p.keywords ?? [], `${p.title}: ${tech}`).toContain(tech);
    }
  });

  for (const q of ["react", "python", "typescript"]) {
    it(`searching "${q}" returns at least one project`, () => {
      const r = searchItems(q, index);
      expect(r.some((i) => i.kind === "project"), q).toBe(true);
    });
  }

  it("command items have no subtitle", () => {
    const cmds = index.filter((i) => i.kind === "command");
    expect(cmds.length).toBeGreaterThan(0);
    for (const c of cmds) expect(c.subtitle, c.title).toBeUndefined();
  });

  it('searching "terminal" returns the Terminal app and no command items', () => {
    const r = searchItems("terminal", index);
    expect(r[0].kind).toBe("app");
    expect(r[0].title).toBe("Terminal");
    expect(r.filter((i) => i.kind === "command")).toEqual([]);
  });
});
