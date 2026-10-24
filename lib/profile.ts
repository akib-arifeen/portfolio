// Profile facts, transcribed from public/akib-arifeen-cv.pdf and the copy already on this site.
// Nothing here is rounded up, renamed or inferred: if the CV does not say it, it is not here.

export type ExperienceEntry = {
  id: string;
  role: string;
  org: string;
  where: string;
  /** Display label, matching the site's "Nov 2025 to Jan 2026" voice. */
  when: string;
  /** ISO month, for the <time> element. */
  start: string;
  /** ISO month, or undefined for the current role. */
  end?: string;
  points: string[];
};

export type EducationEntry = {
  degree: string;
  org: string;
  when: string;
  start: string;
  end: string;
  notes: string[];
};

export const headline = "Software engineer";

export const statement =
  "I work on generative AI and full-stack products: the model plumbing, the interface, and the part that has to hold up in front of a room full of people. Most of what is on this site came out of that, from a 32-lesson production pipeline to a photobooth a few hundred people used in one evening.";

export const experience: ExperienceEntry[] = [
  {
    id: "see-change",
    role: "Software Engineer",
    org: "See Change Education, Asia Allied Group",
    where: "Hong Kong",
    when: "Sep 2025 to Present",
    start: "2025-09",
    points: [
      "Architected an AI video generation platform in Python and FastAPI that turns a prompt into a narrated, animated 4K video using multi-agent LLM workflows and self-hosted GPU inference, cutting generation time by 50%.",
      "Developed an AI photobooth in React and Spring Boot that restyles photos with prompt-engineered OpenAI and Google image models, plus a live voice agent on Azure Speech and an LLM. It served 200 to 300 guests per event and is now a product for schools.",
      "Engineered an AI lesson pipeline that turns recorded classes into videos, slides, bilingual subtitles and exercises on self-hosted NotebookLM and AI slide servers, powering production of a 32-lesson course with per-lesson production time cut by about 80%.",
      "Automated Zoom recording backup to AWS S3 for every class, with lesson matching and attendance tracking, freeing 150 GB of Zoom cloud storage.",
    ],
  },
  {
    id: "852healthkare",
    role: "Full Stack Developer, part-time",
    org: "852HealthKare",
    where: "Remote",
    when: "Nov 2025 to Jan 2026",
    start: "2025-11",
    end: "2026-01",
    points: [
      "Built an AI workout planner in Vue and MongoDB, cleaning and indexing a 1,000+ exercise open-source dataset to generate personalised plans and guide each session with voice and animation.",
    ],
  },
  {
    id: "seth-biotech",
    role: "AI Engineer Intern",
    org: "Seth Biotech",
    where: "Hong Kong",
    when: "Jun 2024 to Jul 2024",
    start: "2024-06",
    end: "2024-07",
    points: [
      "Extracted pulmonary nodule details from CT scan reports into structured JSON at 95% accuracy, using local LLMs with Ollama and LangChain so patient data stayed on premises.",
    ],
  },
];

export const education: EducationEntry[] = [
  {
    degree: "B.Sc. Computer Science, Minor in Data Science",
    org: "City University of Hong Kong",
    when: "Aug 2023 to Aug 2027",
    start: "2023-08",
    end: "2027-08",
    notes: [
      "CGPA 3.38/4.30, Full Tuition Scholarship.",
      "Coursework: Software Engineering Practice, Software Design, Data Structures, Algorithms, Database Systems, Operating Systems, Computer Networks, Multimodal Interface Design.",
    ],
  },
];

export const skills: { group: string; items: string[] }[] = [
  { group: "Languages", items: ["TypeScript", "Python", "Java", "SQL"] },
  { group: "Frameworks", items: ["React", "Next.js", "Vue", "Spring Boot", "FastAPI", "Node.js"] },
  {
    group: "AI",
    items: ["AI agents", "LLM orchestration", "prompt engineering", "MCP", "text-to-speech", "image and video generation"],
  },
  {
    group: "Infrastructure",
    items: ["AWS", "Docker", "Nginx", "Linux", "REST APIs", "MySQL", "Redis", "MongoDB"],
  },
  { group: "Practices", items: ["Agile/Scrum", "Git", "Jira", "unit testing", "code review", "CI/CD"] },
  { group: "Design", items: ["UI/UX", "motion design", "video production"] },
];
