// akibOS — the laptop layer's shared contract. Workers code against these types; only the lead changes them.
import type { ReactNode } from "react";

/* ── Apps ─────────────────────────────────────────────────────────── */

export type AppId =
  | "files" | "browser" | "notes" | "photos" | "music" | "calendar"
  | "mail" | "terminal" | "playground" | "preview" | "about";

/** What an app was asked to show. Apps read only the fields they understand and ignore the rest. */
export type LaunchArg = {
  path?: string;        // files: folder to show · preview: file to show (absolute virtual-FS path)
  url?: string;         // browser: page to load (must be in lib/os/sites.ts)
  noteId?: string;      // notes: note to select
  photoIndex?: number;  // photos: open the viewer at this index
  playlist?: number;    // music: playlist index to load
  game?: string;        // playground: slug of the item to start
  command?: string;     // terminal: command to run once on open
};

/** Everything a menu item, notification, search result or terminal command can ask the OS to do. */
export type MenuAction =
  | { type: "open"; app: AppId; arg?: LaunchArg }
  | { type: "href"; href: string; newTab?: boolean }   // site path ("/work/…") or absolute URL
  | { type: "close-window" }                            // the focused window
  | { type: "minimize" }                                // the focused window
  | { type: "zoom" }                                    // toggle maximize on the focused window
  | { type: "quit-app" }                                // every window of the focused app
  | { type: "search" }
  | { type: "lock" }
  | { type: "exit" };                                   // close the lid: back to the 3D room

export type MenuItem = { label: string; shortcut?: string; action: MenuAction; disabled?: boolean } | "separator";
export type MenuDef = { label: string; items: MenuItem[] };

export type AppDef = {
  id: AppId;
  name: string;
  /** Preferred window size in CSS px; clamped to the work area on open. */
  size: Size;
  /** Smallest size a user can resize to. */
  minSize: Size;
  /** Shown in the dock, in registry order, when true. */
  dock: boolean;
  /** App-specific menus, shown after the shell's File/Edit/View menus and before Window/Help. */
  menus: MenuDef[];
  /** One line, used by Search and the About box. */
  blurb: string;
};

/* ── Window manager ──────────────────────────────────────────────── */

export type Size = { w: number; h: number };
export type Rect = { x: number; y: number; w: number; h: number };

export type WinState = {
  id: string;            // `${app}-${seq}`, unique for the session
  app: AppId;
  title: string;         // the app's name until the app calls os.setTitle
  rect: Rect;            // the normal (un-maximized) frame in viewport px; kept while minimized or maximized
  minimized: boolean;
  maximized: boolean;
  z: number;             // stacking order; higher is in front
  arg?: LaunchArg;       // latest launch argument
  launch: number;        // starts at 1; +1 every time `open` targets this existing window
};

export type WmState = { wins: WinState[]; z: number; seq: number; focused: string | null };

export type WmAction =
  | { type: "open"; app: AppId; arg?: LaunchArg; viewport: Size }
  | { type: "close"; id: string }
  | { type: "quitApp"; app: AppId }
  | { type: "focus"; id: string }
  | { type: "minimize"; id: string }
  | { type: "restore"; id: string }
  | { type: "toggleMaximize"; id: string }
  | { type: "move"; id: string; x: number; y: number; viewport: Size }
  | { type: "resize"; id: string; rect: Rect; viewport: Size }
  | { type: "setTitle"; id: string; title: string }
  | { type: "fit"; viewport: Size };

/* ── OS services, available to apps through useOs() ──────────────── */

export type Appearance = "light" | "dark";

export type Notice = {
  title: string;
  body: string;
  app?: AppId;           // whose icon the banner shows
  action?: MenuAction;   // run when the banner is clicked
  ttlMs?: number;        // auto-dismiss delay, default 6000; 0 = stays until dismissed
};

export type OsApi = {
  wide: boolean;                                   // true on the desktop shell, false on the phone shell
  open(app: AppId, arg?: LaunchArg): void;
  close(winId: string): void;
  setTitle(winId: string, title: string): void;
  notify(n: Notice): void;
  run(action: MenuAction): void;                   // one entry for menus, notices, search and terminal
  openSearch(): void;
  exit(): void;                                    // close the lid
  sound: { on: boolean; toggle(): void; blip(kind: "hover" | "click" | "open" | "print"): void };
};

/** Every app component receives exactly this; everything else comes from useOs() and lib data. */
export type AppProps = { win: { id: string; arg?: LaunchArg; launch: number; focused: boolean } };

/* ── Virtual file system ─────────────────────────────────────────── */

export type FsFile = {
  kind: "file";
  name: string;                            // with extension: "README.md", "cv.pdf", "Open live.webloc"
  type: "text" | "image" | "pdf" | "link" | "app" | "video" | "audio";
  text?: string;                           // type "text": the contents (markdown-ish plain text)
  src?: string;                            // image/pdf/video/audio: public URL ("/desk/…", "/work/…")
  href?: string;                           // link: site path or absolute URL
  open?: MenuAction;                       // what opening it does; when omitted the type decides (see fs.ts)
  size?: string;                           // display only, e.g. "84 KB"
  modified?: string;                       // display only, e.g. "22 Oct 2026"
};
export type FsFolder = { kind: "folder"; name: string; children: FsNode[]; modified?: string };
export type FsNode = FsFile | FsFolder;

/* ── Search ──────────────────────────────────────────────────────── */

export type SearchKind = "app" | "project" | "file" | "note" | "photo" | "site" | "command" | "page";
export type SearchItem = {
  id: string;            // unique within an index
  kind: SearchKind;
  title: string;
  subtitle?: string;
  keywords?: string[];
  action: MenuAction;
};

/* ── Terminal ────────────────────────────────────────────────────── */

export type TermTone = "out" | "err" | "dim" | "accent" | "ok" | "echo";
export type TermLine = { text: string; tone?: TermTone };
export type TermCtx = { cwd: string; history: readonly string[]; now: Date };
export type TermResult = {
  lines: TermLine[];     // output only — the UI echoes the prompt + input itself
  cwd: string;           // working directory after the command
  clear?: boolean;       // wipe the scrollback before printing `lines`
  action?: MenuAction;   // the UI runs it after printing (open an app, exit, …)
};

/* ── Browser, Playground, Calendar data ──────────────────────────── */

export type Site = {
  id: string;
  title: string;
  url: string;           // https URL
  embeddable: boolean;   // verified: no X-Frame-Options / frame-ancestors blocking a cross-origin iframe
  blurb: string;
  workSlug?: string;     // case study at /work/<slug>
};

export type PlayItem = {
  slug: string;
  name: string;
  blurb: string;
  status: "playable" | "beta" | "rebuilding" | "retired";
  url?: string;          // where it runs; iframed in Playground when `embeddable`
  embeddable: boolean;
  allow?: string;        // iframe `allow` attribute, e.g. "autoplay; microphone; fullscreen"
  sandbox?: string;      // iframe `sandbox` attribute when the default set is too tight for the game
  workSlug?: string;
};

export type CalEvent = {
  start: string;         // ISO date "YYYY-MM-DD"
  end?: string;          // inclusive ISO date for multi-day items
  title: string;
  kind: "ship" | "event" | "work" | "study" | "life";
  note?: string;
  action?: MenuAction;
};

/* ── Shell component props (components/os/*) ─────────────────────── */

export type WindowProps = {
  win: WinState;
  def: AppDef;
  viewport: Size;
  focused: boolean;
  onFocus(): void;
  onClose(): void;
  onMinimize(): void;
  onToggleMaximize(): void;
  onMove(x: number, y: number): void;
  onResize(rect: Rect): void;
  children: ReactNode;
};
export type DockProps = {
  wins: WinState[];
  onOpen(app: AppId): void;          // launch, or bring the app's window forward
  onRestore(winId: string): void;    // a minimized window's thumbnail in the dock
  onTrash(): void;
};
export type MenuBarProps = {
  app: AppDef | null;                // focused app; null shows the desktop's "Files" menus
  onAction(a: MenuAction): void;
  onSearch(): void;
  onControlCentre(): void;
  controlCentreOpen: boolean;
  onExit(): void;                    // close the laptop and go back to the page
};
export type SearchProps = { open: boolean; onClose(): void; onPick(item: SearchItem): void };
export type ControlCentreProps = {
  open: boolean;
  onClose(): void;
  appearance: Appearance;
  onAppearance(a: Appearance): void;
  soundOn: boolean;
  onToggleSound(): void;
  brightness: number;                // 0.4 … 1
  onBrightness(v: number): void;
};
export type NotificationsProps = {
  notices: (Notice & { id: string })[];
  onDismiss(id: string): void;
  onAct(id: string): void;
};
export type LockScreenProps = { onUnlock(): void; onExit(): void };
export type WallpaperProps = { appearance: Appearance };
export type DesktopIconsProps = { onOpen(path: string): void };
export type AppIconProps = { id: AppId; size?: number };
export type PhoneShellProps = { onExit(): void };
