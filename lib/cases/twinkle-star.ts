import type { Work } from "../work";

const work: Work = {
  slug: "twinkle-star",
  title: "Twinkle Star",
  kicker: "Course project · 2026",
  summary:
    "A Flutter app for a parent and a child living apart. They trade small signals instead of long calls: a mood check-in, an I miss you tap, a message that lands in the other person's morning, a letter to open when things get hard. Every caring action fills a star jar they share.",
  role: "Built the app. The design is the CityU SM2609 team's.",
  when: "2026",
  stack: ["Flutter 3.41", "Dart 3.11", "Provider", "shared_preferences", "flutter_test"],
  status: "shipped",
  outcome: { value: "186 tests", note: "both phone sizes, with daylight saving checked against IANA tzdata for 2025 to 2028" },
  links: [{ label: "Open the demo", href: "https://twinkle-star-liart.vercel.app" }],
  cover: {
    kind: "image",
    src: "/work/twinkle-star/01-welcome.png",
    alt: "The Twinkle Star welcome screen: cream paper with a dot texture, a drawn star-jar logo and the words Little check-ins, wherever you are.",
    w: 780,
    h: 1688,
  },
  blocks: [
    {
      kind: "prose",
      heading: "Distance, in small signals",
      paras: [
        "A student abroad and a parent at home do not need another app that asks them to schedule a call. They need a way to say something small, at the moment they feel it, and to know the other person saw it.",
        "Twinkle Star is built around that. A check-in takes a few taps. The bell sends a signal without starting a conversation. A message can be scheduled for the recipient's morning, not the sender's. Letters stay sealed until they are opened.",
        "It runs entirely on the device. There is no server and no account in the cloud, so the privacy promise is structural rather than a policy.",
      ],
    },
    {
      kind: "media",
      heading: "The app",
      items: [
        {
          kind: "image",
          src: "/work/twinkle-star/02-home-parent.png",
          alt: "A parent's home screen: two clocks for London and Hong Kong, the child's check-in saying tired and slept badly, and four reaction buttons.",
          w: 780,
          h: 1688,
          caption: "The parent's home. Both clocks, the child's real check-in, and four reactions drawn in code.",
        },
        {
          kind: "image",
          src: "/work/twinkle-star/03-check-in.png",
          alt: "The check-in sheet with drawn mood faces, a sleep scale, an activity list and a note field.",
          w: 780,
          h: 1688,
          caption: "The check-in. Mood faces, sleep and activity are drawn shapes, not images or emoji.",
        },
        {
          kind: "image",
          src: "/work/twinkle-star/04-star-jar.png",
          alt: "The shared star jar: gold stars from one person and pink stars from the other, filling a drawn jar.",
          w: 780,
          h: 1688,
          caption: "The star jar. Gold stars are yours, pink stars are theirs; a full jar unlocks a new shape.",
        },
      ],
    },
    {
      kind: "steps",
      heading: "What works end to end",
      items: [
        { title: "Pair and check in", body: "One person creates a family and gets a code; the other joins with it. Each completes a short profile, then check-ins and reactions travel both ways. Two tabs stay in sync with no lost writes." },
        { title: "Time zones, daylight saving included", body: "Home shows both clocks. Rules for all 28 cities on offer are checked against 2,384 offsets and 1,456 wall-clock conversions generated from Python zoneinfo for 2025 to 2028." },
        { title: "Open when letters", body: "A letter stays sealed with an envelope animation until the recipient opens it. The sender sees Sealed or Opened, and the tab badge counts unopened letters." },
        { title: "The shared jar", body: "Gold and pink stars fill a drawn jar. Full jars unlock the next shape, six achievements and a mutual streak reward showing up for each other." },
      ],
    },
    {
      kind: "prose",
      heading: "A compiler bug worth the paragraph",
      paras: [
        "In the release web build, joining a family succeeded but never left the screen. The generated JavaScript assigned the captured role to the error variable on the success path, so the code read back Role.child instead of null. The VM and the widget tests were correct.",
        "It was found by driving the real build, confirmed in the unminified output, and worked around by restructuring the method. It did not reproduce in a standalone program, so it has not been reported upstream.",
      ],
    },
    {
      kind: "decisions",
      heading: "Decisions I would defend",
      items: [
        {
          choice: "Local first, no server",
          why: "The journal and the family data never leave the device, and the app still works if storage is blocked, with a visible note that changes last until the tab closes.",
          cost: "Two devices on different phones cannot sync yet; the demo pairs on one device and uses two tabs.",
        },
        {
          choice: "Real time zones, not a fixed offset",
          why: "A message scheduled for the recipient's morning has to survive a daylight saving change, so the rules come from IANA tzdata and are tested across four years.",
          cost: "A generated oracle and a larger test suite.",
        },
        {
          choice: "Test every flow at both phone sizes",
          why: "The app is designed for one hand at 390 and 360 pixels wide, so the widget tests run the flows at both sizes rather than checking one layout.",
          cost: "Every new screen needs a test at two sizes.",
        },
      ],
    },
    {
      kind: "facts",
      heading: "Measured",
      items: [
        { value: "186", label: "automated tests", note: "130 data-rule tests against an injected clock and 56 widget tests at both phone sizes" },
        { value: "2,384", label: "time-zone offsets checked", note: "plus 1,456 wall-clock conversions from Python zoneinfo, 2025 to 2028" },
        { value: "3 s", label: "for a signal to cross two tabs", note: "each tab kept its own signed-in person; same-second messages were both kept" },
        { value: "0", label: "third-party scripts", note: "CanvasKit and the app fonts are bundled; the engine fetches Roboto and, when needed, Noto" },
      ],
    },
  ],
  related: ["culinary-companion", "agent-quest"],
};

export default work;
