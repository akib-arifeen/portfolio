import type { Work } from "../work";

const work: Work = {
  slug: "culinary-companion",
  title: "Culinary Companion",
  kicker: "Personal project",
  summary:
    "A hands-free recipe app. Hand gestures and voice commands move through the steps, and each step is read aloud.",
  role: "Built the app",
  when: "Personal project",
  stack: ["React", "Browser-based computer vision", "Voice commands", "Speech output"],
  status: "shipped",
  outcome: { value: "Hands-free", note: "gesture and voice control" },
  links: [{ label: "Open the demo", href: "https://culnary-companion-bhy9.vercel.app/" }],
  cover: {
    kind: "image",
    src: "/work/culinary-companion/cover.jpg",
    alt: "Culinary Companion on a laptop: the ingredients list for Creamy Chicken Curry with a hand gesture recognised as Ingredients, and a Next button.",
    w: 1280,
    h: 800,
  },
  playSlug: "culinary-companion",
  blocks: [
    {
      kind: "prose",
      heading: "The problem it solves",
      paras: [
        "Recipes assume clean hands. This one is for when your hands are covered in flour, so you can move through the steps without touching the screen.",
      ],
    },
    {
      kind: "steps",
      heading: "How it works",
      items: [
        { title: "Move with your hands or your voice", body: "Hand gestures and voice commands move through the recipe steps, so the screen never needs a touch." },
        { title: "Vision in the browser", body: "Gestures are recognised with computer vision that runs in the browser." },
        { title: "Each step read aloud", body: "The app reads each step out loud, so you can keep your eyes on the pan." },
      ],
    },
    {
      kind: "prose",
      heading: "Try it",
      paras: [
        "The demo is live. Open it, allow the camera and microphone if you want gestures and voice, and cook along.",
      ],
    },
  ],
  related: ["photobooth", "workout-planner"],
};

export default work;
