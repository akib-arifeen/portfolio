// Scene colours. three.js materials can't read CSS custom properties, so the 3D palette lives here,
// tuned to sit on the page's deep blue-grey paper (tokens.css --color-paper) without fighting it.

export const scene = {
  base: "#2b3038",      // diorama plinth, a step above the page
  baseEdge: "#22262d",
  floor: "#5a4030",     // warm walnut, darkened for the evening
  wall: "#756a60",      // warm plaster catches the afternoon light
  wallSide: "#5f6062",
  trim: "#8a8075",
  desk: "#765037",      // oiled walnut
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
  morning: { sky: "#afc9d8", sun: "#ffe1b5", sunIntensity: 2.1, ambient: 0.46, hemiSky: "#9eb3c4", hemiGround: "#49372a", lamp: 1.5, screenGlow: 1.0 },
  day:     { sky: "#c2dbe8", sun: "#ffdfb5", sunIntensity: 2.5, ambient: 0.5, hemiSky: "#a5b9c9", hemiGround: "#49392d", lamp: 0, screenGlow: 1.0 },
  evening: { sky: "#db9570", sun: "#ffb579", sunIntensity: 1.65, ambient: 0.34, hemiSky: "#7c7180", hemiGround: "#352820", lamp: 3.8, screenGlow: 1.1 },
  night:   { sky: "#263650", sun: "#91a8d0", sunIntensity: 0.42, ambient: 0.26, hemiSky: "#536580", hemiGround: "#27211e", lamp: 5.5, screenGlow: 1.25 },
};

export function phaseForHour(hour: number): Phase {
  if (hour >= 6 && hour < 11) return "morning";
  if (hour >= 11 && hour < 16) return "day";
  if (hour >= 16 && hour < 20) return "evening";
  return "night";
}
