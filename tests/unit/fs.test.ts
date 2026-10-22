import { afterEach, vi } from "vitest";
import { notes as deskNotes, photos as deskPhotos, playlists as deskPlaylists } from "@/lib/desk";
import { getWork } from "@/lib/work";
import { runCommand } from "@/lib/os/terminal";
import { describe, expect, it } from "vitest";
import { apps } from "@/lib/os/apps";
import { HOME, TRASH, displayPath, fsRoot, listDir, normalizePath, openAction, resolvePath } from "@/lib/os/fs";
import type { FsFile, FsFolder, FsNode } from "@/lib/os/types";

const cmp = (a: string, b: string) => a.localeCompare(b, "en", { sensitivity: "base" });

describe("constants", () => {
  it("HOME and TRASH", () => {
    expect(HOME).toBe("/Users/akib");
    expect(TRASH).toBe("/Trash");
  });
  it("fsRoot is the root folder", () => {
    expect(fsRoot.kind).toBe("folder");
    expect(fsRoot.name).toBe("");
  });
});

describe("normalizePath", () => {
  it("documented examples", () => {
    expect(normalizePath("Projects", "/Users/akib")).toBe("/Users/akib/Projects");
    expect(normalizePath("../..", "/Users/akib")).toBe("/");
    expect(normalizePath("~/")).toBe("/Users/akib");
  });

  it("expands ~ and ~/x to HOME", () => {
    expect(normalizePath("~")).toBe("/Users/akib");
    expect(normalizePath("~/Projects")).toBe("/Users/akib/Projects");
    expect(normalizePath("~", "/somewhere/else")).toBe("/Users/akib");
    expect(normalizePath("~/x/../y")).toBe("/Users/akib/y");
  });

  it("drops . segments", () => {
    expect(normalizePath(".", "/a/b")).toBe("/a/b");
    expect(normalizePath("./c", "/a/b")).toBe("/a/b/c");
    expect(normalizePath("/a/./b")).toBe("/a/b");
  });

  it(".. removes one segment and stops at the root", () => {
    expect(normalizePath("..", "/a/b")).toBe("/a");
    expect(normalizePath("..", "/a")).toBe("/");
    expect(normalizePath("..", "/")).toBe("/");
    expect(normalizePath("/../..")).toBe("/");
    expect(normalizePath("/a/../../b")).toBe("/b");
  });

  it("drops repeated and trailing slashes", () => {
    expect(normalizePath("//a///b/")).toBe("/a/b");
    expect(normalizePath("/a/b/")).toBe("/a/b");
    expect(normalizePath("/")).toBe("/");
    expect(normalizePath("///")).toBe("/");
  });

  it("absolute paths ignore cwd; relative paths use it", () => {
    expect(normalizePath("/x/y", "/a/b")).toBe("/x/y");
    expect(normalizePath("c/d", "/a/b")).toBe("/a/b/c/d");
    expect(normalizePath("c", "/")).toBe("/c");
  });

  it("defaults the cwd to HOME", () => {
    expect(normalizePath("Documents")).toBe("/Users/akib/Documents");
  });

  it("does not need the path to exist", () => {
    expect(normalizePath("no/such/thing", "/")).toBe("/no/such/thing");
  });
});

describe("resolvePath", () => {
  it('"/" is fsRoot', () => {
    expect(resolvePath("/")).toBe(fsRoot);
  });

  it("returns null for missing paths", () => {
    expect(resolvePath("/nope")).toBeNull();
    expect(resolvePath("/Users/akib/does-not-exist")).toBeNull();
    expect(resolvePath("/Users/nobody")).toBeNull();
  });

  it("is case-sensitive", () => {
    expect(resolvePath("/Users/akib")).not.toBeNull();
    expect(resolvePath("/users/akib")).toBeNull();
    expect(resolvePath("/Users/akib/projects")).toBeNull();
    expect(resolvePath("/Users/akib/Projects")).not.toBeNull();
  });

  it("resolves relative to cwd, defaulting to HOME", () => {
    expect(resolvePath("Projects")).toBe(resolvePath("/Users/akib/Projects"));
    expect(resolvePath("Notes.app", "/Applications")).toBe(resolvePath("/Applications/Notes.app"));
    expect(resolvePath("~/Projects")).toBe(resolvePath("/Users/akib/Projects"));
    expect(resolvePath("../..", "/Users/akib")).toBe(fsRoot);
  });

  it("has the required folders", () => {
    for (const p of [
      "/Applications",
      "/Users",
      "/Users/akib",
      "/Users/akib/Desktop",
      "/Users/akib/Documents",
      "/Users/akib/Downloads",
      "/Users/akib/Pictures",
      "/Users/akib/Music",
      "/Users/akib/Projects",
      "/Trash",
    ]) {
      const n = resolvePath(p);
      expect(n, p).not.toBeNull();
      expect(n?.kind, p).toBe("folder");
    }
  });

  it("/Applications holds one <Name>.app per registry app, each with open set", () => {
    for (const a of apps) {
      const n = resolvePath(`/Applications/${a.name}.app`);
      expect(n, a.name).not.toBeNull();
      expect(n?.kind).toBe("file");
      const f = n as FsFile;
      expect(f.type).toBe("app");
      expect(f.name).toBe(`${a.name}.app`);
      expect(f.open).toBeDefined();
      expect(f.open).toMatchObject({ type: "open", app: a.id });
    }
  });
});

describe("listDir", () => {
  it("returns null for a file and for a missing path", () => {
    expect(listDir("/Applications/Notes.app")).toBeNull();
    expect(listDir("/nope")).toBeNull();
    expect(listDir("/Users/akib/nope")).toBeNull();
  });

  it("lists the root", () => {
    const names = listDir("/")?.map((n) => n.name) ?? [];
    expect(names).toEqual(expect.arrayContaining(["Applications", "Users", "Trash"]));
  });

  it("resolves relative to cwd, defaulting to HOME", () => {
    expect(listDir("Projects")).toEqual(listDir("/Users/akib/Projects"));
    expect(listDir(".", "/Applications")).toEqual(listDir("/Applications"));
  });

  it("lists HOME with the required folders", () => {
    const names = listDir(HOME)?.map((n) => n.name) ?? [];
    for (const n of ["Desktop", "Documents", "Downloads", "Pictures", "Music", "Projects"]) {
      expect(names).toContain(n);
    }
  });

  const dirs = ["/", "/Applications", "/Users/akib", "/Users/akib/Desktop", "/Users/akib/Documents", "/Users/akib/Projects", "/Users/akib/Pictures", "/Users/akib/Music", "/Users/akib/Downloads"];
  for (const d of dirs) {
    it(`orders ${d}: folders first, then files, each by base-sensitivity localeCompare`, () => {
      const list = listDir(d) as FsNode[];
      expect(list).not.toBeNull();
      const kinds = list.map((n) => n.kind);
      const firstFile = kinds.indexOf("file");
      if (firstFile !== -1) expect(kinds.slice(firstFile).every((k) => k === "file")).toBe(true);
      const folders = list.filter((n) => n.kind === "folder").map((n) => n.name);
      const files = list.filter((n) => n.kind === "file").map((n) => n.name);
      expect(folders).toEqual([...folders].sort(cmp));
      expect(files).toEqual([...files].sort(cmp));
    });
  }

  it("lists every registry app under /Applications", () => {
    const names = (listDir("/Applications") ?? []).map((n) => n.name);
    for (const a of apps) expect(names).toContain(`${a.name}.app`);
  });
});

describe("openAction", () => {
  const base = { kind: "file" as const };

  for (const type of ["text", "image", "pdf", "video", "audio"] as const) {
    it(`${type} files open in preview with the path`, () => {
      const f: FsFile = { ...base, name: `x.${type}`, type, src: "/x" };
      expect(openAction(f, "/Users/akib/Documents/x")).toEqual({
        type: "open",
        app: "preview",
        arg: { path: "/Users/akib/Documents/x" },
      });
    });
  }

  it("http and https links open in a new tab", () => {
    const a: FsFile = { ...base, name: "a.webloc", type: "link", href: "https://example.com/x" };
    expect(openAction(a, "/p")).toEqual({ type: "href", href: "https://example.com/x", newTab: true });
    const b: FsFile = { ...base, name: "b.webloc", type: "link", href: "http://example.com" };
    expect(openAction(b, "/p")).toEqual({ type: "href", href: "http://example.com", newTab: true });
  });

  it("site-path links navigate without newTab", () => {
    const f: FsFile = { ...base, name: "c.webloc", type: "link", href: "/work/leyci" };
    const a = openAction(f, "/p");
    expect(a).toMatchObject({ type: "href", href: "/work/leyci" });
    expect((a as { newTab?: boolean }).newTab).toBeFalsy();
  });

  it("file.open wins over the type", () => {
    const open = { type: "open", app: "notes" } as const;
    const f: FsFile = { ...base, name: "n.txt", type: "text", text: "hi", open };
    expect(openAction(f, "/p")).toBe(open);
    const l: FsFile = { ...base, name: "l", type: "link", href: "https://example.com", open: { type: "lock" } };
    expect(openAction(l, "/p")).toEqual({ type: "lock" });
  });

  it("app files return their open action", () => {
    const open = { type: "open", app: "mail" } as const;
    const f: FsFile = { ...base, name: "Mail.app", type: "app", open };
    expect(openAction(f, "/Applications/Mail.app")).toBe(open);
  });

  it("a link file with no href goes to the site root", () => {
    const f: FsFile = { ...base, name: "empty.webloc", type: "link" };
    expect(openAction(f, "/p")).toEqual({ type: "href", href: "/" });
  });

  it("works on real tree files: app files in /Applications", () => {
    const n = resolvePath("/Applications/Terminal.app") as FsFile;
    expect(openAction(n, "/Applications/Terminal.app")).toMatchObject({ type: "open", app: "terminal" });
  });
});

describe("displayPath", () => {
  it("shows HOME and below with ~", () => {
    expect(displayPath("/Users/akib")).toBe("~");
    expect(displayPath("/Users/akib/Projects")).toBe("~/Projects");
    expect(displayPath("/Users/akib/Projects/x/y")).toBe("~/Projects/x/y");
  });

  it("leaves other paths unchanged", () => {
    expect(displayPath("/")).toBe("/");
    expect(displayPath("/Applications")).toBe("/Applications");
    expect(displayPath("/Trash")).toBe("/Trash");
    expect(displayPath("/Users")).toBe("/Users");
    expect(displayPath("/Users/akibx")).toBe("/Users/akibx");
    expect(displayPath("/Users/other")).toBe("/Users/other");
  });
});

describe("tree shape", () => {
  it("every node has a name, folders have children arrays", () => {
    const walk = (n: FsNode, seen: string[]) => {
      if (n !== fsRoot) expect(n.name.length).toBeGreaterThan(0);
      if (n.kind === "folder") {
        const f = n as FsFolder;
        expect(Array.isArray(f.children)).toBe(true);
        for (const c of f.children) walk(c, seen);
      }
    };
    walk(fsRoot, []);
  });
});


/* ── tree contents ───────────────────────────────────────────────── */

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
  "L\u00e9yci storefront": "leyci",
  "Shortest-path engine": "shortest-path",
  "Twinkle Star": "twinkle-star",
};
const LIVE: Record<string, string> = {
  "Culinary Companion": "https://culnary-companion-bhy9.vercel.app",
  "Creative AI Agent Quest": "https://creative-ai-agent-quest.vercel.app",
  LoopCraft: "https://loop-craft-six.vercel.app",
  "Gravity Wars": "https://gravity-warsio.vercel.app",
  "L\u00e9yci storefront": "https://leyci.pages.dev",
};
const file = (p: string) => resolvePath(p) as FsFile | null;

describe("Projects folder", () => {
  const names = () => (listDir("/Users/akib/Projects") as FsNode[]).map((n) => n.name);

  it("has exactly the twelve project folders", () => {
    expect([...names()].sort()).toEqual(Object.keys(FOLDER_SLUG).sort());
    for (const n of listDir("/Users/akib/Projects") as FsNode[]) expect(n.kind).toBe("folder");
  });

  it("every project has a README.md of 6 to 14 lines starting with its title", () => {
    for (const folder of Object.keys(FOLDER_SLUG)) {
      const f = file(`/Users/akib/Projects/${folder}/README.md`);
      expect(f, folder).not.toBeNull();
      expect(f!.type).toBe("text");
      const lines = (f!.text as string).split("\n");
      expect(lines.length, folder).toBeGreaterThanOrEqual(6);
      expect(lines.length, folder).toBeLessThanOrEqual(14);
      expect(lines[0].startsWith("# "), folder).toBe(true);
    }
  });

  it("README line 2 is the project's one-liner, the same text `projects` prints", () => {
    const printed = runCommand("projects", { cwd: HOME, history: [], now: new Date() }).lines.map((l) => l.text);
    for (const folder of Object.keys(FOLDER_SLUG)) {
      const line = printed.find((l) => l.startsWith(folder));
      expect(line, folder).toBeDefined();
      const oneLiner = line!.slice(folder.length).trim();
      const readme = file(`/Users/akib/Projects/${folder}/README.md`)!;
      expect((readme.text as string).split("\n")[1], folder).toBe(oneLiner);
      expect(oneLiner.length).toBeGreaterThan(0);
    }
  });

  it("'Case study.webloc' exists only for published works and points at /work/<slug>", () => {
    for (const [folder, slug] of Object.entries(FOLDER_SLUG)) {
      const f = file(`/Users/akib/Projects/${folder}/Case study.webloc`);
      if (getWork(slug)) {
        expect(f, folder).not.toBeNull();
        expect(f!.type).toBe("link");
        expect(f!.href).toBe(`/work/${slug}`);
      } else {
        expect(f, folder).toBeNull();
      }
    }
  });

  it("'Open live.webloc' exists only for projects with a live URL and points at it", () => {
    for (const folder of Object.keys(FOLDER_SLUG)) {
      const f = file(`/Users/akib/Projects/${folder}/Open live.webloc`);
      if (LIVE[folder]) {
        expect(f, folder).not.toBeNull();
        expect(f!.type).toBe("link");
        expect(f!.href).toBe(LIVE[folder]);
      } else {
        expect(f, folder).toBeNull();
      }
    }
  });

  it("opening a link file follows the openAction rules", () => {
    const live = file("/Users/akib/Projects/Gravity Wars/Open live.webloc")!;
    expect(openAction(live, "/Users/akib/Projects/Gravity Wars/Open live.webloc")).toEqual({
      type: "href",
      href: LIVE["Gravity Wars"],
      newTab: true,
    });
    const cs = file("/Users/akib/Projects/AI photobooth/Case study.webloc")!;
    expect(openAction(cs, "/x")).toMatchObject({ type: "href", href: "/work/photobooth" });
  });
});

describe("Desktop, Documents, Music, Pictures, Trash", () => {
  it("Desktop holds the CV, a Projects link and All work", () => {
    const names = (listDir("/Users/akib/Desktop") as FsNode[]).map((n) => n.name);
    expect(names).toEqual(["Akib Arifeen CV.pdf", "All work.webloc", "Projects"]);
    const link = file("/Users/akib/Desktop/Projects")!;
    expect(link.type).toBe("link");
    expect(link.open).toEqual({ type: "open", app: "files", arg: { path: "/Users/akib/Projects" } });
    expect(openAction(link, "/Users/akib/Desktop/Projects")).toEqual(link.open);
    const all = file("/Users/akib/Desktop/All work.webloc")!;
    expect(all.type).toBe("link");
    expect(all.href).toBe("/work");
  });

  it("the CV pdf points at the public file", () => {
    for (const p of ["/Users/akib/Desktop/Akib Arifeen CV.pdf", "/Users/akib/Documents/Akib Arifeen CV.pdf"]) {
      const f = file(p)!;
      expect(f.type).toBe("pdf");
      expect(f.src).toBe("/akib-arifeen-cv.pdf");
    }
  });

  it("How I work.txt separates paragraphs with a blank line", () => {
    const f = file("/Users/akib/Documents/How I work.txt")!;
    expect(f.type).toBe("text");
    const how = deskNotes.find((n) => n.id === "how")!;
    expect(f.text).toBe(how.body.join("\n\n"));
    expect((f.text as string).split("\n\n")).toHaveLength(how.body.length);
  });

  it("Downloads is empty", () => {
    expect(listDir("/Users/akib/Downloads")).toEqual([]);
  });

  it("Music has one .playlist per playlist, carrying its index", () => {
    const list = listDir("/Users/akib/Music") as FsNode[];
    expect(list).toHaveLength(deskPlaylists.length);
    deskPlaylists.forEach((p, i) => {
      const f = file(`/Users/akib/Music/${p.name}.playlist`);
      expect(f, p.name).not.toBeNull();
      expect(f!.open).toEqual({ type: "open", app: "music", arg: { playlist: i } });
      expect(openAction(f!, "/x")).toEqual({ type: "open", app: "music", arg: { playlist: i } });
    });
  });

  it("Pictures has one .jpg per photo with its date and src", () => {
    const list = listDir("/Users/akib/Pictures") as FsNode[];
    expect(list).toHaveLength(deskPhotos.length);
    for (const p of deskPhotos) {
      const f = file(`/Users/akib/Pictures/${p.caption}.jpg`);
      expect(f, p.caption).not.toBeNull();
      expect(f!.type).toBe("image");
      expect(f!.src).toBe(p.src);
      expect(f!.modified).toBe(p.date);
    }
  });

  it("Trash holds the retired note, two lines", () => {
    const f = file("/Trash/Portfolio OS v1 (retired).txt")!;
    expect(f.type).toBe("text");
    expect((f.text as string).split("\n")).toHaveLength(2);
  });

  it("files default to the 22 Oct 2026 modified date", () => {
    expect(file("/Users/akib/Documents/How I work.txt")!.modified).toBe("22 Oct 2026");
  });
});

describe("listDir: folders before files on a mixed folder", () => {
  it("orders a mixed folder", () => {
    const projects = resolvePath("/Users/akib/Projects") as FsFolder;
    const added: FsNode[] = [
      { kind: "file", name: "Aardvark.txt", type: "text", text: "x" },
      { kind: "folder", name: "Zed", children: [] },
      { kind: "file", name: "middle.txt", type: "text", text: "x" },
      { kind: "folder", name: "Alpha", children: [] },
    ];
    projects.children.push(...added);
    try {
      const names = (listDir("/Users/akib/Projects") as FsNode[]).map((n) => n.name);
      const firstFile = names.indexOf("Aardvark.txt");
      const lastFolder = names.indexOf("Zed");
      expect(lastFolder).toBeGreaterThan(-1);
      expect(firstFile).toBeGreaterThan(lastFolder);
      expect(names.slice(firstFile)).toEqual(["Aardvark.txt", "middle.txt"]);
      expect(names.indexOf("Alpha")).toBeLessThan(names.indexOf("Zed"));
    } finally {
      for (const a of added) projects.children.splice(projects.children.indexOf(a), 1);
    }
    expect((listDir("/Users/akib/Projects") as FsNode[]).map((n) => n.name)).not.toContain("Aardvark.txt");
  });
});

describe("duplicate photo captions", () => {
  afterEach(() => {
    vi.doUnmock("@/lib/desk");
    vi.resetModules();
  });

  it("get ' 2' appended on a clash", async () => {
    vi.resetModules();
    const real = await vi.importActual<typeof import("@/lib/desk")>("@/lib/desk");
    vi.doMock("@/lib/desk", () => ({
      ...real,
      photos: [
        { src: "/a.jpg", caption: "Same", date: "d1" },
        { src: "/b.jpg", caption: "Same", date: "d2" },
        { src: "/c.jpg", caption: "Other", date: "d3" },
      ],
    }));
    const fresh = await import("@/lib/os/fs");
    const names = (fresh.listDir("/Users/akib/Pictures") ?? []).map((n) => n.name);
    expect(names).toEqual(["Other.jpg", "Same 2.jpg", "Same.jpg"]);
    const first = fresh.resolvePath("/Users/akib/Pictures/Same.jpg") as FsFile;
    const second = fresh.resolvePath("/Users/akib/Pictures/Same 2.jpg") as FsFile;
    expect(first.src).toBe("/a.jpg");
    expect(second.src).toBe("/b.jpg");
  });
});

describe("path edge cases", () => {
  it("~foo is a relative name, not HOME-based", () => {
    expect(normalizePath("~foo", "/a")).toBe("/a/~foo");
    expect(normalizePath("~foo")).toBe("/Users/akib/~foo");
    expect(normalizePath("~/foo", "/a")).toBe("/Users/akib/foo");
  });

  it("resolving through a file gives null", () => {
    expect(resolvePath("/Users/akib/Documents/Akib Arifeen CV.pdf/x")).toBeNull();
    expect(resolvePath("/Applications/Notes.app/anything/deeper")).toBeNull();
    expect(listDir("/Users/akib/Documents/Akib Arifeen CV.pdf/x")).toBeNull();
  });

  it("openAction on an app file without `open` throws", () => {
    const f: FsFile = { kind: "file", name: "Broken.app", type: "app" };
    expect(() => openAction(f, "/Applications/Broken.app")).toThrow();
  });
});
