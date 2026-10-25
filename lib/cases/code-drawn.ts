import type { Work } from "../work";

const work: Work = {
  slug: "code-drawn",
  title: "Code Drawn",
  kicker: "Personal films · canvas & code",
  summary:
    "Four short films drawn with code: Eleven Doors, Golden Angle, Out of Step and Sand Song. Each has an encoded film to watch and the original HTML to run and inspect.",
  role: "I wrote and drew the films with Canvas and Web Audio",
  when: "2026",
  stack: ["Canvas 2D", "Web Audio", "HTML", "JavaScript"],
  status: "shipped",
  links: [
    { label: "Eleven Doors · source & making-of", href: "/projects/films/eleven-doors.html" },
    { label: "Golden Angle · source & making-of", href: "/projects/films/golden-angle.html" },
    { label: "Sand Song · source & making-of", href: "/projects/films/sand-song.html" },
    { label: "Out of Step · source & making-of", href: "/projects/films/out-of-step.html" },
  ],
  cover: {
    kind: "image",
    src: "/projects/films/media/eleven-doors-poster.jpg",
    alt: "A round yellow bird walks between two doors in a screen-printed landscape from Eleven Doors.",
    w: 720,
    h: 720,
  },
  blocks: [
    {
      kind: "prose",
      heading: "Films made from drawing instructions",
      paras: [
        "Eleven Doors follows one small bird through eleven doors, each opening into a different drawn medium: riso, screen print, ink, marker, cel, comic, flat 3D, CGI, Ghibli, stop motion and pixel.",
        "Golden Angle grows a plant from dawn to bloom in five shots using the 137.5 degree golden angle. Out of Step follows two characters until they move together. Sand Song pours batches of grains to a score.",
      ],
    },
    {
      kind: "steps",
      heading: "Watch, run or inspect",
      items: [
        { title: "Eleven Doors", body: "One drawing becomes eleven media. The original page includes the film’s drawing and sound code." },
        { title: "Golden Angle", body: "A plant study in five shots, built around the golden angle." },
        { title: "Out of Step", body: "Dusk, near, sync, join, flight: two characters out of step until the moment they are not." },
        { title: "Sand Song", body: "Sand drawn as batches of grains rather than one shape at a time, poured to a score." },
      ],
    },
    {
      kind: "prose",
      heading: "Technique and credit",
      paras: [
        "The halftone print model follows Kevin Ngo's published canvas pages: a halftone tile per ink and tone level, each ink screened at its own angle.",
        "The drawn devices were re-implemented from alesha-pro's (Alexey Fateev) frame-by-frame study, hand-drawn-canvas-animation, MIT licensed.",
      ],
    },
  ],
  related: ["agent-quest"],
};

export default work;
