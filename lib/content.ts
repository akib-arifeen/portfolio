// Single source of copy for the site. Numbers come from WORK_RECORD.md (verified). Do not invent new ones.

export type ProjectId = "video" | "booth" | "lessons" | "zoom" | "workout" | "culinary";
export type StudioSpot = ProjectId | "mic" | "me" | "laptop";

export type Project = {
  id: ProjectId;
  /** Case-study slug (lib/work.ts). The home page maps cards to projects through it. */
  slug: string;
  title: string;
  meta: string;
  text: string;
  outcome: string;
  outcomeNote: string;
  link?: { label: string; href: string };
};

export const projects: Project[] = [
  {
    id: "video",
    slug: "video-studio",
    title: "AI video generation platform",
    meta: "See Change Education · 2026 · architecture, backend, GPU infrastructure",
    text: "Turns a prompt or a lesson into a narrated, animated 4K video. Multi-agent LLM workflows plan, write and review every scene, while open-source video and voice models run on a self-hosted GPU box.",
    outcome: "50% faster",
    outcomeNote: "video generation after optimisation",
  },
  {
    id: "booth",
    slug: "photobooth",
    title: "AI photobooth",
    meta: "See Change Education · 2026 · concept, design, voice, full stack",
    text: "Guests talk to a voice character, have their photo restyled by AI and leave with a print. Every layer is mine: animation, voicelines, prompts, the app and a silent-print agent for Windows.",
    outcome: "200 to 300 guests",
    outcomeNote: "per event · now a product for schools",
  },
  {
    id: "lessons",
    slug: "lesson-pipeline",
    title: "AI lesson pipeline",
    meta: "See Change Education · 2026 · backend, prompting",
    text: "Turns recorded classes into ready-to-publish lessons: video, slides, bilingual subtitles and exercises, with a teacher reviewing before anything reaches students.",
    outcome: "~80% less time",
    outcomeNote: "per lesson, estimated · 32-lesson course",
  },
  {
    id: "zoom",
    slug: "zoom-backup",
    title: "Zoom recording automation",
    meta: "See Change Education · 2026 · backend",
    text: "Backs up every class recording to S3, matches it to its lesson, collects attendance and flags classes that are missing a recording.",
    outcome: "150 GB",
    outcomeNote: "of Zoom cloud storage freed",
  },
  {
    id: "workout",
    slug: "workout-planner",
    title: "AI workout planner",
    meta: "852HealthKare · 2025 to 2026 · full stack",
    text: "Builds a personal workout plan from an open-source exercise library I cleaned and indexed, then guides each session with voice and animation.",
    outcome: "1,000+ exercises",
    outcomeNote: "cleaned and indexed",
  },
  {
    id: "culinary",
    slug: "culinary-companion",
    title: "Culinary Companion",
    meta: "Personal project · React, computer vision",
    text: "A hands-free recipe app. Hand gestures and voice commands move through the steps, and each step is read aloud, for when your hands are covered in flour.",
    outcome: "Hands-free",
    outcomeNote: "gesture and voice control",
    link: { label: "Open the demo", href: "https://culnary-companion-bhy9.vercel.app/" },
  },
];

export const studioNotes: Record<"mic" | "me", { kicker: string; title: string; body: string; outcome: string }> = {
  mic: {
    kicker: "On the desk",
    title: "Sound",
    body: "I write and direct character voicelines in English and Cantonese, mix narration, and design the small sounds that make an interface feel finished, including this room.",
    outcome: "Turn sound on to hear the studio.",
  },
  me: {
    kicker: "At the workstation",
    title: "Ask about the build",
    body: "A stylised avatar at my desk. Ask me about the agent pipelines, render infrastructure, product decisions and verification behind the work, out loud if your sound is on.",
    outcome: "Software engineer · Hong Kong",
  },
};

export const spotLabels: Record<StudioSpot, string> = {
  video: "The monitor",
  booth: "The photobooth",
  lessons: "Lesson books",
  zoom: "Film reel",
  workout: "Dumbbell",
  culinary: "The pan",
  mic: "The mic",
  me: "Me",
  laptop: "My laptop: open it",
};

export const contact = {
  email: "aarifeen2-c@my.cityu.edu.hk",
  linkedin: "https://linkedin.com/in/akibarifeen",
  github: "https://github.com/akib-arifeen",
  cv: "/akib-arifeen-cv.pdf",
};
