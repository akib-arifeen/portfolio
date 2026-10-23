import type { Work } from "../work";

const work: Work = {
  slug: "video-studio",
  title: "AI video generation platform",
  kicker: "See Change Education · 2026",
  summary:
    "I built a studio that turns a prompt, a lesson blueprint or an uploaded document into a finished, narrated, animated video. A team of AI agents plans each one, and a GPU box I set up and look after renders it.",
  role: "I built the architecture, the agent pipeline, the render box, the API and the CMS integration",
  when: "Sep to Oct 2026",
  stack: ["Python", "FastAPI", "TypeScript", "React", "Java/Spring Boot", "ComfyUI", "MiniMax H3", "Chatterbox TTS", "FFmpeg", "Remotion"],
  status: "shipped",
  outcome: { value: "50% faster", note: "generation time, and 4K output added" },
  links: [],
  cover: {
    kind: "image",
    src: "/work/video-studio/chest.jpg",
    alt: "A treasure chest with its lid open and light rays and gold coins bursting out, a still from a generated 3D shot titled Reward unlocked.",
    w: 1280,
    h: 720,
  },
  blocks: [
    {
      kind: "prose",
      heading: "What I wanted to build",
      paras: [
        "I wanted one place where you describe a video and get a finished one. Inside the company this became SeeChange Studio. Nobody handed me a spec, so I designed the pipeline, the quality gates and the way it learns from its own results. It turns a prompt, a lesson blueprint or an uploaded document into a narrated, animated video, and I built it in about five weeks.",
        "I did not want a cloud bill hanging over the presenters, the narration and the captions either, so the heavy lifting runs on a GPU box I set up and look after, using open models. That box is now part of the product rather than a machine in a corner, and most of what I have learned about running this thing came from looking after it.",
      ],
    },
    {
      kind: "prose",
      heading: "What actually happened",
      paras: [
        "A video is made by a team of AI agents, each with one job. A showrunner plans it. A writer, an editor, a fact-checker, a visual designer, a reviewer and an audience tester each take their turn. A chat with a Director agent edits the project gate by gate, from plan to script to storyboard to assets to assembly to review.",
        "The part I did not expect to matter most turned out to be the gates. A delivery gate that decodes and measures every file before a video is marked complete caught more problems than any of the agents did. The other thing that surprised me was how much of the work is a person saying yes: the Director agent can edit and plan, but it can never approve a gate or start a run.",
      ],
    },
    {
      kind: "steps",
      heading: "From a sentence to a finished video",
      items: [
        { title: "Describe it", body: "One sentence is enough to start. An optional setup covers audience, language, format, look, voice, subtitles and branding." },
        { title: "Plan it", body: "The showrunner turns the brief into a plan, and the other agents shape the script and the storyboard." },
        { title: "Pick the scenes", body: "Each scene uses one of more than 19 scene types, from a talking presenter to motion graphics, charts and 3D." },
        { title: "Render on the GPU box", body: "A render queue hands out the work and holds jobs back until the box has memory to spare." },
        { title: "Check before it counts", body: "A delivery gate decodes and measures every file before a video is marked complete. Other gates look for dead air, text that is too small to read and scenes that drift from the script." },
        { title: "Learn from it", body: "Every edit is logged as feedback and distilled into rules that shape the next run." },
      ],
    },
    {
      kind: "media",
      heading: "The studio",
      items: [
        {
          kind: "image",
          src: "/work/video-studio/create-screen.png",
          alt: "The Create screen of the studio. A one-sentence brief is typed into a box, an optional setup lists audience, format, look and voice, and a summary on the right shows an estimate and a Start plan button.",
          w: 1440,
          h: 900,
          caption: "My Create screen. A one-sentence brief, an optional setup, a live summary of the video and a time estimate before anything starts.",
        },
        {
          kind: "image",
          src: "/work/video-studio/agent-brain.png",
          alt: "A wide banner reading how every agent on your team thinks and what it is learning from your videos, with counts for agents, principles and rules waiting, and a network of agent icons.",
          w: 2368,
          h: 344,
          caption: "My Agent Brain page: every agent, the principles it follows and the rules waiting for review. The studio shows 12 agents and 19 principles here.",
        },
      ],
    },
    {
      kind: "media",
      heading: "What it makes",
      items: [
        {
          kind: "video",
          src: "/work/video-studio/letsgo.mp4",
          poster: "/work/video-studio/letsgo.jpg",
          w: 1280,
          h: 720,
          loop: true,
          caption: "A ten second opener I made with the studio's own video model. ARI waves, says a generated 'Let's go!' and runs along a path where five skill nodes light up, ending with a trophy. Character clips are composited over a painted scene. Music: Glitter Blast by Kevin MacLeod, CC BY 4.0.",
        },
        {
          kind: "video",
          src: "/work/video-studio/chest.mp4",
          poster: "/work/video-studio/chest.jpg",
          w: 1280,
          h: 720,
          loop: true,
          caption: "A cinematic 3D shot titled Reward unlocked. The chest shakes, the lid opens and light, coins and sparkles burst out. The chest was modelled from a generated picture.",
        },
        {
          kind: "video",
          src: "/work/video-studio/trophy.mp4",
          poster: "/work/video-studio/trophy.jpg",
          w: 1280,
          h: 720,
          loop: true,
          caption: "The whole route in one shot: a picture becomes a 3D trophy, which is lit and turned under a spotlight with gold sparkles.",
        },
        {
          kind: "image",
          src: "/work/video-studio/styles-sheet.jpg",
          alt: "A sheet of frames showing one water cycle explainer drawn in eight different art styles, six frames each.",
          w: 2000,
          h: 1680,
          caption: "One brief about the water cycle, drawn in eight art directions, six frames each. I wanted the look to be a setting rather than a rewrite of the brief.",
        },
      ],
    },
    {
      kind: "code",
      heading: "Two render boxes, one job",
      lang: "sql",
      code: `-- Two workers may run this at once. The status check in the outer WHERE
-- means only one of them flips the row.
-- Zero rows back means someone else won, so look again.
UPDATE jobs
SET    status = 'running', owner = :worker, lease_until = now() + interval '5 minutes'
WHERE  id = (
         SELECT id FROM jobs
         WHERE  status = 'queued'
         ORDER BY priority DESC, created_at
         LIMIT  1
       )
  AND  status = 'queued'
RETURNING id;`,
      caption:
        "The server side of the render queue, as a single statement. The status check sits inside the UPDATE, so if two render boxes reach for the same job only one write succeeds and the other gets no row back. The render-box half of this contract was written up by a colleague, and I built the backend half: this queue, its endpoints and the admin panel.",
      source: "Simplified sketch of the approach, not production code",
    },
    {
      kind: "decisions",
      heading: "The calls I would defend",
      items: [
        {
          choice: "Run the models on our own GPU box",
          why: "Open models on our own hardware mean no cloud dependency for the presenters, narration and captions.",
          cost: "I own the box: a portable installer that checks model hashes, and a keepalive task that runs every 2 minutes to keep the services up.",
        },
        {
          choice: "A memory-gated render queue",
          why: "ComfyUI is released between stages and a job waits for RAM headroom, so one heavy stage cannot starve the next.",
          cost: "Jobs sometimes wait for memory instead of racing ahead, and ComfyUI runs without pinned memory or a node cache.",
        },
        {
          choice: "Claim jobs with compare-and-swap",
          why: "Two render boxes must never work the same job, and a check-then-write has a gap between the two steps.",
          cost: "It is more involved than a simple lock: a worker that loses the race gets no row back and simply looks again.",
        },
        {
          choice: "A person approves every gate",
          why: "The Director agent can edit and plan, but it can never approve a gate or start a run. A person does.",
          cost: "The video moves at the speed of the person approving it, in exchange for nothing being made without a yes.",
        },
      ],
    },
    {
      kind: "prose",
      heading: "What broke",
      paras: [
        "The first way I had the render queue claim a job was a check and then a write. There is a gap between those two steps, and it is exactly long enough for two render boxes to pick up the same job and render it twice. Moving the status check inside the UPDATE closed the gap. The worker that loses the race gets no row back and simply looks again, which is a much smaller failure than two boxes doing one job.",
        "The other thing that broke was memory. ComfyUI holds on to a lot, and one heavy stage can starve the next one, so ComfyUI has to be released between stages and a job has to wait for RAM headroom. The price is that jobs sometimes sit waiting for memory instead of racing ahead. I would rather a queue stall than a render box fall over.",
        "What broke most often was the output rather than the pipeline. The delivery gate kept catching dead air, text too small to read and scenes that drifted from the script. That is the honest reason the gate exists: I was not able to trust the render to be the finish line.",
      ],
    },
    {
      kind: "prose",
      heading: "What I learned",
      paras: [
        "A video is finished when a person approves it, not when the render finishes. I built the Director agent to be able to edit and plan, and it can never approve a gate or start a run. Designing for that approval step instead of around it is what keeps the whole thing honest, and it also means the platform moves at the speed of the person approving it.",
        "Owning the hardware is product work. A portable installer that checks model hashes and a keepalive task that keeps the services up are not extras, they are what makes the box usable at all. I did not expect the machine to be part of the product, and now I cannot imagine the studio without it.",
        "The gates came before the agents in my head, and they turned out to be the part I would keep if I had to start again.",
      ],
    },
    {
      kind: "prose",
      heading: "What I would do differently",
      paras: [
        "I would build the quality gates first and the agents second. I did it the other way round, and it meant the agents grew a lot of surface area before anything was checking their work.",
        "I would also write down the memory behaviour of the box before I needed it, rather than learning it by watching jobs stall. Every strange wait turned into an anecdote instead of a number I could put in a design note.",
      ],
    },
    {
      kind: "facts",
      heading: "By the numbers",
      items: [
        { value: "50%", label: "less time to generate a video" },
        { value: "4K", label: "output added" },
        { value: "433 \u2192 99 s", label: "to render a music score", note: "77% faster, by rendering in parallel windows" },
        { value: "311", label: "API paths", note: "364 operations in the live OpenAPI spec" },
        { value: "19+", label: "scene types in a browsable catalogue" },
        { value: "about 5 weeks", label: "from nothing to a working platform" },
      ],
    },
  ],
  related: ["lesson-pipeline", "zoom-backup"],
};

export default work;
