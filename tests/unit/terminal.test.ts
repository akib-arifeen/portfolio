import { projects as contentProjects } from "@/lib/content";
import { describe, expect, it } from "vitest";
import { findApp } from "@/lib/os/apps";
import { HOME, fsRoot, listDir, resolvePath } from "@/lib/os/fs";
import { COMMANDS, USER_HOST, complete, prompt, runCommand } from "@/lib/os/terminal";
import type { FsFile, FsNode, TermCtx } from "@/lib/os/types";

const NOW = new Date(2026, 9, 22, 14, 30, 5);
const ctx = (cwd: string = HOME, history: readonly string[] = []): TermCtx => ({ cwd, history, now: NOW });
const texts = (r: { lines: { text: string }[] }) => r.lines.map((l) => l.text);

/** First text file anywhere in the tree (the contract guarantees READMEs exist, but not their path). */
function findTextFile(node: FsNode, path: string): { file: FsFile; path: string } | null {
  if (node.kind === "file") return node.type === "text" && node.text ? { file: node, path } : null;
  for (const c of node.children) {
    const hit = findTextFile(c, path === "/" ? `/${c.name}` : `${path}/${c.name}`);
    if (hit) return hit;
  }
  return null;
}

function lcp(words: string[]): string {
  let p = words[0] ?? "";
  for (const w of words) while (!w.startsWith(p)) p = p.slice(0, -1);
  return p;
}

describe("prompt", () => {
  it("shows ~ for HOME", () => {
    expect(USER_HOST).toBe("akib@laptop");
    expect(prompt(HOME)).toBe("akib@laptop ~ %");
  });
  it("shows a subfolder", () => {
    expect(prompt("/Users/akib/Projects")).toBe("akib@laptop ~/Projects %");
  });
  it("shows other paths in full", () => {
    expect(prompt("/Applications")).toBe("akib@laptop /Applications %");
  });
});

describe("COMMANDS", () => {
  it("lists the documented commands once each", () => {
    for (const c of ["help", "pwd", "cd", "ls", "cat", "open", "clear", "exit", "history", "echo", "date", "whoami", "neofetch", "projects", "now"]) {
      expect(COMMANDS).toContain(c);
    }
    expect(new Set(COMMANDS).size).toBe(COMMANDS.length);
  });
});

describe("runCommand: basics", () => {
  it("empty and whitespace input yield no lines and keep cwd", () => {
    expect(runCommand("", ctx("/Applications"))).toEqual({ lines: [], cwd: "/Applications" });
    expect(runCommand("   \t ", ctx("/Applications"))).toEqual({ lines: [], cwd: "/Applications" });
  });

  it("never throws on odd input", () => {
    for (const s of ["\u0000", "cd \u0000", "cat ////", "open ''", "ls ../../../..", "echo", "cd ~~", "cat", "open"]) {
      expect(() => runCommand(s, ctx())).not.toThrow();
    }
  });

  it("trims and collapses inner whitespace", () => {
    expect(texts(runCommand("   echo    a     b  ", ctx()))).toEqual(["a b"]);
  });

  it("unknown command", () => {
    const r = runCommand("frobnicate now please", ctx());
    expect(r.lines).toEqual([{ text: "zsh: command not found: frobnicate", tone: "err" }]);
    expect(r.cwd).toBe(HOME);
  });

  it("help prints one line per command in COMMANDS order", () => {
    const r = runCommand("help", ctx());
    expect(r.lines).toHaveLength(COMMANDS.length);
    COMMANDS.forEach((c, i) => expect(r.lines[i].text.trim().startsWith(c)).toBe(true));
  });

  it("content commands print something and keep cwd", () => {
    for (const c of ["whoami", "neofetch", "projects", "now", "git log"]) {
      const r = runCommand(c, ctx("/Applications"));
      expect(r.lines.length, c).toBeGreaterThan(0);
      expect(r.lines.every((l) => l.tone !== "err"), c).toBe(true);
      expect(r.cwd).toBe("/Applications");
    }
  });

  it("sudo hire-me returns the mail action", () => {
    const r = runCommand("sudo hire-me", ctx());
    expect(r.action).toMatchObject({ type: "open", app: "mail" });
    expect(r.lines.length).toBeGreaterThan(0);
  });
});

describe("pwd, echo, date, clear, exit, history", () => {
  it("pwd prints the cwd", () => {
    expect(texts(runCommand("pwd", ctx("/Applications")))).toEqual(["/Applications"]);
    expect(texts(runCommand("pwd", ctx()))).toEqual([HOME]);
  });

  it("echo joins arguments with single spaces", () => {
    expect(texts(runCommand("echo hello world", ctx()))).toEqual(["hello world"]);
  });

  it("date prints ctx.now.toString()", () => {
    expect(texts(runCommand("date", ctx()))).toEqual([NOW.toString()]);
    const other = new Date(2001, 0, 2, 3, 4, 5);
    expect(texts(runCommand("date", { cwd: HOME, history: [], now: other }))).toEqual([other.toString()]);
  });

  it("clear wipes the scrollback and prints nothing", () => {
    expect(runCommand("clear", ctx("/Applications"))).toMatchObject({ lines: [], clear: true, cwd: "/Applications" });
  });

  it("exit asks the UI to close the lid", () => {
    expect(runCommand("exit", ctx()).action).toEqual({ type: "exit" });
  });

  it("history numbers from 1, right-aligned in a 4-wide column", () => {
    const r = runCommand("history", ctx(HOME, ["ls", "pwd", "cd Projects"]));
    expect(texts(r)).toEqual(["   1  ls", "   2  pwd", "   3  cd Projects"]);
  });

  it("history keeps the column aligned past 9 entries", () => {
    const h = Array.from({ length: 12 }, (_, i) => `cmd${i + 1}`);
    const r = texts(runCommand("history", ctx(HOME, h)));
    expect(r[0]).toBe("   1  cmd1");
    expect(r[9]).toBe("  10  cmd10");
    expect(r[11]).toBe("  12  cmd12");
  });
});

describe("cd", () => {
  it("no arg and ~ go HOME", () => {
    expect(runCommand("cd", ctx("/Applications"))).toEqual({ lines: [], cwd: HOME });
    expect(runCommand("cd ~", ctx("/Applications"))).toEqual({ lines: [], cwd: HOME });
  });

  it("enters a folder (relative and absolute) with no output", () => {
    expect(runCommand("cd Projects", ctx())).toEqual({ lines: [], cwd: "/Users/akib/Projects" });
    expect(runCommand("cd /Applications", ctx())).toEqual({ lines: [], cwd: "/Applications" });
    expect(runCommand("cd ~/Documents", ctx("/")).cwd).toBe("/Users/akib/Documents");
  });

  it("goes up with ..", () => {
    expect(runCommand("cd ..", ctx("/Users/akib/Projects")).cwd).toBe(HOME);
    expect(runCommand("cd ../..", ctx()).cwd).toBe("/");
  });

  it("a file is an error and cwd stays", () => {
    const r = runCommand("cd Notes.app", ctx("/Applications"));
    expect(r.lines).toEqual([{ text: "cd: not a directory: Notes.app", tone: "err" }]);
    expect(r.cwd).toBe("/Applications");
  });

  it("a missing path is an error and cwd stays", () => {
    const r = runCommand("cd nowhere", ctx("/Applications"));
    expect(r.lines).toEqual([{ text: "cd: no such file or directory: nowhere", tone: "err" }]);
    expect(r.cwd).toBe("/Applications");
  });
});

describe("ls", () => {
  it("lists the cwd on one line, folders suffixed with /, joined by two spaces", () => {
    const entries = listDir(HOME) as FsNode[];
    const expected = entries.map((n) => (n.kind === "folder" ? `${n.name}/` : n.name)).join("  ");
    const r = runCommand("ls", ctx());
    expect(texts(r)).toEqual([expected]);
    expect(expected).toContain("Projects/");
    expect(r.cwd).toBe(HOME);
  });

  it("lists a given path (relative and absolute)", () => {
    const abs = runCommand("ls /Applications", ctx());
    const rel = runCommand("ls Applications", ctx("/"));
    expect(texts(abs)).toEqual(texts(rel));
    expect(texts(abs)).toHaveLength(1);
    expect(texts(abs)[0]).toContain("Notes.app");
    expect(texts(abs)[0]).not.toContain("Notes.app/");
  });

  it("prints a file's name", () => {
    expect(texts(runCommand("ls /Applications/Notes.app", ctx()))).toEqual(["Notes.app"]);
  });

  it("missing path", () => {
    const r = runCommand("ls nope", ctx());
    expect(r.lines).toEqual([{ text: "ls: nope: No such file or directory", tone: "err" }]);
  });
});

describe("cat", () => {
  it("prints a text file split on newlines", () => {
    const hit = findTextFile(fsRoot, "/");
    expect(hit).not.toBeNull();
    // there is no quoting, so a path with spaces cannot be passed to cat
    if (hit && !hit.path.includes(" ")) {
      const r = runCommand(`cat ${hit.path}`, ctx());
      expect(texts(r)).toEqual((hit.file.text as string).split("\n"));
      expect(r.cwd).toBe(HOME);
    }
  });

  it("folder", () => {
    expect(runCommand("cat Projects", ctx()).lines).toEqual([{ text: "cat: Projects: Is a directory", tone: "err" }]);
  });

  it("missing", () => {
    expect(runCommand("cat nope.txt", ctx()).lines).toEqual([{ text: "cat: nope.txt: No such file or directory", tone: "err" }]);
  });

  it("non-text file", () => {
    const r = runCommand("cat /Applications/Notes.app", ctx());
    expect(r.lines).toEqual([
      { text: "cat: /Applications/Notes.app: not a text file. Try `open /Applications/Notes.app`", tone: "err" },
    ]);
  });

  it("no argument", () => {
    expect(runCommand("cat", ctx()).lines).toEqual([{ text: "usage: cat <file>", tone: "err" }]);
  });
});

describe("open", () => {
  it("opens an app by id and by name, case-insensitively", () => {
    for (const t of ["notes", "Notes", "NOTES", "mail", "Terminal"]) {
      const def = findApp(t)!;
      const r = runCommand(`open ${t}`, ctx());
      expect(r.action, t).toMatchObject({ type: "open", app: def.id });
      expect(r.lines.some((l) => l.tone === "ok"), t).toBe(true);
    }
  });

  it("prints an ok line naming the app", () => {
    const r = runCommand("open notes", ctx());
    const ok = r.lines.find((l) => l.tone === "ok");
    expect(ok?.text.startsWith("opening Notes")).toBe(true);
  });

  it("opens a folder in Files", () => {
    const r = runCommand("open Projects", ctx());
    expect(r.action).toEqual({ type: "open", app: "files", arg: { path: "/Users/akib/Projects" } });
    expect(r.lines.some((l) => l.tone === "ok")).toBe(true);
  });

  it("opens a file through fs.openAction", () => {
    const f = resolvePath("/Applications/Mail.app") as FsFile;
    const r = runCommand("open /Applications/Mail.app", ctx());
    expect(r.action).toEqual(f.open);
    expect(r.lines.some((l) => l.tone === "ok")).toBe(true);
  });

  it("opens an http(s) URL in a new tab", () => {
    const r = runCommand("open https://example.com/a", ctx());
    expect(r.action).toEqual({ type: "href", href: "https://example.com/a", newTab: true });
    expect(r.lines.some((l) => l.tone === "ok")).toBe(true);
  });

  it("not found", () => {
    const r = runCommand("open definitely-not-here", ctx());
    expect(r.lines).toEqual([{ text: "open: definitely-not-here: not found", tone: "err" }]);
    expect(r.action).toBeUndefined();
  });
});

describe("complete", () => {
  it("a unique command completes with a trailing space", () => {
    expect(complete("hel", ctx())).toEqual({ line: "help ", options: [] });
    expect(complete("neof", ctx())).toEqual({ line: "neofetch ", options: [] });
  });

  it("several commands extend to the longest common prefix and list sorted options", () => {
    for (const p of ["c", "e", "n", "p"]) {
      const cands = COMMANDS.filter((c) => c.startsWith(p));
      if (cands.length < 2) continue;
      const r = complete(p, ctx());
      expect(r.line, p).toBe(lcp(cands));
      expect(r.options, p).toEqual([...cands].sort());
    }
    // "c" is shared by cd, cat and clear at the least
    const r = complete("c", ctx());
    expect(r.options).toEqual(expect.arrayContaining(["cd", "cat", "clear"]));
  });

  it("no matching command leaves the line unchanged", () => {
    expect(complete("zzz", ctx())).toEqual({ line: "zzz", options: [] });
  });

  it("completes a folder with a trailing slash and no trailing space", () => {
    expect(complete("cd Proj", ctx())).toEqual({ line: "cd Projects/", options: [] });
    expect(complete("ls Proj", ctx())).toEqual({ line: "ls Projects/", options: [] });
  });

  it("completes a file with a trailing space", () => {
    expect(complete("ls Not", ctx("/Applications"))).toEqual({ line: "ls Notes.app ", options: [] });
  });

  it("completes inside a directory part", () => {
    expect(complete("ls /Applications/Not", ctx())).toEqual({ line: "ls /Applications/Notes.app ", options: [] });
    expect(complete("cd /Users/akib/Proj", ctx("/"))).toEqual({ line: "cd /Users/akib/Projects/", options: [] });
  });

  it("several path candidates give the common prefix and sorted options", () => {
    const names = (listDir(HOME) as FsNode[]).map((n) => n.name).filter((n) => n.startsWith("D"));
    expect(names.length).toBeGreaterThan(1);
    const r = complete("cd D", ctx());
    expect(r.line).toBe(`cd ${lcp(names)}`);
    const plain = r.options.map((o) => o.replace(/\/$/, ""));
    expect(plain).toEqual([...names].sort());
    expect([...r.options]).toEqual([...r.options].sort());
  });

  it("no matching path leaves the line unchanged", () => {
    expect(complete("ls zzzz", ctx())).toEqual({ line: "ls zzzz", options: [] });
  });
});


/* ── from a non-HOME cwd ─────────────────────────────────────────── */

describe("from /Users/akib/Projects", () => {
  const P = "/Users/akib/Projects";
  const inP = () => ctx(P);

  it("ls with a folder name that has spaces (no quotes)", () => {
    const entries = listDir(`${P}/Gravity Wars`) as FsNode[];
    const expected = entries.map((n) => (n.kind === "folder" ? `${n.name}/` : n.name)).join("  ");
    const r = runCommand("ls Gravity Wars", inP());
    expect(texts(r)).toEqual([expected]);
    expect(expected).toContain("README.md");
    expect(r.cwd).toBe(P);
  });

  it("cat with a path that has spaces", () => {
    const f = resolvePath(`${P}/Gravity Wars/README.md`) as FsFile;
    const r = runCommand("cat Gravity Wars/README.md", inP());
    expect(texts(r)).toEqual((f.text as string).split("\n"));
    expect(r.lines.every((l) => l.tone !== "err")).toBe(true);
  });

  it("open with a folder name that has spaces", () => {
    const r = runCommand("open Gravity Wars", inP());
    expect(r.action).toEqual({ type: "open", app: "files", arg: { path: `${P}/Gravity Wars` } });
    expect(r.lines.find((l) => l.tone === "ok")?.text.startsWith("opening Gravity Wars")).toBe(true);
  });

  it("cd with a folder name that has spaces", () => {
    expect(runCommand("cd Gravity Wars", inP()).cwd).toBe(`${P}/Gravity Wars`);
  });

  it("pwd and prompt reflect the cwd", () => {
    expect(texts(runCommand("pwd", inP()))).toEqual([P]);
    expect(prompt(P)).toBe("akib@laptop ~/Projects %");
  });

  it("complete inside Projects", () => {
    expect(complete("cd Gr", inP())).toEqual({ line: "cd Gravity Wars/", options: [] });
    expect(complete("cat Gravity Wars/RE", inP())).toEqual({ line: "cat Gravity Wars/README.md ", options: [] });
  });

  it("complete lists several folders sorted", () => {
    const r = complete("cd C", inP());
    expect(r.options.map((o) => o.replace(/\/$/, "")).sort()).toEqual(["Creative AI Agent Quest", "Culinary Companion"].sort());
    expect(r.options).toHaveLength(2);
    expect(r.line).toBe("cd C");
  });

  it("complete keeps leading spaces on the line", () => {
    expect(complete("  cat Pro", ctx(HOME))).toEqual({ line: "  cat Projects/", options: [] });
    expect(complete("  hel", inP())).toEqual({ line: "  help ", options: [] });
  });

  it("complete with no match inside Projects leaves the line, spaces included", () => {
    expect(complete("  cat Pro", inP())).toEqual({ line: "  cat Pro", options: [] });
  });
});

describe("cat: other non-text files", () => {
  it("image", () => {
    const p = "/Users/akib/Pictures/Summer.jpg";
    expect(runCommand(`cat ${p}`, ctx()).lines).toEqual([
      { text: `cat: ${p}: not a text file. Try \`open ${p}\``, tone: "err" },
    ]);
  });
  it("pdf, relative to cwd", () => {
    expect(runCommand("cat Desktop/Akib Arifeen CV.pdf", ctx()).lines).toEqual([
      { text: "cat: Desktop/Akib Arifeen CV.pdf: not a text file. Try `open Desktop/Akib Arifeen CV.pdf`", tone: "err" },
    ]);
  });
});

describe("open: URLs", () => {
  it("http opens a new tab", () => {
    const r = runCommand("open http://x.com", ctx());
    expect(r.action).toEqual({ type: "href", href: "http://x.com", newTab: true });
  });
  it("https opens a new tab", () => {
    expect(runCommand("open https://x.com/a?b=1", ctx()).action).toEqual({
      type: "href",
      href: "https://x.com/a?b=1",
      newTab: true,
    });
  });
});

describe("sudo and rm", () => {
  it("sudo hire-me prints the accepted line and opens Mail", () => {
    const r = runCommand("sudo hire-me", ctx());
    expect(r.lines[0]).toEqual({ text: "Password accepted. Opening Mail…", tone: "ok" });
    expect(r.action).toEqual({ type: "open", app: "mail" });
  });
  it("sudo with anything else prints usage", () => {
    for (const c of ["sudo ls", "sudo", "sudo hire-you"]) {
      const r = runCommand(c, ctx());
      expect(r.lines, c).toEqual([{ text: "usage: sudo hire-me", tone: "err" }]);
      expect(r.action, c).toBeUndefined();
    }
  });
  it("rm is refused", () => {
    for (const c of ["rm -rf /", "rm file"]) {
      expect(runCommand(c, ctx()).lines, c).toEqual([{ text: "rm: this laptop is read-only. Nice try.", tone: "err" }]);
    }
  });
});

describe("content commands: layout", () => {
  it("git log: 6 to 8 lines, newest first, '<7 hex> <YYYY-MM> <message>'", () => {
    const lines = texts(runCommand("git log", ctx()));
    expect(lines.length).toBeGreaterThanOrEqual(6);
    expect(lines.length).toBeLessThanOrEqual(8);
    const dates: string[] = [];
    for (const l of lines) {
      const m = /^([0-9a-f]{7}) (\d{4}-\d{2}) (\S.*)$/.exec(l);
      expect(m, l).not.toBeNull();
      dates.push(m![2]);
    }
    expect(dates).toEqual([...dates].sort().reverse());
    expect(new Set(lines.map((l) => l.slice(0, 7))).size).toBe(lines.length);
  });

  it("help: one line per command, description starts at column 14", () => {
    const r = runCommand("help", ctx());
    r.lines.forEach((l, i) => {
      const name = COMMANDS[i];
      expect(l.text.startsWith(name), l.text).toBe(true);
      expect(l.text.slice(name.length, 14), l.text).toMatch(/^ +$/);
      expect(l.text[14], l.text).toBeDefined();
      expect(l.text[14], l.text).not.toBe(" ");
    });
  });

  it("neofetch: logo of 8 to 10 lines beside info that starts at column 17", () => {
    const r = runCommand("neofetch", ctx());
    expect(r.lines.length).toBeGreaterThanOrEqual(8);
    expect(r.lines.length).toBeLessThanOrEqual(10);
    for (const l of r.lines) {
      expect(l.tone).toBe("accent");
      expect(l.text.slice(0, 17), l.text).toMatch(/^[# ]*$/);
      expect(l.text[17], l.text).toBeDefined();
      expect(l.text[17], l.text).not.toBe(" ");
    }
    const info = r.lines.map((l) => l.text.slice(17));
    expect(info).toContain("akib@laptop");
    for (const want of [
      "OS: akibOS 26",
      "Host: See Change Education",
      "Location: Hong Kong",
      "Languages: TypeScript, Python, Java",
      "Frameworks: React, Next.js, Spring Boot, FastAPI",
      "Also: UI, motion and sound design",
    ]) {
      expect(info, want).toContain(want);
    }
    expect(info.some((s) => s.startsWith("AI: "))).toBe(true);
  });

  it("projects: one line per Projects folder, at least two spaces before the one-liner", () => {
    const folders = (listDir("/Users/akib/Projects") as FsNode[]).filter((n) => n.kind === "folder").map((n) => n.name);
    const lines = texts(runCommand("projects", ctx()));
    expect(lines).toHaveLength(folders.length);
    for (const name of folders) {
      const line = lines.find((l) => l.startsWith(name));
      expect(line, name).toBeDefined();
      expect(line!.slice(name.length), name).toMatch(/^ {2,}\S/);
    }
    // all one-liners start at the same column
    const cols = lines.map((l) => {
      const m = / {2,}(?=\S)/.exec(l)!;
      return m.index + m[0].length;
    });
    expect(new Set(cols).size).toBe(1);
  });

  it("projects covers every content.ts project title", () => {
    const lines = texts(runCommand("projects", ctx()));
    for (const p of contentProjects) expect(lines.some((l) => l.startsWith(p.title)), p.title).toBe(true);
  });

  it("whoami prints two lines and now prints two to three", () => {
    expect(runCommand("whoami", ctx()).lines).toHaveLength(2);
    const n = runCommand("now", ctx()).lines.length;
    expect(n).toBeGreaterThanOrEqual(2);
    expect(n).toBeLessThanOrEqual(3);
  });
});
