// SERVER ONLY: imported by app/api/booth/route.ts and nothing else. Keeping the prompts out of lib/booth.ts keeps them
// out of the client bundle; moving them back would ship the prompt engineering to every visitor.
// Prompts name what must NOT change: GPT Image keeps a face only when told to.

import type { StyleId } from "./booth";

const keep =
  "Keep the same person: identical face, facial features, skin tone, hairstyle, expression, pose and framing. Keep the composition. Do not add text, logos or watermarks.";

export const stylePrompts: Record<StyleId, string> = {
  anime: `Restyle this photo as a warm hand-painted anime film still: soft watercolour backgrounds, gentle golden-hour light, clean line art. ${keep}`,
  clay: `Restyle this photo as a stop-motion claymation character: soft modelling-clay surfaces with subtle fingerprints, rounded forms, warm studio lighting, a small handmade set behind them. ${keep}`,
  oil: `Restyle this photo as a classical oil painting portrait: visible brushstrokes, rich warm palette, soft chiaroscuro lighting, canvas texture. ${keep}`,
  comic: `Restyle this photo as a bold comic-book panel: confident ink outlines, flat colours, halftone dot shading, a simple graphic background. ${keep}`,
};
