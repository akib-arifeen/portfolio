import type { Work } from "../work";

const work: Work = {
  slug: "culinary-companion",
  title: "Culinary Companion",
  kicker: "Personal project",
  summary:
    "I built a hands-free recipe app around The Pass, a kitchen-ticket design system meant to be read from a metre away. Gestures and voice move through the steps, each step is called out, and every recipe carries its source and photographer.",
  role: "I built the app, the design system and the content",
  when: "Personal project",
  stack: ["React", "Browser-based computer vision", "Voice commands", "Speech output", "Atkinson Hyperlegible", "Vitest"],
  status: "shipped",
  outcome: { value: "8 recipes", note: "real, licensed content with visible credits; gesture and voice control" },
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
      heading: "What I wanted to build",
      paras: [
        "Recipes assume clean hands. This app is for the moment your hands are covered in flour, so you can move through the steps without touching the screen. Hand gestures and voice commands do the moving, and every step is read aloud.",
        "I did not want a demo with fake recipes in it. The point of a kitchen companion is that it stands on a real counter, so the content had to be real and the interface had to survive being read from a metre away.",
      ],
    },
    {
      kind: "prose",
      heading: "The Pass",
      paras: [
        "Every screen is built on one direction I called The Pass, borrowed from the ticket rail of a restaurant kitchen: orders printed on tickets, read at a glance across a noisy line, called out and answered with Heard.",
        "That is the job here, so the system follows it. Browse is the rail: a grid of recipe tickets, each with a mono header strip for time, steps and serves. A recipe is a full ticket with a Mise en place column and a numbered method. Cooking is the pass, where the current step is set large enough to read from across the room. Settings is station setup.",
        "The type is Atkinson Hyperlegible, designed for character recognition, with its mono cut for every quantity, time and timer. There is one accent, tomato red, reserved for what is live and now: the current step, a running timer, a listening mic. Primary buttons are ink, not orange.",
        "The cooking screen is the product. At 1024 pixels and up the step ticket takes about 62 per cent of the width and the rail holds the timers and the ingredients the step uses, with Back, Read and Next along the bottom edge. Below that the step fills the screen and the rest moves into tabs. Cooking targets are at least 56 pixels, and nothing depends on hover.",
      ],
    },
    {
      kind: "prose",
      heading: "Real content, properly credited",
      paras: [
        "The app has eight real recipes adapted from the Wikibooks Cookbook, and every one of them carries its source page, revision, licence and photographer on the recipe itself.",
        "Timers only appear on steps whose instructions state a time. There are no invented difficulty ratings or cooking totals, because a fake number on a kitchen screen is worse than no number.",
      ],
    },
    {
      kind: "media",
      heading: "The cooking screen",
      items: [
        { kind: "image", src: "/work/culinary-companion/cooking-1280.png", alt: "The cooking screen on a laptop: a step ticket on the left with a large step number and instruction, and a rail on the right holding the HEARD strip, timers and the ingredients for the step.", w: 1280, h: 800, caption: "The pass on a laptop. The step ticket dominates, and the rail keeps the heard strip, the timers and the ingredients in view." },
        { kind: "image", src: "/work/culinary-companion/cooking-390.png", alt: "The same cooking screen on a phone: the HEARD strip across the top, then the step ticket, with Back, Read it again and Next step at the bottom.", w: 390, h: 844, caption: "The phone layout. The step fills the screen and the controls stay at the edge." },
      ],
    },
    {
      kind: "steps",
      heading: "How you drive it",
      items: [
        { title: "Hand gestures", body: "Hold a gesture for about half a second: thumb up for the next step, thumb down for the previous one, open palm to hear the step again, a V sign for the ingredients, point up to start the step timer, a fist to pause it." },
        { title: "Voice", body: "Say next, back, repeat, step three, ingredients, or ask for a timer: seven minutes, half an hour. The voice layer and the gestures fire the same commands as the buttons and the keys." },
        { title: "Timers that keep going", body: "A timer started on a step keeps running when you leave the cooking screen. It chimes when it finishes, and the cooking screen also announces it aloud." },
        { title: "Onboarding with live practice", body: "A short hands-free tutorial teaches the gestures with a live camera preview, and a help sheet can be opened at any time. Your place in a recipe is saved in the browser." },
      ],
    },
    {
      kind: "decisions",
      heading: "The calls I would defend",
      items: [
        {
          choice: "Design for one metre, not one screen",
          why: "The app is read from across a counter by someone whose hands are busy, so the current step is a size container that grows to fill the space it has, quantities are mono, and actions sit at the edge where a wet hand can reach them.",
          cost: "The layout has to work in a short embed as well as a tall phone, so the step and the controls are measured in container units rather than in fixed pixels.",
        },
        {
          choice: "Real, licensed recipes with credits on every ticket",
          why: "A cooking app with placeholder recipes is a mockup. A real source, revision, licence and photographer can be shown on the recipe without getting in the way.",
          cost: "Less content than a lorem-filled demo, and every new recipe needs its credits checked before it ships.",
        },
        {
          choice: "Every input method fires the same command",
          why: "Voice can be denied, a camera can be covered, and a guest can just tap. One command layer means the app never depends on one input method.",
          cost: "Every control has to be routed through the same commands, and each command needs a test for each input.",
        },
        {
          choice: "One accent, one meaning",
          why: "Tomato red only ever means live or now, so the accent keeps its meaning in a bright kitchen. Primary actions are ink.",
          cost: "A lot of the interface is deliberately quiet, which makes hierarchy the thing that has to work.",
        },
      ],
    },
    {
      kind: "facts",
      heading: "Measured",
      items: [
        { value: "8", label: "real recipes", note: "adapted from the Wikibooks Cookbook, each with source, revision, licence and photographer" },
        { value: "56 px", label: "minimum cooking target", note: "primary actions sit at the screen edge, not mid-content" },
        { value: "1 m", label: "reading distance the system is designed for", note: "the current step scales up to 4.5rem in a size container" },
        { value: "4", label: "input methods", note: "touch, keyboard, voice and hand gestures, all firing the same commands" },
      ],
    },
    {
      kind: "prose",
      heading: "Where it stands",
      paras: [
        "The demo is live. Every screen has been rebuilt on The Pass with real, licensed content, and the credits stay with the recipes.",
        "The known limits are in the app: computer vision is the least reliable input and depends on light and camera position, so the other three input methods are always there. The demo is a personal project, not a product with a support line.",
      ],
    },
  ],
  related: ["photobooth", "workout-planner"],
};

export default work;
