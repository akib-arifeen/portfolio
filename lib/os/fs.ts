// akibOS virtual file system — a read-only tree built from the site's own data. Pure, unit-tested.
import { contact } from "../content";
import { notes, photos, playlists } from "../desk";
import { getWork } from "../work";
import { apps } from "./apps";
import type { FsFile, FsFolder, FsNode, MenuAction } from "./types";

export const HOME = "/Users/akib";
export const TRASH = "/Trash";

const MODIFIED = "22 Oct 2026";

const text = (name: string, body: string): FsFile => ({ kind: "file", name, type: "text", text: body, modified: MODIFIED });
const link = (name: string, href: string, open?: MenuAction): FsFile => ({ kind: "file", name, type: "link", href, open, modified: MODIFIED });
const folder = (name: string, children: FsNode[]): FsFolder => ({ kind: "folder", name, children, modified: MODIFIED });
const cvPdf = (): FsFile => ({ kind: "file", name: "Akib Arifeen CV.pdf", type: "pdf", src: contact.cv, modified: MODIFIED });

type Project = {
  folder: string;
  slug: string;
  line: string;
  role: string;
  stack: string;
  status: string;
  outcome: string;
  live?: string;
  repo?: string;
};

// Facts only from lib/content.ts, WORK_RECORD.md and PORTFOLIO_PLAN.md section 14. Line 2 of each README is the
// one-liner that the terminal's `projects` command prints, so changing the README layout breaks lib/os/terminal.ts.
const PROJECTS: Project[] = [
  {
    folder: "AI video generation platform", slug: "video-studio",
    line: "Turns a prompt or a lesson into a narrated, animated 4K video.",
    role: "Architecture, backend and GPU infrastructure",
    stack: "Python, FastAPI, TypeScript, React, ComfyUI, FFmpeg",
    status: "In production at See Change Education",
    outcome: "50% faster video generation after optimisation",
  },
  {
    folder: "AI photobooth", slug: "photobooth",
    line: "Guests talk to a voice character, get their photo restyled by AI and leave with a print.",
    role: "Concept, design, voice and full stack",
    stack: "React, TypeScript, Spring Boot, FastAPI, Azure Speech, Node.js",
    status: "Ran at live events, now offered to schools as a product",
    outcome: "200 to 300 guests per event",
  },
  {
    folder: "AI lesson pipeline", slug: "lesson-pipeline",
    line: "Turns recorded classes into ready-to-publish lessons with video, slides, bilingual subtitles and exercises.",
    role: "Backend and prompting",
    stack: "Spring Boot, Redis, React, NotebookLM, Whisper, FFmpeg",
    status: "In production, powering a 32-lesson course",
    outcome: "About 80% less time per lesson (an estimate, not a measurement)",
  },
  {
    folder: "Zoom recording automation", slug: "zoom-backup",
    line: "Backs up every class recording to S3, matches it to its lesson and collects attendance.",
    role: "Backend",
    stack: "Spring Boot, Zoom API, S3, MySQL, React",
    status: "In production",
    outcome: "150 GB of Zoom cloud storage freed",
  },
  {
    folder: "AI workout planner", slug: "workout-planner",
    line: "Builds a personal workout plan from an open-source exercise library, then guides each session.",
    role: "Full stack, part-time at 852HealthKare",
    stack: "Vue.js, Quasar, TypeScript, MongoDB",
    status: "Built from Nov 2025 to Jan 2026",
    outcome: "1,000+ exercises cleaned and indexed",
  },
  {
    folder: "Culinary Companion", slug: "culinary-companion",
    line: "A hands-free recipe app: hand gestures and voice commands move through the steps.",
    role: "Personal project",
    stack: "React, browser-based computer vision",
    status: "Live demo",
    outcome: "Each step is read aloud, so your hands can stay in the flour",
    live: "https://culnary-companion-bhy9.vercel.app",
  },
  {
    folder: "Creative AI Agent Quest", slug: "agent-quest",
    line: "A gamified, AI-coached course for anyone learning to build with AI agents.",
    role: "Personal project. Started for one learner, built for everyone.",
    stack: "Next.js, Postgres (Neon), Vercel Blob",
    status: "Live, public repo",
    outcome: "Includes Spark, a streaming AI coach, and a mentor dashboard",
    live: "https://creative-ai-agent-quest.vercel.app",
    repo: "https://github.com/akib-arifeen/ai-agent-learning-quest",
  },
  {
    folder: "LoopCraft", slug: "loopcraft",
    line: "A multi-track audio looper that runs in the browser.",
    role: "Personal project",
    stack: "Web app, browser audio",
    status: "Live. Rebuilt as a looper that works with no microphone",
    outcome: "Quantised recording, overdubs, per-track mix and WAV export",
    live: "https://loop-craft-six.vercel.app",
    repo: "https://github.com/akib-arifeen/loop-craft",
  },
  {
    folder: "Gravity Wars", slug: "gravity-wars",
    line: "Space combat where gravity does the steering: you against a fleet of AI bots, in the browser.",
    role: "Personal project",
    stack: "Web app",
    status: "Live. Rebuilt with a difficulty menu",
    outcome: "Playable offline in the browser against bots on three difficulty levels",
    live: "https://gravity-warsio.vercel.app",
  },
  {
    folder: "Léyci storefront", slug: "leyci",
    line: "A bilingual storefront for a Hong Kong label, built as a self-initiated concept.",
    role: "Self-initiated concept, built by me",
    stack: "Astro (SSR), Cloudflare Pages, D1",
    status: "Live demo, private repo",
    outcome: "From an Instagram account to a live bilingual storefront in about a day",
    live: "https://leyci.pages.dev",
  },
  {
    folder: "Shortest-path engine", slug: "shortest-path",
    line: "Exact many-to-many travel-time tables on road networks.",
    role: "Final-year project",
    stack: "C++17, CMake, OpenMP",
    status: "In progress. Code on request.",
    outcome: "Studying search reuse, multi-core parallelism and vertex reordering on DIMACS graphs",
  },
  {
    folder: "Twinkle Star", slug: "twinkle-star",
    line: "A Flutter app built from a UX design by a CityU SM2609 team.",
    role: "I built the app. The design is the team's.",
    stack: "Flutter",
    status: "Prototype, not finished",
    outcome: "A playable web build exists",
  },
];

function projectFolder(p: Project): FsFolder {
  const links = [`/work/${p.slug}`, p.live, p.repo].filter(Boolean).join(", ");
  const readme = [
    `# ${p.folder}`,
    p.line,
    "",
    `Role: ${p.role}`,
    `Stack: ${p.stack}`,
    `Status: ${p.status}`,
    `Outcome: ${p.outcome}`,
    `Links: ${links}`,
  ].join("\n");
  const children: FsNode[] = [text("README.md", readme)];
  if (getWork(p.slug)) children.push(link("Case study.webloc", `/work/${p.slug}`));
  if (p.live) children.push(link("Open live.webloc", p.live));
  return folder(p.folder, children);
}

function pictures(): FsFile[] {
  const used = new Set<string>();
  return photos.map((ph) => {
    let name = `${ph.caption}.jpg`;
    for (let n = 2; used.has(name); n++) name = `${ph.caption} ${n}.jpg`;
    used.add(name);
    return { kind: "file", name, type: "image", src: ph.src, modified: ph.date };
  });
}

const howNote = notes.find((n) => n.id === "how");

/**
 * The whole tree, built once at module load from lib/content.ts, lib/desk.ts, lib/work.ts and lib/os/* data.
 * Required folders: /Applications (one `<Name>.app` file per registry app, each with `open` set),
 * /Users/akib/{Desktop, Documents, Downloads, Pictures, Music, Projects}, and /Trash.
 * See the worker spec for what goes inside them.
 */
export const fsRoot: FsFolder = {
  kind: "folder",
  name: "",
  children: [
    folder("Applications", apps.map((a): FsFile => ({
      kind: "file", name: `${a.name}.app`, type: "app", modified: MODIFIED, open: { type: "open", app: a.id },
    }))),
    folder("Users", [
      folder("akib", [
        folder("Desktop", [
          cvPdf(),
          link("Projects", "/Users/akib/Projects", { type: "open", app: "files", arg: { path: "/Users/akib/Projects" } }),
          link("All work.webloc", "/work"),
        ]),
        folder("Documents", [cvPdf(), text("How I work.txt", howNote ? howNote.body.join("\n\n") : "")]),
        folder("Downloads", []),
        folder("Pictures", pictures()),
        folder("Music", playlists.map((pl, i) => link(`${pl.name}.playlist`, pl.embed, { type: "open", app: "music", arg: { playlist: i } }))),
        folder("Projects", PROJECTS.map(projectFolder)),
      ]),
    ]),
    folder("Trash", [
      text(
        "Portfolio OS v1 (retired).txt",
        "The previous version of this site was a whole fake desktop.\nIts best ideas live in this laptop now.",
      ),
    ]),
  ],
};

/**
 * Resolve `path` against `cwd` (default HOME) into a normalized absolute path. Pure string work: the path need not exist.
 * "~" and "~/x" expand to HOME; "." is dropped; ".." removes one segment (".." at "/" stays "/"); repeated and trailing
 * slashes are dropped. The result starts with "/" and never ends with "/" except the root itself, "/".
 * Examples: ("Projects", "/Users/akib") → "/Users/akib/Projects"; ("../..", "/Users/akib") → "/"; ("~/") → "/Users/akib".
 */
export function normalizePath(path: string, cwd: string = HOME): string {
    const expanded = path === "~" || path.startsWith("~/") ? HOME + path.slice(1) : path;
  const full = expanded.startsWith("/") ? expanded : `${cwd}/${expanded}`;
  const out: string[] = [];
  for (const seg of full.split("/")) {
    if (seg === "" || seg === ".") continue;
    if (seg === "..") out.pop();
    else out.push(seg);
  }
  return "/" + out.join("/");
}

/** The node at normalizePath(path, cwd), or null. Exact, case-sensitive segment match. "/" is fsRoot. */
export function resolvePath(path: string, cwd: string = HOME): FsNode | null {
    let node: FsNode = fsRoot;
  for (const seg of normalizePath(path, cwd).split("/")) {
    if (seg === "") continue;
    if (node.kind !== "folder") return null;
    const next: FsNode | undefined = node.children.find((c) => c.name === seg);
    if (!next) return null;
    node = next;
  }
  return node;
}

/**
 * Children of the folder at `path`: folders first, then files; each group sorted by name with
 * a.localeCompare(b, "en", { sensitivity: "base" }). null when the path is missing or is a file.
 */
export function listDir(path: string, cwd: string = HOME): FsNode[] | null {
    const node = resolvePath(path, cwd);
  if (!node || node.kind !== "folder") return null;
  const byName = (a: FsNode, b: FsNode) => a.name.localeCompare(b.name, "en", { sensitivity: "base" });
  return [
    ...node.children.filter((c) => c.kind === "folder").sort(byName),
    ...node.children.filter((c) => c.kind !== "folder").sort(byName),
  ];
}

/**
 * What opening a file does: `file.open` when set; otherwise by type —
 * text/image/pdf/video/audio → { type: "open", app: "preview", arg: { path } };
 * link → { type: "href", href, newTab: true } for http(s) URLs, { type: "href", href } for site paths;
 * app → `file.open` is required for app files (the tree builder always sets it).
 */
export function openAction(file: FsFile, path: string): MenuAction {
    if (file.open) return file.open;
  if (file.type === "link") {
    const href = file.href ?? "/";
    return /^https?:\/\//.test(href) ? { type: "href", href, newTab: true } : { type: "href", href };
  }
  if (file.type === "app") throw new Error(`app file without open action: ${path}`);
  return { type: "open", app: "preview", arg: { path } };
}

/** HOME and anything below it shown with "~": "/Users/akib/Projects" → "~/Projects", "/Users/akib" → "~". Others unchanged. */
export function displayPath(path: string): string {
    if (path === HOME) return "~";
  return path.startsWith(HOME + "/") ? "~" + path.slice(HOME.length) : path;
}
