import type { Work } from "../work";

const work: Work = {
  slug: "workout-planner",
  title: "AI workout planner",
  kicker: "852HealthKare · Nov 2025 to Jan 2026",
  summary:
    "The workout module for 852HealthKare: an AI agent that builds a personalised plan for each user, then guides every session with voice and animation.",
  role: "Built the workout module: the exercise data, the plan-building agent and the guided sessions",
  when: "Nov 2025 to Jan 2026",
  stack: ["Vue.js", "Quasar", "TypeScript", "MongoDB"],
  status: "prototype",
  outcome: { value: "1,000+ exercises", note: "open-source dataset, cleaned and indexed" },
  links: [],
  cover: {
    kind: "image",
    src: "/work/workout-planner/cover.svg",
    alt: "An illustration of a weekly workout plan on a calendar grid, with a dumbbell and sound waves beside it.",
    w: 1200,
    h: 750,
  },
  blocks: [
    {
      kind: "prose",
      heading: "What it is",
      paras: [
        "At 852HealthKare I built the workout module as a part-time developer. It is an AI workout planner: it creates a personalised plan for each user and then guides each session with voice and animation.",
        "Users track and work through their exercises on the schedule they choose, and the voice and animations walk them through each one.",
        "I do not have the company's code to show, so this page describes the work and shows no source.",
      ],
    },
    {
      kind: "steps",
      heading: "How it fits together",
      items: [
        { title: "Exercise data", body: "I imported open-source exercise and animation datasets, then cleaned and indexed a set of more than 1,000 exercises." },
        { title: "A plan for each user", body: "An AI agent uses that data to create a personalised workout plan for each user." },
        { title: "Guided sessions", body: "Users follow the plan on their own schedule, tracking each exercise while voice and animations guide them through it." },
      ],
    },
    {
      kind: "facts",
      heading: "At a glance",
      items: [
        { value: "1,000+", label: "exercises", note: "from an open-source dataset I cleaned and indexed" },
      ],
    },
  ],
  related: ["culinary-companion", "agent-quest"],
};

export default work;
