// Playground items: games and experiments that run inside the laptop. Worker-owned data.
// url/embeddable verified 2026-10-22 with `curl -sIL`: no X-Frame-Options or frame-ancestors on any of the four live sites.
import type { PlayItem } from "./types";

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
    allow: "autoplay; microphone",
    workSlug: "loopcraft",
  },
  {
    slug: "culinary-companion",
    name: "Culinary Companion",
    blurb: "A hands-free recipe app: hand gestures and voice move through the steps.",
    status: "playable",
    url: "https://culnary-companion-bhy9.vercel.app",
    embeddable: true,
    allow: "camera; microphone; autoplay",
    workSlug: "culinary-companion",
  },
  {
    slug: "agent-quest",
    name: "Creative AI Agent Quest",
    blurb: "A gamified, AI-coached course for anyone learning to build with AI agents.",
    status: "playable",
    url: "https://creative-ai-agent-quest.vercel.app",
    embeddable: true,
    workSlug: "agent-quest",
  },
  {
    slug: "twinkle-star",
    name: "Twinkle Star",
    blurb: "A Flutter build of a UX design by a CityU SM2609 team. I built the app.",
    status: "rebuilding",
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
