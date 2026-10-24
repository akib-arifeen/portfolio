// The curated gallery: five pieces from the Studio tooling and four hand-drawn films.
// Every file here is a local copy under public/projects; the originals are untouched, and the
// dimensions, durations and byte sizes below are the encoded files' own, so a test can hold the
// copy to what this module claims.

export type StudioPiece = {
  slug: string;
  title: string;
  line: string;
  /** 1280x720, or 720x1280 for the vertical social cut. */
  w: number;
  h: number;
  seconds: number;
  bytes: number;
  src: string;
  poster: string;
};

export type Film = {
  slug: string;
  title: string;
  line: string;
  /** The square 720 film as shipped for the gallery. */
  w: number;
  h: number;
  seconds: number;
  bytes: number;
  /** The standalone film page, mounted in a sandboxed frame on request. */
  film: string;
  src: string;
  poster: string;
};

const MEDIA = "/projects/media";
const FILMS = "/projects/films";

export const studioPieces: StudioPiece[] = [
  {
    slug: "presenter-avatar",
    title: "Presenter avatar",
    line: "A presenter clip generated from the avatar model. The person on screen is synthetic, not a recording of anyone.",
    w: 1280,
    h: 720,
    seconds: 10.741,
    bytes: 698070,
    src: `${MEDIA}/presenter-avatar.mp4`,
    poster: `${MEDIA}/presenter-avatar-poster.jpg`,
  },
  {
    slug: "screen-demo",
    title: "Screen demo",
    line: "A screen demo cut from a product walkthrough of a git recovery. No private paths or credentials are shown.",
    w: 1280,
    h: 720,
    seconds: 27.968,
    bytes: 1232380,
    src: `${MEDIA}/screen-demo.mp4`,
    poster: `${MEDIA}/screen-demo-poster.jpg`,
  },
  {
    slug: "animated-explainer",
    title: "Animated explainer",
    line: "A narrated explainer, built scene by scene from the studio's animation path.",
    w: 1280,
    h: 720,
    seconds: 27.797,
    bytes: 1447873,
    src: `${MEDIA}/animated-explainer.mp4`,
    poster: `${MEDIA}/animated-explainer-poster.jpg`,
  },
  {
    slug: "podcast-vertical-cut",
    title: "Podcast vertical cut",
    line: "A podcast episode repurposed as a vertical social cut, framed for a phone.",
    w: 720,
    h: 1280,
    seconds: 33.344,
    bytes: 1120348,
    src: `${MEDIA}/podcast-vertical-cut.mp4`,
    poster: `${MEDIA}/podcast-vertical-cut-poster.jpg`,
  },
  {
    slug: "apollo-montage",
    title: "Apollo montage",
    line: "A documentary-style montage. Footage is used on the rights holder's assertion; the source clips' provenance is not documented here.",
    w: 1280,
    h: 720,
    seconds: 30.016,
    bytes: 3375439,
    src: `${MEDIA}/apollo-montage.mp4`,
    poster: `${MEDIA}/apollo-montage-poster.jpg`,
  },
];

export const films: Film[] = [
  {
    slug: "eleven-doors",
    title: "Eleven Doors",
    line: "Eleven doors, each opened in a different drawn medium: riso, screen print, ink, marker, cel, comic, flat 3D, CGI, Ghibli, stop motion and pixel.",
    w: 720,
    h: 720,
    seconds: 20.842,
    bytes: 1396886,
    film: `${FILMS}/eleven-doors.html`,
    src: `${FILMS}/media/eleven-doors.mp4`,
    poster: `${FILMS}/media/eleven-doors-poster.jpg`,
  },
  {
    slug: "golden-angle",
    title: "Golden Angle",
    line: "A plant from dawn to bloom, in five shots, built on the 137.5 degree golden angle.",
    w: 720,
    h: 720,
    seconds: 20.01,
    bytes: 1142949,
    film: `${FILMS}/golden-angle.html`,
    src: `${FILMS}/media/golden-angle.mp4`,
    poster: `${FILMS}/media/golden-angle-poster.jpg`,
  },
  {
    slug: "sand-song",
    title: "Sand Song",
    line: "Sand, drawn as batches of grains rather than one shape at a time, poured to a score.",
    w: 720,
    h: 720,
    seconds: 21.013,
    bytes: 6108761,
    film: `${FILMS}/sand-song.html`,
    src: `${FILMS}/media/sand-song.mp4`,
    poster: `${FILMS}/media/sand-song-poster.jpg`,
  },
  {
    slug: "out-of-step",
    title: "Out of Step",
    line: "Dusk, near, sync, join, flight: two characters out of step until the moment they are not.",
    w: 720,
    h: 720,
    seconds: 24,
    bytes: 1747376,
    film: `${FILMS}/out-of-step.html`,
    src: `${FILMS}/media/out-of-step.mp4`,
    poster: `${FILMS}/media/out-of-step-poster.jpg`,
  },
];

/** Techniques the films are built on, credited as the film source credits them. */
export const techniqueCredits: { technique: string; credit: string }[] = [
  {
    technique: "Halftone print model",
    credit: "Follows the technique in Kevin Ngo's published canvas pages: a halftone tile per ink and tone level, each ink screened at its own angle.",
  },
  {
    technique: "Drawn devices",
    credit:
      "Re-implemented from alesha-pro's (Alexey Fateev) frame-by-frame study, hand-drawn-canvas-animation, MIT licensed.",
  },
];

/** "0:11" for a card label. Rounds, because a gallery label is not a timecode. */
export function formatSeconds(seconds: number): string {
  const whole = Math.round(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}
