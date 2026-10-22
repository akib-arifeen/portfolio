// akibOS app registry — names, window sizes, dock order and app menus. Pure data (no React), so engines and tests import it.
import type { AppDef, AppId } from "./types";

export const apps: AppDef[] = [
  {
    id: "files", name: "Files", size: { w: 880, h: 560 }, minSize: { w: 520, h: 320 }, dock: true,
    blurb: "Every project as a folder: READMEs, screenshots, live links and case studies.",
    menus: [{
      label: "Go",
      items: [
        { label: "Projects", shortcut: "⇧⌥P", action: { type: "open", app: "files", arg: { path: "/Users/akib/Projects" } } },
        { label: "Desktop", action: { type: "open", app: "files", arg: { path: "/Users/akib/Desktop" } } },
        { label: "Documents", action: { type: "open", app: "files", arg: { path: "/Users/akib/Documents" } } },
        { label: "Pictures", action: { type: "open", app: "files", arg: { path: "/Users/akib/Pictures" } } },
        { label: "Applications", action: { type: "open", app: "files", arg: { path: "/Applications" } } },
        "separator",
        { label: "Trash", action: { type: "open", app: "files", arg: { path: "/Trash" } } },
      ],
    }],
  },
  {
    id: "browser", name: "Browser", size: { w: 1080, h: 700 }, minSize: { w: 560, h: 380 }, dock: true,
    blurb: "The live projects, running for real.",
    menus: [{
      label: "Bookmarks",
      items: [
        { label: "Creative AI Agent Quest", action: { type: "open", app: "browser", arg: { url: "https://creative-ai-agent-quest.vercel.app" } } },
        { label: "Léyci storefront", action: { type: "open", app: "browser", arg: { url: "https://leyci.pages.dev" } } },
        { label: "LoopCraft", action: { type: "open", app: "browser", arg: { url: "https://loop-craft-six.vercel.app" } } },
        { label: "Gravity Wars", action: { type: "open", app: "browser", arg: { url: "https://gravity-warsio.vercel.app" } } },
        { label: "Culinary Companion", action: { type: "open", app: "browser", arg: { url: "https://culnary-companion-bhy9.vercel.app" } } },
      ],
    }],
  },
  {
    id: "mail", name: "Mail", size: { w: 640, h: 540 }, minSize: { w: 420, h: 360 }, dock: true,
    blurb: "Write to me. I read everything.",
    menus: [{ label: "Message", items: [{ label: "New Message", action: { type: "open", app: "mail" } }] }],
  },
  {
    id: "notes", name: "Notes", size: { w: 840, h: 560 }, minSize: { w: 520, h: 340 }, dock: true,
    blurb: "Behind-the-scenes write-ups of how things were really built.",
    menus: [],
  },
  {
    id: "photos", name: "Photos", size: { w: 920, h: 620 }, minSize: { w: 480, h: 340 }, dock: true,
    blurb: "Life outside the code.",
    menus: [],
  },
  {
    id: "music", name: "Music", size: { w: 560, h: 660 }, minSize: { w: 380, h: 420 }, dock: true,
    blurb: "What's on repeat while I build.",
    menus: [],
  },
  {
    id: "calendar", name: "Calendar", size: { w: 920, h: 640 }, minSize: { w: 560, h: 420 }, dock: true,
    blurb: "The timeline: what shipped, and when.",
    menus: [],
  },
  {
    id: "playground", name: "Playground", size: { w: 980, h: 660 }, minSize: { w: 520, h: 380 }, dock: true,
    blurb: "Games and experiments you can play right here.",
    menus: [{
      label: "Games",
      items: [
        { label: "Gravity Wars", action: { type: "open", app: "playground", arg: { game: "gravity-wars" } } },
        { label: "LoopCraft", action: { type: "open", app: "playground", arg: { game: "loopcraft" } } },
      ],
    }],
  },
  {
    id: "terminal", name: "Terminal", size: { w: 740, h: 480 }, minSize: { w: 420, h: 260 }, dock: true,
    blurb: "A real little shell. Try `help`, `neofetch` or `sudo hire-me`.",
    menus: [{
      label: "Shell",
      items: [
        { label: "neofetch", action: { type: "open", app: "terminal", arg: { command: "neofetch" } } },
        { label: "List projects", action: { type: "open", app: "terminal", arg: { command: "projects" } } },
      ],
    }],
  },
  {
    id: "preview", name: "Preview", size: { w: 760, h: 840 }, minSize: { w: 420, h: 420 }, dock: false,
    blurb: "Opens the CV, images, videos and READMEs.",
    menus: [],
  },
  {
    id: "about", name: "About This Laptop", size: { w: 400, h: 480 }, minSize: { w: 400, h: 480 }, dock: false,
    blurb: "Specs of the machine, and of the person.",
    menus: [],
  },
];

const byId = new Map(apps.map((a) => [a.id, a]));

export function appDef(id: AppId): AppDef {
  const def = byId.get(id);
  if (!def) throw new Error(`unknown app: ${id}`);
  return def;
}

/** Case-insensitive lookup by id or display name ("notes", "Notes", "about this laptop"); null when unknown. */
export function findApp(name: string): AppDef | null {
  const q = name.trim().toLowerCase();
  return apps.find((a) => a.id === q || a.name.toLowerCase() === q) ?? null;
}
