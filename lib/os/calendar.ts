// Month-only dates use the 1st of the month and say so in `note`. Anything without a source line is left out.
import type { CalEvent } from "./types";

export const calEvents: CalEvent[] = [
  // CV: "\role{Software Engineer}{Sep 2025 -- Present}{See Change Education / Asia Allied Group}{Hong Kong}"
  {
    start: "2025-09-01",
    title: "Joined See Change Education",
    kind: "work",
    note: "Started as an IT intern and became a full-time software engineer at See Change Education / Asia Allied Group. The source gives the month only (Sep 2025), so this sits on the 1st.",
  },
  // CV: "\role{Full Stack Developer (Part-time)}{Nov 2025 -- Jan 2026}{852HealthKare}{Remote}"
  {
    start: "2025-11-01",
    end: "2026-01-01",
    title: "852HealthKare workout module",
    kind: "work",
    note: "Part-time: an AI agent that builds personalised workout plans, guided by voice and animations. The source gives months only (Nov 2025 to Jan 2026), so the dates sit on the 1st.",
    action: { type: "href", href: "/work/workout-planner" },
  },
  {
    start: "2026-09-09",
    end: "2026-10-15",
    title: "SeeChange Studio, built in about five weeks",
    kind: "ship",
    note: "The AI video production platform, built in about five weeks.",
    action: { type: "href", href: "/work/video-studio" },
  },
  {
    start: "2026-08-03",
    end: "2026-08-09",
    title: "AI Photobooth live at SCMUN 2026",
    kind: "event",
    note: "Deployed at Joseph Lee Hall, and I was the person in charge on site.",
    action: { type: "href", href: "/work/photobooth" },
  },
  // CV: "\role{AI Engineer Intern}{Jun 2024 -- Jul 2024}{Seth Biotech}{Hong Kong}"
  {
    start: "2024-06-01",
    end: "2024-07-01",
    title: "AI engineer intern at Seth Biotech",
    kind: "work",
    note: "Pulled pulmonary nodule details out of CT scan reports into structured JSON at 95% accuracy, using local LLMs. The source gives months only (Jun 2024 to Jul 2024), so the dates sit on the 1st.",
  },
  // CV: "\role{B.Sc. Computer Science, Minor in Data Science}{Aug 2023 -- Aug 2027}{City University of Hong Kong ...}"
  {
    start: "2023-08-01",
    end: "2027-08-01",
    title: "B.Sc. Computer Science at CityUHK",
    kind: "study",
    note: "Minor in Data Science, with a full tuition scholarship. The source gives months only (Aug 2023 to Aug 2027), so the dates sit on the 1st.",
  },
];
