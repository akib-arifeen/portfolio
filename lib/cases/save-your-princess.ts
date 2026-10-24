import type { Work } from "../work";

const work: Work = {
  slug: "save-your-princess",
  title: "Save Your Princess",
  kicker: "Personal project · 2026",
  summary:
    "A short 3D narrative game in the browser. A student far from home lives a stuck city life by day and walks an ambiguous dream castle by night. The finished slice is mending: find the shards, fit them into broken windows, and the light answers you.",
  role: "I built the game: the story shape, the mechanic, the room kit and the code",
  when: "2026",
  stack: ["TypeScript", "Babylon.js 9", "Vite", "WebGPU with a WebGL2 fallback", "Vitest"],
  status: "prototype",
  outcome: { value: "Playable slice", note: "the chamber and her room run end to end, at 60 fps on desktop and phone" },
  links: [{ label: "Play the slice", href: "https://syp-playtest.vercel.app/?slice=1" }],
  cover: {
    kind: "image",
    src: "/work/save-your-princess/01-chamber.png",
    alt: "The MEND chamber: a hooded figure stands in a dark stone hall facing a tall leaded window pouring blue night light, with a glowing shard on the floor to the left.",
    w: 1600,
    h: 1000,
  },
  playSlug: "save-your-princess",
  blocks: [
    {
      kind: "prose",
      heading: "What I wanted to build",
      paras: [
        "A student a long way from home lives a grey, stuck city life by day. By night he walks a dream castle, guided by a girl's voice and notes in her handwriting. The story is fictionalised: no real names, places or brands appear anywhere in the game.",
        "I wanted the dream side to be played rather than watched, and I wanted one verb you could understand in the first minute of holding the controller. The slice I finished is two rooms and an ending, built from one kit: stone that is never coloured, glass that is never dark, and light that is always filtered.",
      ],
    },
    {
      kind: "prose",
      heading: "The mechanic is mending",
      paras: [
        "Shards lie on the floor of a dark chamber, each with a beacon so the nearest one burns brightest. Walk to a shard and press E, or tap it on a phone, and it lifts into the figure's hands. Holding a shard, the window only offers the gap that fits it: walk to the window, press E, and it always works. The shape tells you which gap; the game makes sure shape cannot make you wrong.",
        "A set pane flies to its socket, the camera shakes, one frame flashes white, and a pool of light spreads across the floor. The room's mood changes in under a second per pane, because the light had been responding too slowly to feel like something you caused.",
        "There is no timer and no fail state, and no instruction text in the first minute. One line of tone stays: The room is wounded.",
      ],
    },
    {
      kind: "prose",
      heading: "Light does the talking",
      paras: [
        "The first version had no bright pixels. That was arithmetic rather than taste: the albedo was about 4 per cent reflectance and the lighting ramp's ceiling was the key colour, so no stone surface could rise above roughly 10 of 255. Every room read as flat cardboard.",
        "I measured the 1280 by 800 frame and fixed it in layers: neutral mid grey stone, a lifted key colour, the window's falloff baked into vertex colours, a depth fog that does not crush the window, and one practical candle per side wall that warms as each pane is set. Behind the leaded glass there is now a luminous night sky, a moon and a city roofline, so the window is genuinely the light source the room is built around.",
      ],
    },
    {
      kind: "media",
      heading: "The slice",
      items: [
        { kind: "image", src: "/work/save-your-princess/02-rally.png", alt: "Her room: a hooded figure stands in a green chamber before a tall lancet window with three stacked panes, one of them glowing pink, above a stone dais.", w: 1280, h: 800, caption: "Her room. The top pane is the game's only pink shard, and it stays pink through the green light." },
        { kind: "image", src: "/work/save-your-princess/03-mended.jpg", alt: "The chamber after mending: the leaded window glows gold and a warm pool of light crosses the stone floor.", w: 1280, h: 537, caption: "The chamber mended. Three panes lit, gold light on the floor, and the way forward open." },
        { kind: "image", src: "/work/save-your-princess/04-phone.png", alt: "The MEND chamber on a phone: the whole leaded window and the figure are in frame, with touch controls over the scene.", w: 390, h: 844, caption: "The phone layout. The whole window and the room are in frame, and the same verbs use a stick and a button." },
      ],
    },
    {
      kind: "steps",
      heading: "What the slice proves",
      items: [
        { title: "One verb, taught without text", body: "Pick up a shard, walk to the window, set it, watch the light change. The first minute has no instruction text, only one authored camera move that shows you the room." },
        { title: "Two rooms, one idea", body: "The chamber and her room use the same mending loop with different light. Mend all three panes in her room and her note appears on the dais, which introduces her motif." },
        { title: "The ending owns the first colour", body: "The end card arrives desaturated and cold, then blooms to full colour over 3.2 seconds. Her pink is the last colour in the game." },
        { title: "Keyboard or touch", body: "WASD and E on a keyboard; a floating stick and an E button on touch, both driving the same verbs. Mobile framing uses horizontal-to-vertical compensation so the room is not cropped." },
      ],
    },
    {
      kind: "decisions",
      heading: "The calls I would defend",
      items: [
        {
          choice: "Make the mechanic legible instead of fair",
          why: "At first you had to aim at the right gap, and a wrong attempt rejected the shard. That protected fairness and taught nothing. Now, holding a shard, the only reachable target is its own gap, so the shape still tells you which one and the game cannot make you wrong.",
          cost: "The challenge moves out of the interaction and into reading the room, so the art and the camera have to carry it.",
        },
        {
          choice: "Fix the value structure with arithmetic, not taste",
          why: "The room was dark because albedo and ramp maths capped every surface, not because the mood wanted it. Correcting the albedo, baking the window falloff and adding one practical per wall raised the 99th percentile luma from 76 to 237 and pixels above 200 of 255 from 0.00 to 2.73 per cent.",
          cost: "Every room now depends on its own light layout, so the kit is less copy and paste than it was.",
        },
        {
          choice: "Mend, not breathe",
          why: "The original core verb was a breathing pacer held in time with a ring. It was invisible and changed nothing you could see, so it is now optional ambience that never gates progress.",
          cost: "The rooms built around the pacer have to be rebuilt around mending.",
        },
        {
          choice: "Her colour is emissive",
          why: "The pink shard belongs to her. Making it emissive means the green room cannot wash her colour out, and the pink is still the last colour the game reveals.",
          cost: "One more exception to the light rules, held for one prop.",
        },
        {
          choice: "Author the camera",
          why: "The camera used to open on the back of the figure's head. A 2.8 second dolly now frames the broken window and the room, then hands over; any input skips it.",
          cost: "Every room needs an authored opening shot, not just a spawn point.",
        },
      ],
    },
    {
      kind: "facts",
      heading: "Measured",
      items: [
        { value: "60 fps", label: "at 1280x800 and 390x844", note: "WebGPU, measured on the live slice in a browser probe" },
        { value: "237", label: "99th percentile luma after the light pass", note: "up from 76 on the same 1280x800 chamber frame" },
        { value: "2.73%", label: "of pixels above 200 of 255", note: "up from 0.00 per cent: the renderer could not produce a bright pixel before" },
        { value: "263", label: "automated tests", note: "27 files, including the MEND rules and the wrong-slot case" },
        { value: "2 rooms", label: "wired to mending", note: "the hero chamber and her room, plus the ending card" },
      ],
    },
    {
      kind: "prose",
      heading: "Where it stands",
      paras: [
        "This is a vertical slice, not the finished game. The chamber, her room and the ending are the part I am confident in; the other eleven rooms still have the old value structure, the remaining dream rooms are not wired to mending, and I have not played the whole story from menu to end with the new verb in place. The ending was reached through its own route in testing rather than a full playthrough.",
        "Touch needs one real-phone pass; the responsive framing was verified in emulation. When the full game ships, this page will say so.",
      ],
    },
  ],
  related: ["gravity-wars", "twinkle-star"],
};

export default work;
