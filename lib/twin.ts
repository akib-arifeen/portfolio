// "Ask Akib" — the studio character answers questions about Akib's work from a curated, sourced knowledge base.
// No LLM and no network: deterministic retrieval, so every answer is something Akib actually wrote down.
import type { MenuAction } from "./os/types";
import { contact } from "./content";
import { getWork } from "./work";

export type TwinEntry = {
  id: string;
  /** Example phrasings a visitor might type; used for matching. */
  questions: string[];
  /** Extra match terms (synonyms, product names, stack words). */
  keywords: string[];
  /** The spoken and shown answer: first person, at most 3 sentences, facts only. */
  answer: string;
  /** Where each fact comes from, e.g. "WORK_RECORD.md §3.2". Shown as small print. */
  sources: string[];
  /** Ids of entries to offer as follow-up chips. */
  followUps?: string[];
  /** Optional button under the answer, e.g. open the case study. */
  action?: { label: string; run: MenuAction };
};

export type TwinAnswer = {
  entryId: string | null;   // null when nothing matched well enough
  answer: string;
  sources: string[];
  followUps: { id: string; question: string }[];   // at most 3, each the first `questions[0]` of its entry
  action?: { label: string; run: MenuAction };
};

// Only published case studies get a button; a draft would be a 404.
const readCase = (slug: string): TwinEntry["action"] =>
  getWork(slug) ? { label: "Read the case study", run: { type: "href", href: `/work/${slug}` } } : undefined;

/** The curated entries (>= 30), written only from WORK_RECORD.md, the CV and PORTFOLIO_PLAN.md §14. */
export const entries: TwinEntry[] = [
  {
    id: "who",
    questions: ["Who is Akib Arifeen?", "Tell me about yourself", "Introduce yourself", "Who are you", "Where do you live", "Where are you based", "What is your name"],
    keywords: ["akib", "arifeen", "yourself", "introduce", "introduction", "intro", "background", "bio"],
    answer: "I'm Akib Arifeen, a software engineer in Hong Kong. I work at See Change Education, part of Asia Allied Group, and I study computer science at City University of Hong Kong. I build AI products from the GPU server to the last sound effect.",
    sources: ["CV, Summary and Education", "WORK_RECORD.md §2"],
    followUps: ["now", "seechange", "stack"],
  },
  {
    id: "now",
    questions: ["What is your job at SeeChange?", "What do you do for work", "What is your current role", "Where do you work", "How long have you been at SeeChange"],
    keywords: ["job", "role", "worked", "working", "long", "since", "tenure", "there", "employer", "company", "engineer", "position", "currently", "fulltime"],
    answer: "I'm a software engineer at See Change Education in Hong Kong. I started there in September 2025 and I'm now full-time. These days I build AI products end to end: video, voice, lessons and event tools.",
    sources: ["CV, Experience", "WORK_RECORD.md §1"],
    followUps: ["seechange", "teamwork", "education"],
  },
  {
    id: "seechange",
    questions: ["What did you build at SeeChange?", "What have you built at See Change", "What have you built so far", "What projects have you shipped"],
    keywords: ["projects", "portfolio", "built", "shipped", "products", "highlights", "achievements"],
    answer: "At See Change I've built four main things: an AI video platform, an AI photobooth, a lesson generation pipeline and a Zoom recording backup. Each began as a short request, and I took it through to real users. Ask me about any of them.",
    sources: ["CV, Experience", "WORK_RECORD.md §3, §4"],
    followUps: ["video", "photobooth", "lessons"],
  },
  {
    id: "stack",
    questions: ["What is your tech stack?", "Which programming languages do you use", "Do you use Python, Java or TypeScript", "Do you know React or Next.js", "What technologies and frameworks do you use"],
    keywords: ["technologies", "technology", "languages", "frameworks", "tools", "skills", "vue", "spring", "fastapi", "sql", "aws", "docker", "redis", "mysql", "mongodb"],
    answer: "Mostly TypeScript, Python, Java and SQL. On the web that means React, Next.js and Vue, and on the server Spring Boot, FastAPI and Node.js. I also work with AWS, Docker, Nginx, MySQL, Redis and MongoDB.",
    sources: ["CV, Skills"],
    followUps: ["ai", "reliability", "education"],
  },
  {
    id: "ai",
    questions: ["What AI work have you done?", "Do you build AI agents", "Have you worked with LLMs", "What do you know about generative AI"],
    keywords: ["llm", "agents", "genai", "prompt", "prompts", "mcp", "tts", "asr", "speech", "models", "ollama", "langchain"],
    answer: "I build with LLM agents, prompt engineering, MCP, text-to-speech, speech recognition and image and video generation. A lot of it runs on a GPU box I set up myself with open models, and some on hosted APIs. I care most about systems that ship to real users, not demos.",
    sources: ["CV, Skills", "WORK_RECORD.md §2"],
    followUps: ["video-gpu", "video-agents", "photobooth-images"],
  },
  {
    id: "video",
    questions: ["Tell me about the AI video platform", "What is SeeChange Studio", "How do you generate videos from a prompt"],
    keywords: ["videos", "platform", "narrated", "animated", "4k", "generation", "promo", "ceo"],
    answer: "It turns a prompt or a lesson into a narrated, animated 4K video. Multi-agent LLM workflows plan, write and review every scene, and open-source video and voice models run on a self-hosted GPU box. I added 4K generation and cut generation time by 50%.",
    sources: ["CV, Experience", "WORK_RECORD.md §3.1, §7"],
    followUps: ["video-agents", "video-gpu", "video-speed"],
    action: readCase("video-studio"),
  },
  {
    id: "video-agents",
    questions: ["Which agents run the video pipeline?", "What is the director agent", "How do the agents plan a scene"],
    keywords: ["multiagent", "showrunner", "director", "writer", "reviewer", "scenes", "storyboard", "gate"],
    answer: "A showrunner and director agent plans the video, then separate roles handle writing, editing, fact-checking, visual design, review and audience testing. A Director chat edits a project gate by gate: plan, script, storyboard, assets, assembly, review. Scene types range from talking-avatar presenters to motion graphics and 3D.",
    sources: ["WORK_RECORD.md §3.1"],
    followUps: ["video-quality", "video-gpu", "video-speed"],
  },
  {
    id: "video-gpu",
    questions: ["What runs on your GPU server?", "What is self-hosted inference", "Which open models do you run locally"],
    keywords: ["comfyui", "minimax", "chatterbox", "whisper", "wsl", "qwen", "local", "selfhosted", "render", "relay", "oracle"],
    answer: "It's a Windows and WSL 2 box running ComfyUI with MiniMax H3 for talking-avatar video, Chatterbox for narration and Whisper large-v3-turbo for captions. A memory-gated queue releases ComfyUI between stages and waits for RAM headroom. I also built the installer, the public relay in front of it and a keepalive that keeps everything up.",
    sources: ["WORK_RECORD.md §3.1"],
    followUps: ["video-speed", "reliability", "ai"],
  },
  {
    id: "video-speed",
    questions: ["How did you make video generation faster?", "Where does the 50% come from", "How fast is the score rendering"],
    keywords: ["speed", "performance", "optimisation", "optimization", "quicker", "render", "rendering", "parallel"],
    answer: "I cut video generation time by 50% and added 4K output. Separately, music score rendering went from 433 seconds to 99 seconds by rendering in parallel windows.",
    sources: ["CV, Experience", "WORK_RECORD.md §7"],
    followUps: ["video-gpu", "video-quality", "video"],
  },
  {
    id: "video-quality",
    questions: ["How do you check the videos are good?", "What are the quality gates", "How do you test the pipeline output"],
    keywords: ["gates", "quality", "validate", "judge", "qa", "dead", "legibility"],
    answer: "Nothing is marked complete until a delivery gate decodes and measures every file. Other gates check legibility, dead air and frames sampled every two seconds against the script and plan. A pairwise video judge, calibrated to the owner's verdicts, compares versions.",
    sources: ["WORK_RECORD.md §3.1"],
    followUps: ["reliability", "video-agents", "video"],
  },
  {
    id: "cantonese",
    questions: ["Can the AI speak Cantonese?", "Do you support Chinese", "What about Hong Kong languages", "Is it bilingual"],
    keywords: ["chinese", "mandarin", "bilingual", "hongkong", "localisation", "localization", "translation", "english"],
    answer: "Yes. ARI, the photobooth host, talks with guests in English or Cantonese, and I wrote the voicelines in both. In the video platform, Cantonese and Mandarin are adapted for Hong Kong pupils rather than machine translated.",
    sources: ["WORK_RECORD.md §3.1, §3.2"],
    followUps: ["photobooth-voice", "photobooth", "video"],
  },
  {
    id: "photobooth",
    questions: ["Tell me about the AI photobooth", "What is ARI", "What did you do at SCMUN", "Tell me about the booth"],
    keywords: ["photobooth", "booth", "ari", "scmun", "events", "event", "guests", "photo", "photos", "dinner", "character"],
    answer: "ARI is an animated character who greets guests, talks with them in English or Cantonese, restyles their photo with AI and prints it on the spot. It ran at SCMUN 2026 and the AAI dinner, with 200 to 300 guests per event. I built every layer: the animation, the voicelines, the prompts, the app and a silent-print agent.",
    sources: ["CV, Experience", "WORK_RECORD.md §3.2, §7"],
    followUps: ["photobooth-flow", "photobooth-voice", "photobooth-print"],
    action: readCase("photobooth"),
  },
  {
    id: "photobooth-flow",
    questions: ["What happens when a guest uses the booth?", "What are the steps of the photobooth flow", "What do guests see"],
    keywords: ["flow", "steps", "journey", "qr", "interview", "facts", "countdown", "result"],
    answer: "The flow runs attract, capture, style, generating, result, confirm, QR, ARI's mic interview, print and goodbye. While the image generates, ARI shares fun facts so the wait feels short. It can also interview guests for marketing.",
    sources: ["WORK_RECORD.md §3.2"],
    followUps: ["photobooth-voice", "photobooth-images", "photobooth-print"],
  },
  {
    id: "photobooth-voice",
    questions: ["How does ARI talk to guests?", "Which speech tools does ARI use", "Who wrote the voicelines"],
    keywords: ["azure", "minimax", "tts", "voice", "voicelines", "recognition", "speak", "persona", "greet"],
    answer: "Azure speech handles recognition, MiniMax text-to-speech gives ARI a voice, and an LLM writes live replies in a set persona, with fixes so Cantonese sounds spoken. ARI greets people as they approach. I wrote the voicelines and scripts myself, in English and Cantonese.",
    sources: ["WORK_RECORD.md §3.2"],
    followUps: ["cantonese", "sound", "photobooth-images"],
  },
  {
    id: "photobooth-images",
    questions: ["Which image models does the photobooth use?", "How does the AI restyle a picture", "What looks can guests pick"],
    keywords: ["openai", "flux", "nano", "banana", "kie", "gpt", "looks", "restyle", "styles", "themes", "face", "packs"],
    answer: "Looks are generated through several providers: OpenAI GPT Image 2, Google Nano Banana and Flux 2, via Kie. I added face detection, randomised fun looks and accessories, and themed packs for events like SCMUN and the AAI dinner. An admin tool lets me try a look before guests see it.",
    sources: ["WORK_RECORD.md §3.2"],
    followUps: ["photobooth-flow", "photobooth-print", "ai"],
  },
  {
    id: "photobooth-print",
    questions: ["How does the photobooth print silently?", "What is the print agent", "Why did you build a printing service"],
    keywords: ["sumatra", "cups", "exe", "agent", "printer", "windows", "node", "prints"],
    answer: "Browsers cannot print silently, so I wrote a small Node service that runs on the booth laptop and prints through SumatraPDF on Windows or CUPS elsewhere. It ships as one hidden background .exe that starts on login and needs no admin rights. It also handles A6 templates, duplex and group copies.",
    sources: ["WORK_RECORD.md §3.2, §4"],
    followUps: ["photobooth-flow", "photobooth", "reliability"],
  },
  {
    id: "photobooth-product",
    questions: ["Did the photobooth become a product for schools?", "What is the AI Magic Box"],
    keywords: ["magic", "box", "schools", "school", "commercial", "students", "marketing"],
    answer: "Marketing turned the booth into the AI Magic Box, a proposal for schools where students sign in, complete AI speaking challenges and get a personalised collectible photo card. Optional extras include a frame-design workshop and engagement data for school management.",
    sources: ["WORK_RECORD.md §3.2", "CV, Experience"],
    followUps: ["photobooth", "photobooth-flow", "fuzzy"],
  },
  {
    id: "lessons",
    questions: ["Tell me about the AI lesson pipeline", "What is Thinking Lab", "How do you turn class recordings into lessons"],
    keywords: ["lessons", "course", "teachers", "classes", "subtitles", "slides", "exercises", "ready"],
    answer: "It turns recorded classes into ready-to-publish lessons: video, slides, bilingual subtitles and exercises, with a teacher reviewing everything before students see it. It powers production of a 32-lesson course, and per-lesson time dropped by about 80%, from days to hours. That 80% is my estimate, not a measurement.",
    sources: ["CV, Experience", "WORK_RECORD.md §3.3, §7"],
    followUps: ["lessons-how", "zoom", "notebooklm"],
    action: readCase("lesson-pipeline"),
  },
  {
    id: "lessons-how",
    questions: ["How does Thinking Lab generate a lesson?", "What is the blueprint step", "How does bulk generation run"],
    keywords: ["blueprint", "bulk", "branding", "difficulty", "publish", "review"],
    answer: "It starts from a class recording or document and extracts a blueprint that a person reviews. NotebookLM generates the video with branding and retries, and bulk jobs run through a produce, review, publish workflow with live progress. Speaking tasks get progressive difficulty, level by level.",
    sources: ["WORK_RECORD.md §3.3"],
    followUps: ["notebooklm", "lessons", "zoom"],
  },
  {
    id: "notebooklm",
    questions: ["How did you set up the NotebookLM server?", "What is the Presenton slides server", "Did you do any DevOps"],
    keywords: ["forge", "laravel", "headless", "ssh", "cron", "presenton", "mcp", "nexus", "nginx", "devops"],
    answer: "I deployed a NotebookLM MCP server on a cloud box provisioned through Laravel Forge, with multi-tenant daemons. The box is headless, so I sign in to Google through Chrome over SSH with X11 forwarding, and cron jobs keep the sessions alive. I also set up a Presenton slides server behind Nginx and built seeChange Slides as a fork of it.",
    sources: ["WORK_RECORD.md §3.5"],
    followUps: ["lessons-how", "stack", "ai"],
  },
  {
    id: "zoom",
    questions: ["Tell me about the Zoom recording backup", "How do you back up Zoom recordings", "What did you automate with Zoom"],
    keywords: ["recordings", "backup", "s3", "attendance", "storage", "automation"],
    answer: "It backs up every class recording from Zoom to AWS S3, links each one to its lesson, collects attendance and frees Zoom storage. This year it freed 150 GB of Zoom cloud storage. It began as a one-line ask to save the recordings.",
    sources: ["CV, Experience", "WORK_RECORD.md §3.4, §4, §7"],
    followUps: ["zoom-how", "fuzzy", "lessons"],
    action: readCase("zoom-backup"),
  },
  {
    id: "zoom-how",
    questions: ["How are recordings matched to lessons and attendance counted?", "What alerts does the Zoom backup send"],
    keywords: ["oauth", "matching", "alert", "presumed", "teacher", "scratch", "queue", "reclaim"],
    answer: "I use Zoom's Server-to-Server OAuth to discover recordings, match one recording per session and run the backup with live progress. Attendance is split on the lesson window, with presumed-teacher logic and unit tests. A day-end alert flags classes with missing recordings or materials, and one broken recording no longer blocks the queue.",
    sources: ["WORK_RECORD.md §3.4"],
    followUps: ["zoom", "reliability", "lessons"],
  },
  {
    id: "healthkare",
    questions: ["What did you do at 852HealthKare?", "Tell me about the workout planner", "What was your part-time job at HealthKare"],
    keywords: ["healthkare", "852", "workout", "exercise", "exercises", "fitness", "vue", "quasar", "mongodb", "parttime"],
    answer: "From November 2025 to January 2026 I worked part-time on a workout module for 852HealthKare in Vue, Quasar and MongoDB. I cleaned and indexed an open-source library of more than 1,000 exercises, then built an AI agent that makes a personal plan and guides each session with voice and animation.",
    sources: ["CV, Experience", "WORK_RECORD.md §3.10"],
    followUps: ["ai", "stack", "seth"],
    action: readCase("workout-planner"),
  },
  {
    id: "seth",
    questions: ["What did you do at Seth Biotech?", "Have you done an internship", "Did you work with medical data"],
    keywords: ["internship", "intern", "ct", "scan", "nodule", "ollama", "langchain", "medical", "local", "llm"],
    answer: "In June and July 2024 I interned as an AI engineer at Seth Biotech. I used local LLMs with Ollama and LangChain to pull pulmonary nodule details out of CT scan reports into structured JSON at 95% accuracy. Running locally kept patient data on premises.",
    sources: ["CV, Experience"],
    followUps: ["ai", "healthkare", "education"],
  },
  {
    id: "quest",
    questions: ["Tell me about Creative AI Agent Quest", "What is Spark the AI coach", "What is Agent Quest"],
    keywords: ["quest", "spark", "coach", "gamified", "course", "learners", "neon", "mentor", "vercel", "tutor"],
    answer: "Creative AI Agent Quest is a live, gamified course that teaches anyone to build with AI agents, coached by Spark, a streaming AI tutor. It started for one learner and I built it for everyone: learners connect their own coding agent over MCP to prove each pro level. It runs on Next.js with in-house sign-in, Postgres on Neon, Vercel Blob and a mentor dashboard.",
    sources: ["PORTFOLIO_PLAN.md §14"],
    followUps: ["ai", "stack", "links"],
    action: readCase("agent-quest"),
  },
  {
    id: "loopcraft",
    questions: ["Tell me about LoopCraft"],
    keywords: ["looper", "loop", "loops", "music", "audio", "multitrack", "tracks", "wav", "sample", "rebuilding"],
    answer: "LoopCraft is a multi-track looper that runs in the browser, and the rebuilt version is live. One tap plays a synthesized demo with no microphone needed. You can edit the beat, record loops from pads or a microphone, mix with real effects, export a WAV, and browse a sample shelf that groups every loop as in key, always fits or clashes with the project key.",
    sources: ["lib/cases/loopcraft.ts", "LoopCraft README"],
    followUps: ["sound", "gravity-wars", "culinary"],
    action: readCase("loopcraft"),
  },
  {
    id: "gravity-wars",
    questions: ["What is Gravity Wars?"],
    keywords: ["game", "games", "beta", "physics", "playground", "unfinished"],
    answer: "Gravity Wars is a browser gravity brawler, and the rebuilt version is live. Endless is the default mode: eat debris, absorb smaller rivals, slingshot around stars and climb a live top ten, with dash, repulse and a singularity ultimate, five arenas and 23 achievements. It runs entirely offline, and you can play it in the Playground app on my laptop.",
    sources: ["lib/cases/gravity-wars.ts", "Gravity Wars README"],
    followUps: ["loopcraft", "twinkle-star", "culinary"],
    action: readCase("gravity-wars"),
  },
  {
    id: "leyci",
    questions: ["Tell me about Léyci", "Have you built a storefront", "What is the bilingual shop"],
    keywords: ["storefront", "store", "shop", "fashion", "instagram", "astro", "cloudflare", "whatsapp", "bilingual", "ecommerce", "label"],
    answer: "Léyci is a self-initiated concept for a Hong Kong label: I turned an Instagram account into a live bilingual storefront in about a day. It uses Astro on Cloudflare Pages and D1, a bilingual admin, a cart that hands off to WhatsApp, and Cantonese copy I researched for the right register. The AI fabric films carry a guardrail so the model never invents a face.",
    sources: ["PORTFOLIO_PLAN.md §14"],
    followUps: ["cantonese", "fuzzy", "links"],
    action: readCase("leyci"),
  },
  {
    id: "twinkle-star",
    questions: ["What is Twinkle Star?", "Is Twinkle Star live", "Can I try Twinkle Star"],
    keywords: ["flutter", "cityu", "sm2609", "team", "mobile", "checkins", "letters", "starjar", "timezone"],
    answer: "Twinkle Star is a live Flutter web app for a parent and a child living apart, and I built it from a UX design by a CityU SM2609 team. A check-in, a bell, a message that lands in the other person's morning and letters that stay sealed: every caring action fills a star jar they share. It runs entirely on the device, with no server and no account.",
    sources: ["lib/cases/twinkle-star.ts", "Twinkle Star README"],
    followUps: ["gravity-wars", "education", "stack"],
    action: readCase("twinkle-star"),
  },
  {
    id: "save-your-princess",
    questions: ["What is Save Your Princess?", "Tell me about the mending game", "Is Save Your Princess playable"],
    keywords: ["save", "princess", "mend", "mending", "castle", "shard", "shards", "window", "narrative", "babylon"],
    answer: "Save Your Princess is a 3D narrative game in the browser, and the playable slice is the MEND chamber: a hooded figure finds three shards and fits them into a broken leaded window, with no timer and no fail state. I built the story shape, the mechanic, the rooms and the code in Babylon.js. It is a vertical slice, not the finished game, and the page says exactly what is still being built.",
    sources: ["lib/cases/save-your-princess.ts", "SYP playtest build mend-v1-2026-10-24"],
    followUps: ["gravity-wars", "design", "twinkle-star"],
    action: readCase("save-your-princess"),
  },
  {
    id: "fyp",
    questions: ["What is your final year project?", "Tell me about your FYP", "What is the shortest-path engine"],
    keywords: ["fyp", "thesis", "cpp", "openmp", "cmake", "dimacs", "graph", "graphs", "road", "routing", "travel", "algorithms", "research"],
    answer: "My final year project is a shortest-path engine that computes exact many-to-many travel-time tables on road networks. It's in progress, written in C++17 with CMake and OpenMP, and I'm studying search reuse, multi-core parallelism and vertex reordering on DIMACS graphs. The repo is private, so code is available on request.",
    sources: ["PORTFOLIO_PLAN.md §14"],
    followUps: ["education", "stack", "links"],
    action: readCase("shortest-path"),
  },
  {
    id: "culinary",
    questions: ["Tell me about Culinary Companion"],
    keywords: ["recipe", "recipes", "cooking", "gestures", "gesture", "handsfree", "vision", "kitchen", "pass", "ticket"],
    answer: "Culinary Companion is a hands-free recipe app built with React and browser-based computer vision, redesigned on The Pass: a kitchen-ticket system made to be read from a metre away. Hand gestures and voice move through the steps, each step is read aloud, and the eight recipes are real and licensed with their credits on the ticket.",
    sources: ["lib/cases/culinary-companion.ts", "Culinary Companion README and DESIGN.md"],
    followUps: ["loopcraft", "stack", "ai"],
    action: readCase("culinary-companion"),
  },
  {
    id: "fuzzy",
    questions: ["How do you handle vague requirements?", "How do you work with fuzzy requirements", "What do you do when nobody gives you a spec", "Do you take initiative"],
    keywords: ["ambiguity", "fuzzy", "spec", "specs", "initiative", "ownership", "autonomy", "proactive", "independent", "ambiguous"],
    answer: "Several of my projects started as a one-line ask, like 'make a photobooth' or 'back up the Zoom recordings', with no spec. I design the flow myself, invent the features it needs and ship it to real users. The photobooth became a character-led experience, and the Zoom backup grew attendance, storage reclaim and missing-recording alerts.",
    sources: ["WORK_RECORD.md §2, §4"],
    followUps: ["photobooth", "zoom", "reliability"],
  },
  {
    id: "reliability",
    questions: ["How do you make systems reliable?", "Do you write tests", "What happens when something fails"],
    keywords: ["reliability", "tests", "testing", "robust", "monitoring", "resilience", "keepalive", "guards", "crash", "resumable"],
    answer: "I build delivery gates, crash-safe queues, memory guards, keepalives and resumable jobs, and I write tests. When end-to-end runs fail I fix the real cause, like the photobooth getting stuck at 99% or job state that needed to move to Redis for multiple replicas.",
    sources: ["WORK_RECORD.md §2, §4"],
    followUps: ["video-quality", "video-gpu", "teamwork"],
  },
  {
    id: "sound",
    questions: ["Do you do sound design?", "Can I hear the studio", "Do you work with audio", "Music and songs"],
    keywords: ["audio", "songs", "song", "voicelines", "narration", "sfx", "mixing", "mastering", "mic", "sounds", "score"],
    answer: "I write and direct character voicelines in English and Cantonese, mix and master narration, and design the small sounds that make an interface feel finished, including this room. On the video platform I also score music and align sound effects to motion hits. Turn sound on to hear the studio.",
    sources: ["lib/content.ts (studio notes)", "WORK_RECORD.md §3.1"],
    followUps: ["photobooth-voice", "video-speed", "design"],
  },
  {
    id: "design",
    questions: ["Are you also a designer?", "Do you do UX and motion design", "Are you a creative director"],
    keywords: ["ux", "ui", "motion", "creative", "director", "animation", "animations", "promo", "video"],
    answer: "Yes, I'm an engineer and creative director in one. On the photobooth I did the UX design, animations, voicelines and prompts as well as the code, and I wrote, produced and edited the Studio's CEO promo video.",
    sources: ["CV, Skills", "WORK_RECORD.md §2"],
    followUps: ["sound", "photobooth", "site"],
  },
  {
    id: "site",
    questions: ["How was this site built?", "How did you create this room", "What is this site made with"],
    keywords: ["site", "website", "three", "threejs", "r3f", "webgl", "3d", "room", "nextjs", "laptop", "desktop"],
    answer: "The studio is a 3D scene built in code with three.js and React Three Fiber on Next.js, and the character is built in code too. Click the objects to see the projects behind them, walk up to the photobooth, or open my laptop for a small desktop with notes, photos, music and a terminal.",
    sources: ["lib/content.ts (studio notes)", "PORTFOLIO_PLAN.md §12, §13"],
    followUps: ["character", "design", "stack"],
  },
  {
    id: "character",
    questions: ["Who is the character at the desk?", "Is that you in the room", "Describe your 3D avatar"],
    keywords: ["avatar", "glasses", "headphones", "hair", "model", "resident", "cartoon"],
    answer: "That's a stylised me, built in code from a few casual photos: swept hair with brown tips, round glasses, headphones around my neck. He types when you're not looking and waves if you click him. Turn sound on and he talks back.",
    sources: ["lib/content.ts (studio notes)"],
    followUps: ["site", "how-chat", "who"],
  },
  {
    id: "how-chat",
    questions: ["Are you a real AI chatbot?", "Is this ChatGPT", "Are your answers written by you", "Is this an LLM"],
    keywords: ["bot", "chatgpt", "gpt", "llm", "written", "scripted", "privacy", "twin", "clone"],
    answer: "No, this isn't a live AI model. I wrote these answers from my work record and CV, and your browser picks the closest one by matching words, so nothing you type is sent anywhere. If I haven't written something down, I'll say so.",
    sources: ["PORTFOLIO_PLAN.md §5", "lib/twin.ts"],
    followUps: ["character", "site", "contact"],
  },
  {
    id: "contact",
    questions: ["How can I contact you?", "What is your email", "Where can I find you on LinkedIn", "How do I reach you", "Can you build me a website", "Can you make me a website"],
    keywords: ["email", "mail", "linkedin", "reach", "message", "touch", "hello", "website", "build"],
    answer: `Write to me at ${contact.email}. I'm also on LinkedIn at linkedin.com/in/akibarifeen and on GitHub as akib-arifeen. The CV button at the top of the page downloads my CV.`,
    sources: ["lib/content.ts (contact)"],
    followUps: ["availability", "links", "who"],
  },
  {
    id: "availability",
    questions: ["Are you available for hire?", "Are you open to work", "Can I hire you", "Are you looking for a new job", "Do you take freelance projects"],
    keywords: ["hire", "hiring", "hired", "freelance", "opportunity", "opportunities", "contract", "availability", "employment", "recruiter", "recruiting", "open"],
    answer: `The best way to find out is to write to me at ${contact.email}. I'd rather talk it through than guess from this page.`,
    sources: ["PORTFOLIO_PLAN.md §5", "lib/content.ts (contact)"],
    followUps: ["contact", "seechange", "who"],
  },
  {
    id: "education",
    questions: ["Where did you study?", "What is your degree", "Which university do you go to", "Tell me about CityU", "Tell me about your education", "Are you a student"],
    keywords: ["cityu", "university", "degree", "school", "student", "college", "computer", "science", "scholarship", "graduate", "graduation", "coursework", "studying"],
    answer: "I'm studying computer science with a minor in data science at City University of Hong Kong, from August 2023 to August 2027, on a full tuition scholarship. Relevant coursework includes software engineering practice, software design, data structures, algorithms, database systems, operating systems, computer networks and multimodal interface design.",
    sources: ["CV, Education"],
    followUps: ["fyp", "stack", "seth"],
  },
  {
    id: "cv",
    questions: ["Can I see your CV?", "Where can I download your CV", "Do you have a resume"],
    keywords: ["cv", "resume", "curriculum", "vitae", "pdf", "download"],
    answer: "Here's my CV.",
    sources: ["CV"],
    followUps: ["contact", "education", "seechange"],
    action: { label: "Open my CV", run: { type: "href", href: "/akib-arifeen-cv.pdf", newTab: true } },
  },
  {
    id: "teamwork",
    questions: ["Do you work in a team?", "How do you collaborate with other developers", "Do you use Agile and Jira"],
    keywords: ["teammates", "collaborate", "collaboration", "agile", "scrum", "jira", "git", "review", "sprint", "together", "solo"],
    answer: "Yes. Nexus AI, the CMS and Think & Speak are team codebases where I usually took a feature end to end, like Thinking Lab, the Zoom automation, quota tracking and group-discussion scoring. We work in sprints with stand-ups, Jira, pull requests and code review.",
    sources: ["WORK_RECORD.md §1b, §7"],
    followUps: ["lessons", "zoom", "reliability"],
  },
  {
    id: "links",
    questions: ["Is your code on GitHub?", "Can I look at your repos", "Do you have open source work", "Are your repositories public"],
    keywords: ["repo", "repos", "repository", "repositories", "source", "public", "private", "opensource"],
    answer: "My GitHub is github.com/akib-arifeen. Some repositories are public, like Creative AI Agent Quest, LoopCraft and Gravity Wars, and some are private, such as the Léyci storefront. For the private ones, ask me and we can talk about what I can share.",
    sources: ["lib/content.ts (contact)", "PORTFOLIO_PLAN.md §14"],
    followUps: ["quest", "contact", "fyp"],
  },
];

/** Three to five starter questions shown as chips before the visitor types (entry ids). */
export const STARTERS: readonly string[] = ["seechange", "photobooth", "stack", "contact"];

/** Score at or above which an entry is a match; below it, `answer` returns the fallback. */
export const MATCH_THRESHOLD = 3;

/** Words ignored when matching. */
export const STOP_WORDS: ReadonlySet<string> = new Set([
  "a", "an", "the", "and", "or", "of", "to", "in", "on", "for", "with", "at", "by", "from", "about", "is", "are", "was",
  "were", "be", "do", "does", "did", "you", "your", "yours", "i", "me", "my", "we", "it", "its", "this", "that", "what",
  "whats", "how", "why", "who", "where", "when", "which", "can", "could", "would", "tell", "s", "have", "has",
]);

/**
 * Answer a question. Never throws, never returns an empty answer.
 * - The question is folded (lowercase, accents stripped, every punctuation character replaced by a space, so "full-stack"
 *   becomes "full stack") and split into words; stop words are dropped.
 * - Each entry scores the sum over query words of: 3 if the word equals a whole word of any of its folded `questions`,
 *   2 if it matches a keyword (exact, or keyword starts with the word when the word has >= 4 letters), else 0.
 *   Ties break by entry order.
 * - The best entry wins when its score >= MATCH_THRESHOLD; its followUps map to { id, question: questions[0] }.
 * - Otherwise (including empty input) the fallback: entryId null, an answer that says Akib hasn't written that down yet
 *   and invites an email to the contact address from lib/content.ts, sources [], followUps = the STARTERS.
 */
export function answer(question: string): TwinAnswer {
  const words = fold(String(question ?? "")).filter((w) => !STOP_WORDS.has(w));
  let best: TwinEntry | null = null;
  let bestScore = 0;
  if (words.length > 0) {
    for (const e of entries) {
      const { inQuestions, keywords } = indexOf(e);
      let score = 0;
      for (const w of words) {
        if (inQuestions.has(w)) score += 3;
        else if (keywords.some((k) => k === w || (w.length >= 4 && k.startsWith(w)))) score += 2;
      }
      if (score > bestScore) { best = e; bestScore = score; }   // strict: ties keep the earlier entry
    }
  }
  if (best && bestScore >= MATCH_THRESHOLD) {
    const followUps = (best.followUps ?? []).slice(0, 3).flatMap((id) => {
      const target = entries.find((x) => x.id === id);
      return target ? [{ id, question: target.questions[0] }] : [];
    });
    return { entryId: best.id, answer: best.answer, sources: best.sources, followUps, action: best.action };
  }
  const starters = STARTERS.flatMap((id) => {
    const target = entries.find((x) => x.id === id);
    return target ? [{ id, question: target.questions[0] }] : [];
  });
  return {
    entryId: null,
    answer: `I haven't written that down yet. Email me at ${contact.email} and I'll answer it properly.`,
    sources: [],
    followUps: starters,
  };
}

/** Folded match terms per entry object, computed once. Keyed by the entry itself, so swapping entries in the live array is picked up. */
const index = new WeakMap<TwinEntry, { inQuestions: Set<string>; keywords: string[] }>();
function indexOf(e: TwinEntry) {
  let hit = index.get(e);
  if (!hit) {
    hit = { inQuestions: new Set(e.questions.flatMap(fold)), keywords: e.keywords.map((k) => fold(k).join(" ")).filter(Boolean) };
    index.set(e, hit);
  }
  return hit;
}

/** Lowercase, strip accents, turn punctuation into spaces, split into words. */
function fold(s: string): string[] {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}
