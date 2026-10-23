// Browser bookmarks: the live projects. Each `embeddable` flag is verified with `curl -sIL` (no X-Frame-Options / frame-ancestors). Worker-owned data.
// Checked 2026-10-23: every project site returns 200 with no X-Frame-Options and no CSP; github.com returns X-Frame-Options: deny and frame-ancestors 'none'.
import type { Site } from "./types";

export const sites: Site[] = [
  {
    id: "agent-quest",
    title: "Creative AI Agent Quest",
    url: "https://creative-ai-agent-quest.vercel.app",
    embeddable: true,
    blurb: "A gamified, AI-coached course for anyone learning to build with AI agents.",
    workSlug: "agent-quest",
  },
  {
    id: "leyci",
    title: "Léyci storefront",
    url: "https://leyci.pages.dev",
    embeddable: true,
    blurb: "A self-initiated concept: a bilingual storefront for a Hong Kong womenswear label.",
    workSlug: "leyci",
  },
  {
    id: "loopcraft",
    title: "LoopCraft",
    url: "https://loop-craft-six.vercel.app",
    embeddable: true,
    blurb: "A browser multi-track looper. One tap plays a demo, no microphone needed.",
    workSlug: "loopcraft",
  },
  {
    id: "gravity-wars",
    title: "Gravity Wars",
    url: "https://gravity-warsio.vercel.app",
    embeddable: true,
    blurb: "A browser gravity brawler. Play bots on three difficulty levels, offline.",
    workSlug: "gravity-wars",
  },
  {
    id: "save-your-princess",
    title: "Save Your Princess",
    url: "https://syp-playtest.vercel.app/?slice=1",
    embeddable: true,
    blurb: "A 3D narrative game in development. This slice: mend broken windows in a dream castle and watch the light answer you.",
    workSlug: "save-your-princess",
  },
  {
    id: "culinary-companion",
    title: "Culinary Companion",
    url: "https://culnary-companion-bhy9.vercel.app",
    embeddable: true,
    blurb: "A hands-free recipe app: hand gestures and voice move through the steps.",
    workSlug: "culinary-companion",
  },
  {
    id: "github",
    title: "GitHub",
    url: "https://github.com/akib-arifeen",
    embeddable: false,
    blurb: "My public code.",
  },
];
