import type { Work } from "../work";

const work: Work = {
  slug: "agent-quest",
  title: "Creative AI Agent Quest",
  kicker: "Personal project · 2026",
  summary:
    "I built a gamified, AI-coached course that teaches anyone to build real things with an AI coding agent. It shapes itself around your background and the tool you use, and starts you free on Kilo Code or OpenCode.",
  role: "I built the course, the onboarding, the AI coach and the backend",
  when: "October 2026",
  stack: ["Next.js 15", "React 19", "TypeScript", "Postgres (Neon)", "Vercel Blob", "Cloudflare Workers AI", "Vitest"],
  status: "shipped",
  outcome: { value: "11 tools", note: "one course, worded for each tool, with every tool fact checked against the vendor's official docs on 22 Oct 2026" },
  links: [
    { label: "Live site", href: "https://creative-ai-agent-quest.vercel.app" },
    { label: "Source on GitHub", href: "https://github.com/akib-arifeen/ai-agent-learning-quest" },
  ],
  cover: {
    kind: "image",
    src: "/work/agent-quest/cover.jpg",
    alt: "The top of the Creative AI Agent Quest landing page, logged out: the headline Learn to build anything with an AI agent, four feature lines and a Start learning button.",
    w: 704,
    h: 440,
  },
  playSlug: "agent-quest",
  blocks: [
    {
      kind: "prose",
      heading: "What I wanted to build",
      paras: [
        "I wanted a course that teaches anyone to build real things with an AI coding agent, and I wanted it to fit the person taking it rather than the tool I happened to use. The course has 10 quests plus a Base Camp, and each quest has three variants that teach the same concept. XP, ranks, streaks, badges and a day-by-day plan are all worked out from saved progress.",
        "It began tied to one tool. The latest work stops that: a one-minute onboarding shapes the course around who you are and which AI coding tool you use. The onboarding and the pro track below are both live.",
      ],
    },
    {
      kind: "prose",
      heading: "What actually happened",
      paras: [
        "The onboarding turned out to be the part that matters. People will not read a course that assumes a setup they do not have, so a one-minute onboarding asks for role, coding experience, goal, AI tool, computer and time a week, one question per step, and the rest of the course rearranges itself around the answers.",
        "The pro track came later and turned out to be the part I am proudest of. It follows how professionals actually work with an agent: plan first, keep a rules file, plug in tools over MCP, add skills and hooks, delegate to cheap subagents, prove the work, run a lead with workers, run sessions in parallel and in CI, and ship safely.",
        "The last pass before production calmed the guide and the pro pages down to one idea per screen. Every quest now carries the official documentation for the apps it mentions, deduped by URL and labelled when a reference is community maintained, and six concept diagrams (loop, brief, context, MCP, delegate, team) draw themselves once on scroll and sit still when the system asks for reduced motion.",
      ],
    },
    {
      kind: "media",
      heading: "What it looks like",
      items: [
        { kind: "image", src: "/work/agent-quest/02-onboarding-tool.png", alt: "Onboarding step 4 of 6, asking which AI coding tool you will use, with Kilo Code and OpenCode shown as the free starting points.", w: 1600, h: 1000, caption: "The onboarding, the tool step. Help me pick recommends one of two free starts." },
        { kind: "image", src: "/work/agent-quest/03-basecamp-opencode.png", alt: "Base Camp with its steps worded for OpenCode.", w: 1600, h: 1000, caption: "Base Camp, worded for OpenCode." },
        { kind: "image", src: "/work/agent-quest/08-phone-coach.png", alt: "Spark, the AI coach, in a chat on a phone.", w: 390, h: 844, caption: "Spark, the coach, on a phone." },
        { kind: "image", src: "/work/agent-quest/09-plan.png", alt: "The day-by-day plan page.", w: 1600, h: 1000, caption: "The day-by-day plan." },
      ],
    },
    {
      kind: "steps",
      heading: "Onboarding",
      items: [
        { title: "Six short questions", body: "Role, coding experience, goal, AI tool, computer and time a week, one question per step." },
        { title: "Skippable and resumable", body: "You can skip it, it resumes where you left off, and you can edit every answer later from your profile." },
        { title: "Help me pick", body: "If you have no tool yet, the course recommends Kilo Code (an extension for VS Code) or OpenCode (runs in a terminal) as the free starts." },
        { title: "Existing learners are not interrupted", body: "Someone who already has progress skips the full-screen flow and sees a prompt on the home screen that they can dismiss." },
      ],
    },
    {
      kind: "prose",
      heading: "One curriculum, worded for each tool",
      paras: [
        "There is one curriculum, not eleven. The quest text has slots, and the tool you pick fills them: install steps for your computer, plan mode, how to add files, undo and the rules file. Eleven options are covered, from Kilo Code and OpenCode to Claude Code, Cursor, GitHub Copilot, Codex CLI and Cline, plus an Other option.",
        "A function fills the slots from one table of tool facts, and caches the result for each tool and operating system.",
        "A test renders every quest, variant, tool and operating system and checks that no slot is left empty. A second test checks the step counts against the earlier version, so ticks already saved still line up.",
      ],
    },
    {
      kind: "decisions",
      heading: "The calls I would defend",
      items: [
        {
          choice: "Check every tool fact against the vendor's docs",
          why: "Install steps, prices, free models, mode names and rules files change often, so each entry keeps its source links and a checked date.",
          cost: "The table goes stale. Someone has to re-check it against its sources before relying on prices or free-model names.",
        },
        {
          choice: "Fix the course when the research disagreed with it",
          why: "Kilo Code skips its snapshots when the folder is not a Git repository, so the old undo tip was wrong. Base Camp now turns Git on.",
          cost: "Existing learners see small wording changes, about 50 strings in the default Kilo rendering.",
        },
        {
          choice: "Teach Git save points where a tool has no undo",
          why: "Codex CLI has no undo command, so the course teaches Git save points instead.",
          cost: "Where vendor docs disagree, as with OpenCode's two live doc versions, the text has to cover both.",
        },
      ],
    },
    {
      kind: "prose",
      heading: "Spark, the coach",
      paras: [
        "Spark is a streaming AI coach. It critiques the learner's own prompts against a short recipe instead of writing them for them. Its system prompt knows the learner's tool, role, experience, computer, weekly time and goal, and any free text is fenced as data.",
        "Free text is flattened, stripped of angle brackets and fenced, and a test covers that fencing. With no profile, the part of the prompt about the learner is byte-identical to before.",
        "In one live check as a Claude Code user, Spark answered a question about undo with that tool's own keys.",
      ],
    },
    {
      kind: "facts",
      heading: "Evidence",
      items: [
        { value: "422", label: "tests passing", note: "the whole suite, including a sweep of every quest by variant by tool by OS for empty slots" },
        { value: "Live", label: "in production", note: "the landing page, the guide and the nine-level pro track; the MCP endpoint rejects requests without a token" },
        { value: "19 of 24", label: "planted bugs caught by mutation testing", note: "in the onboarding release; tests were then added for the main survivors" },
        { value: "375px", label: "width checked with axe-core", note: "WCAG 2.1 A and AA scan passes on every screen and sheet, no horizontal scroll" },
        { value: "11", label: "AI coding tools supported", note: "every fact linked to official docs, checked 22 Oct 2026" },
      ],
    },
    {
      kind: "prose",
      heading: "How I check the work",
      paras: [
        "The first idea was screen sharing plus a local OCR model. I researched it before building and dropped it. OCR is unreliable on code, a local vision model is heavy for a learner's laptop, and a shared screen can show API keys.",
        "So the app hosts its own MCP server. Learners connect the coding agent they already use with a copy-paste snippet, written for each of 11 tools. Their agent then sends real files and command output, like a rules file, a hook config or a git log.",
        "The server scrubs secret-looking lines such as keys, tokens and passwords, checks the evidence against the level's rules and stores it. The learner, their mentor and the AI coach can all see what was sent. Learners pick up MCP by using it.",
        "The checks look at the shape of the evidence. That makes it a learning loop, not proctoring, and the app says so to learners.",
        "Before shipping, a real Claude Code agent connected to the server and passed three levels. On one it got NOT YET with a clear fix, then passed after resubmitting.",
      ],
    },
    {
      kind: "facts",
      heading: "The pro track in numbers",
      items: [
        { value: "9", label: "pro levels" },
        { value: "11", label: "coding agents with a connect snippet" },
        { value: "3", label: "levels passed by a real agent", note: "Claude Code, end to end, on the test database" },
      ],
    },
    {
      kind: "prose",
      heading: "What broke",
      paras: [
        "The undo tip was wrong. Kilo Code skips its snapshots when the folder is not a Git repository, so the advice I had written was simply not true for anyone who started in a fresh folder. Base Camp now turns Git on, and the fix reached existing learners as small wording changes, about 50 strings in the default Kilo rendering.",
        "The other thing that broke was the assumption that one document describes one tool. Where vendor docs disagree, as with OpenCode's two live doc versions, the text has to cover both, and there is no way to write a single sentence that is true for both without being vague.",
      ],
    },
    {
      kind: "prose",
      heading: "What I learned",
      paras: [
        "To research before building, and to throw the research away when it is not good enough. The first idea was screen sharing plus a local OCR model, and dropping it before I wrote any code saved the project from a heavy, leaky and unreliable foundation.",
        "That learners pick up MCP by using it, not by reading about it. The pro track works because the learner connects the agent they already have and the agent does something real, so the protocol stops being a chapter and becomes a habit.",
      ],
    },
    {
      kind: "prose",
      heading: "What I would do differently",
      paras: [
        "I would schedule the course to a learner's weekly time from the start. It is still one sitting a day, so pacing it properly is the follow-up I know I owe people who cannot study every evening.",
        "I would also test the parts I have not: uploads, Google sign-in, the mentor view of a profile and a true cross-site iframe. Only Claude Code has been tested end to end against the MCP server, the other snippets follow each vendor's docs, and the screenshots use test accounts on a test database.",
      ],
    },
  ],
  related: ["lesson-pipeline", "loopcraft"],
};

export default work;
