import type { Work } from "../work";

const work: Work = {
  slug: "gravity-wars",
  title: "Gravity Wars",
  kicker: "Personal project · 2026",
  summary:
    "A browser gravity brawler. Endless is the default: eat debris, absorb smaller rivals, slingshot around stars and climb a live top ten while bots of varied skill drop in and out. Entirely offline.",
  role: "Rebuilt the game: simulation, bots, rendering, sound, controls and tests",
  when: "Rebuilt October 2026",
  stack: ["TypeScript", "Canvas 2D", "Web Audio", "React 19", "Next.js 15.5 static export", "Vitest"],
  status: "shipped",
  outcome: { value: "534 tests", note: "60 of 60 seeded runs match an independent Python reference; 5 arenas and 23 achievements" },
  links: [
    { label: "Play it live", href: "https://gravity-warsio.vercel.app" },
    { label: "Source on GitHub", href: "https://github.com/akib-arifeen/gravity-wars.io" },
    { label: "Phase A pull request", href: "https://github.com/akib-arifeen/gravity-wars.io/pull/3" },
  ],
  cover: {
    kind: "image",
    src: "/work/gravity-wars/desktop-3-action.png",
    alt: "A round of Gravity Wars: the player's cyan body in open space with a glowing star, a wormhole and several rival bodies ringed in red, with mass, timer and a minimap on screen.",
    w: 1600,
    h: 1000,
  },
  playSlug: "gravity-wars",
  blocks: [
    {
      kind: "prose",
      heading: "A game where the physics has to be right",
      paras: [
        "Endless is the default. The arena never ends, you respawn, bots of varied skill drop in and out, mass decays above 80, and a live top ten puts a crown on the leader. The original timed round is still there, with Easy, Normal or Hard and 3, 5 or 7 rivals.",
        "You grow by eating debris and absorbing smaller bodies. Dash, repulse and a singularity ultimate turn gravity into a weapon, and a clean slingshot around a star releases a speed burst.",
        "I wrote the simulation in plain TypeScript with no React and no DOM in it, and the game has no runtime dependencies beyond Next.js and React.",
      ],
    },
    {
      kind: "media",
      heading: "In play",
      items: [
        { kind: "image", src: "/work/gravity-wars/desktop-1-menu.png", alt: "The Gravity Wars menu over a live attract-mode round.", w: 1600, h: 1000, caption: "The menu, with a live round running behind it." },
        { kind: "image", src: "/work/gravity-wars/desktop-2-midround.png", alt: "An early Gravity Wars round with a rival in a green prey ring and off-screen threat arrows.", w: 1600, h: 1000, caption: "Early in a round: a rival in a green prey ring and arrows pointing at threats off screen." },
        { kind: "image", src: "/work/gravity-wars/desktop-4-victory.png", alt: "The Gravity Wars victory screen showing Critical mass reached.", w: 1600, h: 1000, caption: "Victory on Easy: critical mass reached, 131 mass at 1:49." },
        { kind: "image", src: "/work/gravity-wars/phone.png", alt: "Gravity Wars on a phone mid-round, with a floating joystick, a PULL button and a minimap.", w: 780, h: 1688, caption: "The touch layout: a floating joystick and a PULL button." },
      ],
    },
    {
      kind: "code",
      heading: "A fixed-timestep simulation",
      lang: "ts",
      code: "export const CONFIG = {\n  /** Fixed physics step (s). The render loop runs an accumulator over this. */\n  dt: 1 / 60,\n  /** Max fixed steps per rendered frame; extra backlog is dropped so a stall cannot spiral. */\n  maxStepsPerFrame: 5,\n  /** Real frame time is clamped to this (s) before it enters the accumulator. */\n  maxFrameDt: 0.25,",
      caption:
        "Physics advances in steps of exactly 1/60 s, whatever the screen's frame rate is, and the renderer interpolates between steps. If a frame stalls, the backlog is capped at 5 steps and the rest is dropped, so a slow frame cannot snowball into a spiral of catch-up work. Because of the fixed step, a seed plus a sequence of inputs replays the same round.",
      source: "gravity-wars · game/config.ts",
    },
    {
      kind: "code",
      heading: "The multiplayer seam",
      lang: "ts",
      code: "/**\n * What a controller wants one body to do for one fixed step.\n *\n * Multiplayer seam: every body is driven only through an Intent. Today the local player's\n * intent comes from keyboard/mouse/touch and each bot's from botIntent(). A networked mode\n * would feed remote players' intents into the same step() call (lockstep or server-side),\n * with no change to the engine.\n */\nexport interface Intent {\n  /** Thrust vector. The engine clamps its length to 1; (0, 0) means coast. */\n  ax: number\n  ay: number\n  /** Hold to use the pull ability (drains energy). */\n  pull: boolean\n}",
      caption:
        "The player and every bot go through the same small input, an Intent. That keeps the engine ignorant of who is steering a body. Multiplayer is not built: the game is offline-first, and this is the seam where remote players would plug in later.",
      source: "gravity-wars · game/types.ts",
    },
    {
      kind: "steps",
      heading: "What Phase A adds",
      items: [
        { title: "Gravity as a weapon", body: "Dash to escape or lunge, repulse to shove a rival into a star, and a singularity ultimate that turns you into a temporary black hole. A clean slingshot releases a speed burst." },
        { title: "A living arena", body: "Six announced cosmic events, from meteor showers to a pulsar beam, across five arenas: Classic, Binary, The Maw, Nebula Field and The Belt." },
        { title: "A reason to come back", body: "23 achievements, lifetime stats and an in-arena top ten. All of it runs offline; the leaderboard is local because there is no server." },
      ],
    },
    {
      kind: "steps",
      heading: "The bots",
      items: [
        { title: "Blended behaviours", body: "Bots blend several behaviours: survive the wells, flee bigger rivals, intercept prey, graze debris, recharge at stars and use pull." },
        { title: "Difficulty is reaction and aim", body: "Reaction time and aim noise change with the level, so Hard is not just more bots." },
        { title: "Tested by playing them", body: "In 30 headless bot-vs-bot rounds, 10 per level, the mean round length was 116 to 133 s, and most rounds ended by critical mass." },
      ],
    },
    {
      kind: "decisions",
      heading: "Decisions I would defend",
      items: [
        {
          choice: "Check the physics against an independent reference",
          why: "A second implementation in Python matched the simulation's integration over 60 seeded cases covering gravity, thrust and speed cap, the arena wall, energy and well deaths.",
          cost: "A second implementation to write and keep honest.",
        },
        {
          choice: "Offline first, with one seam for multiplayer",
          why: "The game needs no server to play, and the Intent input leaves a clean place for remote players later.",
          cost: "There is no multiplayer yet.",
        },
        {
          choice: "Test the tests",
          why: "Mutation testing planted 44 bugs and the suite caught 36 of them, so I wrote tests for the 8 it missed.",
          cost: "A larger suite of 206 automated tests to maintain.",
        },
      ],
    },
    {
      kind: "facts",
      heading: "Measured",
      items: [
        { value: "60 fps", label: "on Hard at DPR 2", note: "1600 by 1000, 8 bodies and about 430 debris pieces, no frame slower than 20 ms across 2 x 600 frames" },
        { value: "0.3 ms", label: "average simulation step", note: "average render time 0.4 ms, headless Chrome on an M-series Mac under heavy load" },
        { value: "534", label: "automated tests", note: "Phase A added 328; mutation testing killed 36 of 44 planted bugs" },
        { value: "60 of 60", label: "seeded runs match a Python reference", note: "the engine's integration against an independent Python reference" },
        { value: "0 of 1200", label: "frames slower than 20 ms", note: "60 fps on Hard at DPR 2, with a physics step of about 0.3 ms" },
        { value: "800 by 520", label: "cross-origin iframe", note: "works with no allow attribute" },
      ],
    },
    {
      kind: "prose",
      heading: "What is still open",
      paras: [
        "The leaderboard is local because the game has no server; a global board and multiplayer are Phase C. The original timed round is kept alongside Endless for players who want a finish line.",
      ],
    },
  ],
  related: ["loopcraft", "agent-quest"],
};

export default work;
