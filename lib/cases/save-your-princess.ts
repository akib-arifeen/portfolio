import type { Work } from "../work";

const work: Work = {
  slug: "save-your-princess",
  title: "Save Your Princess",
  kicker: "Personal project · 2026",
  summary:
    "A short 3D narrative game in the browser. A student far from home lives a stuck city life by day and walks an ambiguous dream castle by night. The part that matters is mending: find three shards, fit them into a leaded window, and light opens the way forward.",
  role: "I built the game: the story shape, the mechanic, the room kit and the code",
  when: "2026",
  stack: ["TypeScript", "Babylon.js 9", "Vite", "WebGPU with a WebGL2 fallback", "Vitest"],
  status: "prototype",
  outcome: { value: "Playable slice", note: "the MEND room runs end to end, with no timer and no fail state" },
  links: [{ label: "Play the MEND slice", href: "https://syp-playtest.vercel.app/?mend=1" }],
  cover: {
    kind: "image",
    src: "/work/save-your-princess/cover.svg",
    alt: "A schematic of the MEND room: a leaded window with three panes, three shards on the floor and a door on the right.",
    w: 1200,
    h: 750,
  },
  playSlug: "save-your-princess",
  blocks: [
    {
      kind: "prose",
      heading: "What I wanted to build",
      paras: [
        "A student a long way from home lives a grey, stuck city life by day. By night he walks a dream castle, guided by a girl's voice and notes in her handwriting. The story is fictionalised: no real names, places or brands appear anywhere in the game.",
        "I wanted the dream side to be played rather than watched. The slice I finished is one room you repair, built from the same kit as the rest of the castle: stone that is never coloured, glass that is never dark, and light that is always filtered.",
      ],
    },
    {
      kind: "prose",
      heading: "The mechanic is mending",
      paras: [
        "The MEND room is the vertical slice. Three shards lie on the floor, one of them slightly out of the way. Walk to a shard and press E, or tap it on a phone, and it lifts into your hands with a chime. A broken leaded window has three gaps, and the gap that fits the shard you are holding pulses. Press E at that gap and the shard clicks in, and a pool of light spreads across the floor.",
        "A wrong slot never fails. The shard rings and floats back to your hand, and the door only swings open when all three panes are lit. There is no timer and no fail state, and nothing in the room can leave you stuck.",
      ],
    },
    {
      kind: "media",
      heading: "The slice",
      items: [
        {
          kind: "image",
          src: "/work/save-your-princess/01-mend-room.png",
          alt: "The MEND room: a dark stone room with a three-pane leaded window, three glowing shards on the floor and a player figure standing in front of them.",
          w: 1600,
          h: 1000,
          caption: "The MEND room. Three shards, a leaded window with three gaps, and a door that opens when the window is whole.",
        },
        {
          kind: "image",
          src: "/work/save-your-princess/02-mend-phone.png",
          alt: "The MEND room on a phone, with the touch controls and the same leaded window.",
          w: 390,
          h: 844,
          caption: "The same room on a phone, with touch controls.",
        },
      ],
    },
    {
      kind: "steps",
      heading: "What the slice proves",
      items: [
        { title: "One verb", body: "Pick up a shard, carry it to the pane that fits, set it, and watch the light change. The prompt names the next action, and there is nothing to fail." },
        { title: "No way to fail", body: "A wrong pane rejects the shard and gives it back. Nothing is lost, there is no timer, and the door is the only gate." },
        { title: "Keyboard or touch", body: "E on a keyboard, a tap on a phone. The prompt changes between Pick up, Set and Leave so the next action is always named." },
        { title: "All procedural", body: "Every room, prop, light and sound is generated in code. There are no imported models, textures or audio files, so the whole build is a few megabytes." },
      ],
    },
    {
      kind: "decisions",
      heading: "The calls I would defend",
      items: [
        {
          choice: "Mend, not breathe",
          why: "The first core verb was a breathing pacer you held in time with a ring. It was invisible and changed nothing you could see, so I replaced it with mending: a shard in your hand, a pane that lights, a door that opens.",
          cost: "The pacer stays only as optional ambience, and the rooms built around it have to be rebuilt.",
        },
        {
          choice: "No fail state",
          why: "A wrong slot rejects the shard and gives it back, so the player can experiment without losing progress. Nothing in the room can strand you.",
          cost: "There is no pressure, so the story and the light have to carry the tension.",
        },
        {
          choice: "Keep the logic out of the renderer",
          why: "The rules live in a framework-free MendScript: shards held, shards placed, which pane is open and whether the door is open. Tests cover the wrong-slot case and the never-lose-the-shard case.",
          cost: "A test cannot see the light, so every change to the room still needs a browser check.",
        },
        {
          choice: "Build every room from one kit",
          why: "A scene kit of stone, glass, light and sound makes a new room a data problem rather than a modelling problem, which is what one developer with no artist needs.",
          cost: "Every room shares the same vocabulary, so art direction has to come from light and framing rather than from props.",
        },
      ],
    },
    {
      kind: "facts",
      heading: "Measured",
      items: [
        { value: "60 fps", label: "at 1280x800", note: "31 draw calls in the MEND room, measured in a browser probe" },
        { value: "263", label: "automated tests passed when the slice landed", note: "27 files, including the MEND script and the wrong-slot case" },
        { value: "0", label: "fail states", note: "a wrong slot rings and floats the shard back; nothing can strand you" },
        { value: "3", label: "panes to light", note: "three shards, three slots; the door opens only when the window is whole" },
      ],
    },
    {
      kind: "prose",
      heading: "Where it stands",
      paras: [
        "This is a vertical slice, not the finished game. The MEND room runs on its own route, and the story flow around it is still being rebuilt. I have played the slice at 1280x800 and at phone size, and I have not yet played the full story from menu to end with the new verb in place.",
        "When the full game ships, this page will say so.",
      ],
    },
  ],
  related: ["gravity-wars", "twinkle-star"],
};

export default work;
