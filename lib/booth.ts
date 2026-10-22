// The booth's looks and lines, safe for the client bundle. The image-model prompts live in lib/booth-prompts.ts (server only).

export type StyleId = "anime" | "clay" | "oil" | "comic";

export const styles: { id: StyleId; name: string; line: string }[] = [
  {
    id: "anime",
    name: "Hand-painted anime",
    line: "Soft light, painted skies.",
  },
  {
    id: "clay",
    name: "Claymation",
    line: "Thumbprints included.",
  },
  {
    id: "oil",
    name: "Oil portrait",
    line: "Museum-grade, gallery-free.",
  },
  {
    id: "comic",
    name: "Comic panel",
    line: "Bold ink, halftone dots.",
  },
];

export const facts = [
  "The real booth this is based on served 200 to 300 guests a night.",
  "Its host character speaks English and Cantonese.",
  "Browsers can’t print silently, so the real booth has its own tiny print agent.",
  "The print agent is a single .exe that starts itself at login.",
  "The real booth also interviews guests on camera for marketing.",
  "It started as a one-line ask: “make a photobooth”.",
];

export const BOOTH_DAILY_LIMIT = 3;
