// Scene colours. three.js materials can't read CSS custom properties, so the 3D palette lives here,
// tuned to sit on the page's deep blue-grey paper (tokens.css --color-paper) without fighting it.

export const scene = {
  base: "#2b3038",      // diorama plinth, a step above the page
  baseEdge: "#22262d",
  floor: "#4a3b2c",     // warm oak, darkened for the evening
  wall: "#3a4149",      // cool plaster
  wallSide: "#323842",
  trim: "#4a515b",
  desk: "#5c4531",      // walnut
  deskLeg: "#22262c",
  metal: "#6a7280",
  screenFrame: "#141a21",
  laptop: "#4d545d",
  laptopEdge: "#3a4048",
  laptopPort: "#2a3038",
  coral: "#d9714f",     // the one warm accent, shared with --color-accent
  coralDark: "#b8543a",
  cream: "#e8dccb",
  // the booth as quiet equipment: charcoal cabinet, cream face, one warm light. No lacquer, no brass, no mascot.
  boothCabinet: "#363b41",
  boothCabinetEdge: "#262b30",
  boothPanel: "#ded4c4",
  boothPanelEdge: "#c7bba7",
  boothInk: "#1d2227",
  boothGlow: "#ffe0b8",
  rug: "#5d4a38",
  rugInner: "#4d3c2c",
  plantPot: "#9c5f44",
  leaf: "#55705a",
  leafDark: "#3f5747",
  book1: "#40597a",
  book2: "#b98c45",
  book3: "#6d4336",
  reel: "#26292e",
  skin: "#c8956f",
  hoodie: "#46566a",
  hair: "#2a2320",
  stool: "#4e4134",
  shade: "#e6d6b8",
  // the Akib character (Akib.tsx). three.js and the face canvas can't read CSS variables.
  akibSkin: "#a37455",
  akibSkinShade: "#8f5d3d",
  akibHair: "#26190f",
  akibHairTip: "#a8703f",
  akibTee: "#1e1e22",
  akibTeeTrim: "#2e2e34",
  akibPants: "#46484e",
  akibShoe: "#f3f0ea",
  akibSole: "#d8d3c9",
  akibSilver: "#cdd1d7",
  akibPhone: "#ecebe7",
  akibPhonePad: "#9c9ea5",
  akibBrow: "#1a110d",
  akibEye: "#3a2216",
  akibPupil: "#140b07",
  akibSclera: "#f2e9de",
  akibCatch: "#ffffff",
  akibStubble: "#2a1c14",
  akibMouth: "#6e3328",
  akibLip: "#a95c48",
  akibMouthIn: "#3a1814",
  akibTeeth: "#f6efe6",
} as const;

export type Phase = "morning" | "day" | "evening" | "night";
export const phases: Phase[] = ["morning", "day", "evening", "night"];

export type Light = {
  sky: string;        // what you see through the window
  sun: string;        // light falling through it
  sunIntensity: number;
  ambient: number;
  hemiSky: string;
  hemiGround: string;
  lamp: number;       // desk lamp intensity (0 = off)
  screenGlow: number; // monitor brightness
};

// The room is a dark workbench in every phase: daylight comes in cool through the window,
// the lamp carries the warmth, and the screens are the brightest things in the room.
export const lights: Record<Phase, Light> = {
  morning: { sky: "#a9c7da", sun: "#e8f0f7", sunIntensity: 1.9, ambient: 0.42, hemiSky: "#8496a9", hemiGround: "#3a2f26", lamp: 1, screenGlow: 1.1 },
  day:     { sky: "#bed9ea", sun: "#fff3e2", sunIntensity: 2.3, ambient: 0.5, hemiSky: "#93a6b9", hemiGround: "#40352a", lamp: 0, screenGlow: 1.0 },
  evening: { sky: "#d9885d", sun: "#ffab74", sunIntensity: 1.15, ambient: 0.3, hemiSky: "#6d5f6c", hemiGround: "#2b211c", lamp: 9, screenGlow: 1.4 },
  night:   { sky: "#1d2b46", sun: "#7e93c2", sunIntensity: 0.32, ambient: 0.22, hemiSky: "#3a4a68", hemiGround: "#1e1a19", lamp: 12, screenGlow: 1.7 },
};

export function phaseForHour(hour: number): Phase {
  if (hour >= 6 && hour < 11) return "morning";
  if (hour >= 11 && hour < 16) return "day";
  if (hour >= 16 && hour < 20) return "evening";
  return "night";
}
