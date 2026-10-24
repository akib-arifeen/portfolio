// Scene colours. three.js materials can't read CSS custom properties, so the 3D palette lives here,
// tuned to sit on the page's warm paper (tokens.css --color-paper) without fighting it.

export const scene = {
  base: "#d9cbb6",      // diorama plinth
  baseEdge: "#c4b39b",
  floor: "#c9a982",     // warm oak
  wall: "#efe6d8",      // plaster, a shade off the paper
  wallSide: "#e6dccc",
  trim: "#d7c8b2",
  desk: "#8a6446",      // walnut
  deskLeg: "#3a332d",
  metal: "#3a3734",
  screenFrame: "#2b2927",
  laptop: "#b9b4ad",
  laptopEdge: "#8f8a83",
  laptopPort: "#4c4842",
  coral: "#d9654f",     // the photobooth — same hue as --color-accent
  coralDark: "#b8503e",
  cream: "#f5ecdf",
  // the ARI booth: lacquer, brass and the mascot's cool light against the warm room
  boothBrass: "#b58a55",
  boothInk: "#20252a",
  boothHalo: "#7fe3e8",
  ariBlue: "#3aa9e8",
  ariBlueDeep: "#1d63b4",
  ariCyan: "#93f6ff",
  ariGold: "#d9aa58",
  ariCheek: "#ef9bb0",
  ariInk: "#14243a",
  rug: "#b9a07d",
  rugInner: "#a98d68",
  plantPot: "#c97e5a",
  leaf: "#6f8a5b",
  leafDark: "#5a734a",
  book1: "#3f5a78",
  book2: "#c99a4a",
  book3: "#7a4b3c",
  reel: "#2f2c2a",
  skin: "#c8956f",
  hoodie: "#4a5d6e",
  hair: "#2a2320",
  stool: "#6b5a4a",
  shade: "#f2e2c4",
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

export const lights: Record<Phase, Light> = {
  morning: { sky: "#cfe2ee", sun: "#ffe4c4", sunIntensity: 2.4, ambient: 0.75, hemiSky: "#f4efe6", hemiGround: "#cdb99c", lamp: 0, screenGlow: 0.9 },
  day:     { sky: "#b9d6ec", sun: "#fff4e3", sunIntensity: 2.8, ambient: 0.9, hemiSky: "#f7f3ea", hemiGround: "#d2bfa3", lamp: 0, screenGlow: 0.8 },
  evening: { sky: "#eea67c", sun: "#ffb37a", sunIntensity: 1.5, ambient: 0.5, hemiSky: "#f3d9c0", hemiGround: "#9e8467", lamp: 7, screenGlow: 1.2 },
  night:   { sky: "#24314f", sun: "#8ea2cf", sunIntensity: 0.45, ambient: 0.3, hemiSky: "#5d6a8c", hemiGround: "#3b3029", lamp: 10, screenGlow: 1.5 },
};

export function phaseForHour(hour: number): Phase {
  if (hour >= 6 && hour < 11) return "morning";
  if (hour >= 11 && hour < 16) return "day";
  if (hour >= 16 && hour < 20) return "evening";
  return "night";
}
