// akibOS Terminal engine — parses and runs one command line against the virtual FS. Pure, unit-tested.
import { findApp } from "./apps";
import { displayPath, listDir, normalizePath, openAction, resolvePath } from "./fs";
import type { FsNode, TermCtx, TermLine, TermResult } from "./types";

export const USER_HOST = "akib@laptop";

/** The prompt for a working directory, e.g. "akib@laptop ~ %" or "akib@laptop ~/Projects %" (uses fs.displayPath). */
export function prompt(cwd: string): string {
    return `${USER_HOST} ${displayPath(cwd)} %`;
}

/** Command names in the order `help` lists them; completion offers exactly these for the first word. */
export const COMMANDS: readonly string[] = [
  "help", "whoami", "now", "projects", "neofetch", "ls", "cd", "pwd", "cat", "open",
  "git log", "history", "echo", "date", "clear", "sudo hire-me", "exit",
];

const DESCRIPTIONS: Record<string, string> = {
  help: "list the commands",
  whoami: "who is this",
  now: "what I am building these days",
  projects: "the main work, one line each",
  neofetch: "about this laptop",
  ls: "list a folder",
  cd: "change folder",
  pwd: "where am I",
  cat: "print a text file",
  open: "open an app, file, folder or link",
  "git log": "milestones, newest first",
  history: "commands from this session",
  echo: "print some text",
  date: "the time here",
  clear: "clear the screen",
  "sudo hire-me": "the fast way to reach me",
  exit: "close the lid",
};

const ok = (text: string): TermLine => ({ text, tone: "ok" });
const err = (text: string): TermLine => ({ text, tone: "err" });

const NOT_TEXT = (arg: string) => `cat: ${arg}: not a text file. Try \`open ${arg}\``;

const NEOFETCH_LOGO = [
  "   ########    ",
  "  ##      ##   ",
  "          ##   ",
  "   #########   ",
  "  ##      ##   ",
  " ##       ##   ",
  " ##      ###   ",
  "  ###########   ",
];
const NEOFETCH_INFO = [
  "akib@laptop",
  "-----------",
  "OS: akibOS 26",
  "Host: See Change Education",
  "Location: Hong Kong",
  "Languages: TypeScript, Python, Java",
  "Frameworks: React, Next.js, Spring Boot, FastAPI",
  "AI: LLM agents, MCP, speech and image models, self-hosted GPU inference",
  "Also: UI, motion and sound design",
];

// Real milestones only (WORK_RECORD.md and the CV). Ids are made-up hex; dates and events are not.
const GIT_LOG = [
  "7c3e9a1 2026-10 Ship the rebuilt LoopCraft and Gravity Wars",
  "e41b7c0 2026-10 SeeChange Studio: built in about five weeks",
  "9d03a5f 2026-09 Start SeeChange Studio, the AI video platform",
  "c7a2e18 2026-08 AI photobooth goes live at SCMUN 2026",
  "3b9f604 2025-11 Start the AI workout planner at 852HealthKare",
  "a05d3e2 2025-09 Join See Change Education",
  "6f18cb9 2024-06 AI engineer intern at Seth Biotech",
  "1d7e4a3 2023-08 Start B.Sc. Computer Science at CityUHK",
];

function projectsLines(): TermLine[] {
  const dirs = (listDir("/Users/akib/Projects") ?? []).filter((n) => n.kind === "folder");
  const rows = dirs.map((d) => {
    const readme = d.kind === "folder" ? d.children.find((c) => c.name === "README.md") : undefined;
    const one = readme && readme.kind === "file" ? (readme.text ?? "").split("\n")[1] ?? "" : "";
    return [d.name, one] as const;
  });
  const width = Math.max(0, ...rows.map(([n]) => n.length)) + 2;
  return rows.map(([n, one]) => ({ text: n.padEnd(width) + one }));
}

function nodeLabel(n: FsNode) {
  return n.kind === "folder" ? `${n.name}/` : n.name;
}

/**
 * Run one line. Never throws. The input is trimmed and inner whitespace collapsed; empty input → { lines: [], cwd }.
 * Arguments are whitespace-separated (no quoting). Paths resolve with fs.normalizePath(arg, ctx.cwd).
 * Every error line has tone "err"; the result's cwd equals ctx.cwd unless `cd` succeeds.
 *
 *   help              one line per command: the name, then its description.
 *   pwd               one line: ctx.cwd.
 *   cd [path]         no arg or "~" → HOME. A folder → cwd = its normalized path, no output.
 *                     A file → "cd: not a directory: <arg>". Missing → "cd: no such file or directory: <arg>".
 *   ls [path]         one line: the folder's entries (fs.listDir order), folders suffixed "/", joined by two spaces.
 *                     An empty folder prints no lines. A file prints its name. Missing → "ls: <arg>: No such file or directory".
 *   cat <path>        a text file → its text split on "\n", one line each. A folder → "cat: <arg>: Is a directory".
 *                     Missing → "cat: <arg>: No such file or directory". Any other file type →
 *                     "cat: <arg>: not a text file. Try `open <arg>`". No arg → "usage: cat <file>".
 *   open <target>     an app id or name (case-insensitive, apps.findApp) → action { type: "open", app }.
 *                     An existing path → fs.openAction for files, or { type: "open", app: "files", arg: { path } } for folders.
 *                     An http(s) URL → { type: "href", href: arg, newTab: true }. Otherwise "open: <arg>: not found".
 *                     Every success also prints one "ok"-tone line, e.g. "opening Notes…".
 *   clear             { lines: [], clear: true }.
 *   exit              action { type: "exit" }.
 *   history           ctx.history numbered from 1, right-aligned in a 4-wide column: "   1  ls".
 *   echo <text…>      one line: the arguments joined by single spaces.
 *   date              one line: ctx.now.toString().
 *   whoami, neofetch, projects, now, git log, sudo hire-me — content commands (worker spec); `sudo hire-me` also
 *                     returns action { type: "open", app: "mail" }.
 *   anything else     "zsh: command not found: <first word>".
 */
export function runCommand(input: string, ctx: TermCtx): TermResult {
    const line = input.trim().replace(/\s+/g, " ");
  const fail = (text: string): TermResult => ({ lines: [err(text)], cwd: ctx.cwd });
  const done = (lines: TermLine[], extra: Partial<TermResult> = {}): TermResult => ({ lines, cwd: ctx.cwd, ...extra });
  if (!line) return { lines: [], cwd: ctx.cwd };

  const [cmd, ...args] = line.split(" ");
  const arg = args.join(" "); // path-taking commands read the whole rest, so names with spaces work without quoting

  switch (cmd) {
    case "help": {
      return done(COMMANDS.map((c) => ({ text: c.padEnd(14) + DESCRIPTIONS[c] })));
    }
    case "whoami":
      return done([{ text: "Akib Arifeen, software engineer in Hong Kong." }, { text: "I build AI products end to end, then make them look and sound right." }]);
    case "now":
      return done([
        { text: "Growing SeeChange Studio, the AI video platform I built at See Change Education." },
        { text: "Offering the photobooth to schools, and finishing my computer science degree at CityUHK." },
        { text: "Shipped the rebuilt LoopCraft and Gravity Wars, both playable in the browser, and a Save Your Princess slice." },
      ]);
    case "projects":
      return done(projectsLines());
    case "neofetch":
      return done(NEOFETCH_INFO.map((info, i) => ({ text: (NEOFETCH_LOGO[i] ?? "").padEnd(17) + info, tone: "accent" as const })));
    case "pwd":
      return done([{ text: ctx.cwd }]);
    case "cd": {
      const target = normalizePath(arg === "" ? "~" : arg, ctx.cwd);
      const node = resolvePath(target);
      if (!node) return fail(`cd: no such file or directory: ${arg}`);
      if (node.kind !== "folder") return fail(`cd: not a directory: ${arg}`);
      return { lines: [], cwd: target };
    }
    case "ls": {
      const target = arg === "" ? ctx.cwd : arg;
      const node = resolvePath(target, ctx.cwd);
      if (!node) return fail(`ls: ${arg}: No such file or directory`);
      if (node.kind === "file") return done([{ text: node.name }]);
      const entries = listDir(target, ctx.cwd) ?? [];
      return done(entries.length ? [{ text: entries.map(nodeLabel).join("  ") }] : []);
    }
    case "cat": {
      if (!arg) return fail("usage: cat <file>");
      const node = resolvePath(arg, ctx.cwd);
      if (!node) return fail(`cat: ${arg}: No such file or directory`);
      if (node.kind === "folder") return fail(`cat: ${arg}: Is a directory`);
      if (node.type !== "text") return fail(NOT_TEXT(arg));
      return done((node.text ?? "").split("\n").map((t) => ({ text: t })));
    }
    case "open": {
      if (!arg) return fail("usage: open <app, file or link>");
      const app = findApp(arg);
      if (app) return done([ok(`opening ${app.name}\u2026`)], { action: { type: "open", app: app.id } });
      const path = normalizePath(arg, ctx.cwd);
      const node = resolvePath(path);
      if (node) {
        const action = node.kind === "folder" ? ({ type: "open", app: "files", arg: { path } } as const) : openAction(node, path);
        return done([ok(`opening ${node.name}\u2026`)], { action });
      }
      if (/^https?:\/\//i.test(arg)) return done([ok(`opening ${arg}\u2026`)], { action: { type: "href", href: arg, newTab: true } });
      return fail(`open: ${arg}: not found`);
    }
    case "git":
      if (args[0] === "log") return done(GIT_LOG.map((t) => ({ text: t })));
      return fail("usage: git log");
    case "history":
      return done(ctx.history.map((h, i) => ({ text: `${String(i + 1).padStart(4)}  ${h}` })));
    case "echo":
      return done([{ text: args.join(" ") }]);
    case "date":
      return done([{ text: ctx.now.toString() }]);
    case "clear":
      return { lines: [], cwd: ctx.cwd, clear: true };
    case "exit":
      return done([], { action: { type: "exit" } });
    case "sudo":
      if (args[0] === "hire-me") return done([ok("Password accepted. Opening Mail\u2026")], { action: { type: "open", app: "mail" } });
      if (args[0] !== "rm") return fail("usage: sudo hire-me");
    // falls through: sudo rm gets the same answer as rm
    case "rm":
      return fail("rm: this laptop is read-only. Nice try.");
    default:
      return fail(`zsh: command not found: ${cmd}`);
  }
}

/**
 * Tab completion for a whole input line.
 * - Completing the first word: candidates are COMMANDS that start with it.
 * - Completing a later word: candidates are entries of the folder named by the word's directory part (resolved against
 *   ctx.cwd) whose names start with the word's last segment; folders complete with a trailing "/".
 * - One candidate → { line: the line with that word replaced by it (plus a trailing space for commands and files,
 *   none for folders), options: [] }.
 * - Several → { line: the word extended to their longest common prefix, options: the candidate names, sorted }.
 * - None → { line: unchanged, options: [] }.
 */
export function complete(line: string, ctx: TermCtx): { line: string; options: string[] } {
    const lead = line.length - line.trimStart().length;
  const body = line.slice(lead);
  const space = body.indexOf(" ");

  const finish = (start: number, dirPart: string, names: string[], isDir: (n: string) => boolean, trailing: boolean) => {
    const prefix = line.slice(0, start);
    if (names.length === 0) return { line, options: [] as string[] };
    if (names.length === 1) {
      const n = names[0];
      return { line: prefix + dirPart + n + (trailing && !isDir(n) ? " " : ""), options: [] as string[] };
    }
    let common = names[0];
    for (const n of names) while (!n.startsWith(common)) common = common.slice(0, -1);
    return { line: prefix + dirPart + common, options: names.slice().sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" })) };
  };

  if (space === -1) {
    const names = COMMANDS.filter((c) => c.startsWith(body));
    return finish(lead, "", [...names], () => false, true);
  }

  // "git <sub>" / "sudo <cmd>": complete against the multi-word COMMANDS that start with the first word
  const first = body.slice(0, space);
  if ((first === "git" || first === "sudo") && !body.slice(space + 1).includes("/")) {
    const rest = body.slice(space + 1);
    const names = COMMANDS.filter((c) => c.startsWith(first + " ") && c.slice(first.length + 1).startsWith(rest)).map((c) => c.slice(first.length + 1));
    if (names.length > 0) return finish(lead + space + 1, "", names, () => false, true);
  }

  // later word: everything after the command, so names with spaces complete too
  const start = lead + space + 1;
  const word = line.slice(start);
  const slash = word.lastIndexOf("/");
  const dirPart = word.slice(0, slash + 1);
  const seg = word.slice(slash + 1);
  const entries = listDir(dirPart === "" ? ctx.cwd : dirPart, ctx.cwd) ?? [];
  const names = entries.filter((e) => e.name.startsWith(seg)).map(nodeLabel);
  return finish(start, dirPart, names, (n) => n.endsWith("/"), true);
}
