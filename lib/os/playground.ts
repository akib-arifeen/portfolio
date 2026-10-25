// Playground items: games and experiments that run inside the laptop. Worker-owned data.
// url/embeddable verified 2026-10-23 with `curl -sIL`: no X-Frame-Options or frame-ancestors on the live sites. Twinkle is live but opens in its own tab because its pairing demo needs two tabs.
import type { PlayItem } from "./types";

/** Capabilities a play page may hand to a third-party frame. Camera and microphone are only
    delegated after the visitor asks for them; everything else (autoplay, fullscreen, gamepad) is
    safe to grant up front so the game can start. */
export type PlayPermissions = {
  /** The allow tokens the frame gets without asking, e.g. "autoplay; fullscreen". */
  base: string;
  camera: boolean;
  microphone: boolean;
};

/** What every embed gets: its own scripts and origin (so its storage and audio work) and downloads, and nothing that can reach this page. */
export const PLAY_SANDBOX = "allow-scripts allow-same-origin allow-downloads";

/** The feature a token grants: `camera *` and `microphone 'self'` name camera and microphone just as plainly as `camera` does. */
function featureOf(token: string): string {
  return token.trim().split(/\s+/)[0].toLowerCase();
}

export function playPermissions(allow?: string): PlayPermissions {
  const base: string[] = [];
  const gated = { camera: false, microphone: false };
  for (const token of (allow ?? "").split(";").map((t) => t.trim()).filter(Boolean)) {
    const feature = featureOf(token);
    // any allowlist form is still the feature: it must be gated, never passed through as if it were safe
    if (feature === "camera" || feature === "microphone") gated[feature] = true;
    else base.push(token);
  }
  return { base: base.join("; "), ...gated };
}

/** The allow attribute for a frame, with the visitor-gated capabilities only when granted. */
export function allowFor(perms: PlayPermissions, shared: boolean): string | undefined {
  const tokens = [perms.base, shared && perms.camera ? "camera" : "", shared && perms.microphone ? "microphone" : ""]
    .filter(Boolean)
    .join("; ");
  return tokens || undefined;
}


export const playItems: PlayItem[] = [
  {
    slug: "gravity-wars",
    name: "Gravity Wars",
    blurb: "A browser gravity brawler. Play bots on three difficulty levels, offline.",
    status: "playable",
    url: "https://gravity-warsio.vercel.app",
    embeddable: true,
    allow: "fullscreen; gamepad",
    workSlug: "gravity-wars",
  },
  {
    slug: "loopcraft",
    name: "LoopCraft",
    blurb: "A browser multi-track looper. One tap plays a demo, no microphone needed.",
    status: "playable",
    url: "https://loop-craft-six.vercel.app",
    embeddable: true,
    allow: "autoplay; fullscreen; microphone",
    workSlug: "loopcraft",
  },
  {
    slug: "culinary-companion",
    name: "Culinary Companion",
    blurb: "A hands-free recipe app: hand gestures and voice move through the steps.",
    status: "playable",
    url: "https://culnary-companion-bhy9.vercel.app",
    embeddable: true,
    allow: "camera; microphone; autoplay; fullscreen",
    workSlug: "culinary-companion",
  },
  {
    slug: "agent-quest",
    name: "Creative AI Agent Quest",
    blurb: "A gamified, AI-coached course for anyone learning to build with AI agents.",
    status: "playable",
    url: "https://creative-ai-agent-quest.vercel.app",
    embeddable: true,
    allow: "fullscreen",
    workSlug: "agent-quest",
  },
  {
    slug: "save-your-princess",
    name: "Save Your Princess",
    blurb: "A 3D narrative game in development. This slice: mend broken windows in a dream castle and watch the light answer you.",
    status: "beta",
    url: "https://syp-playtest.vercel.app/?slice=1",
    embeddable: true,
    allow: "fullscreen",
    // the one embed that needs more: its 3D camera asks for pointer lock, which a sandbox blocks unless it is named
    sandbox: `${PLAY_SANDBOX} allow-pointer-lock`,
    workSlug: "save-your-princess",
  },
  {
    slug: "twinkle-star",
    name: "Twinkle Star",
    blurb: "A Flutter build of a UX design by a CityU SM2609 team. I built the app. Open it in its own tab and pair two tabs on one device.",
    status: "beta",
    url: "https://twinkle-star-liart.vercel.app",
    embeddable: false,
    workSlug: "twinkle-star",
  },
  {
    slug: "portfolio-v1",
    name: "Portfolio OS v1",
    blurb: "My first portfolio, built as an operating system. Retired.",
    status: "retired",
    embeddable: false,
  },
];
