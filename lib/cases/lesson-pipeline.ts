import type { Work } from "../work";

const work: Work = {
  slug: "lesson-pipeline",
  title: "AI lesson pipeline",
  kicker: "See Change Education · 2026",
  summary:
    "I built a pipeline that turns recorded classes, videos and documents into complete interactive lessons, with video, bilingual subtitles and speaking tasks, and a teacher reviewing each one before it is published.",
  role: "I built the pipeline, the NotebookLM tool client and server, the bulk workflow and the review step",
  when: "2026",
  stack: ["Spring Boot", "MyBatis-Plus", "Redis", "React", "NotebookLM (MCP)", "Azure OpenAI", "Whisper", "FFmpeg"],
  status: "in production",
  outcome: { value: "About 80%", note: "less time per lesson (estimated), from days to hours, powering a 32-lesson course" },
  links: [],
  cover: {
    kind: "image",
    src: "/work/lesson-pipeline/debate-shot.jpg",
    alt: "A shot from a generated lesson video: a cartoon girl on a living-room sofa asks her dad for a later bedtime, with a puppy beside her.",
    w: 1280,
    h: 736,
  },
  blocks: [
    {
      kind: "prose",
      heading: "What I wanted to build",
      paras: [
        "The ask was to make videos from lessons. Nobody gave me a spec, so I built the whole route: a class recording goes in, and a reviewed lesson comes out with its video, subtitles, quizzes and speaking tasks. Lessons are produced in bulk through a produce, review and publish workflow.",
        "The bit I cared about most was the last step. A generated lesson can be wrong, so a person checks each scene and nothing goes live without approval.",
      ],
    },
    {
      kind: "prose",
      heading: "What actually happened",
      paras: [
        "The video step uses NotebookLM through its tool protocol (MCP). I deployed the server on a cloud machine, signed in over SSH because the machine has no screen, and kept the sessions alive with scheduled jobs. On the Java side I wrote the protocol client by hand.",
        "By hand, a lesson takes roughly two working days. With the pipeline it takes a few hours, most of it a teacher checking and fixing the result. That works out to about 80% less time per lesson, and it is an estimate, not a measurement.",
      ],
    },
    {
      kind: "steps",
      heading: "From recording to published lesson",
      items: [
        { title: "Find the source", body: "A source hunt tries the class transcript first, then the audio, then speech recognition on the video, and falls through to the next if one is missing." },
        { title: "Extract a blueprint", body: "One pass keeps the teaching, drops small talk and anonymises students before anything reaches generation. Topics are checked against a registry for similar lessons." },
        { title: "Generate the video", body: "NotebookLM makes the video through the MCP client." },
        { title: "Add subtitles", body: "Speech recognition and a language model produce English and Chinese subtitles, which a teacher can edit by hand." },
        { title: "Add exercises", body: "Speaking tasks get harder turn by turn, and matching and drag tasks come with editors." },
        { title: "Teacher review, then publish", body: "A teacher reviews and fixes the generated lesson, which takes one to two hours, and then it is published." },
      ],
    },
    {
      kind: "media",
      heading: "Inside the studio",
      items: [
        {
          kind: "video",
          src: "/work/lesson-pipeline/debate-shot.mp4",
          poster: "/work/lesson-pipeline/debate-shot.jpg",
          w: 1280,
          h: 736,
          loop: true,
          caption: "A shot from the Introduction to Debate lesson, made with the studio's local video model: a girl asks her dad for a later bedtime.",
        },
        {
          kind: "video",
          src: "/work/lesson-pipeline/bilingual-subs.mp4",
          poster: "/work/lesson-pipeline/bilingual-subs.jpg",
          w: 1280,
          h: 720,
          loop: true,
          caption: "English and Traditional Chinese subtitles burned in one above the other, on a sample scene of a bean plant in a dark cupboard.",
        },
        {
          kind: "image",
          src: "/work/lesson-pipeline/review-page.png",
          alt: "A review page listing a lesson scene by scene. Each card shows a still, the narration, Approve and Redo buttons and a comment box, with counters for approved, redo and pending scenes at the top.",
          w: 1000,
          h: 1500,
          caption: "The studio's scene-by-scene review page, where a person approves or redoes each scene. The counters at the top read 1 approved, 2 redo and 41 pending.",
        },
      ],
    },
    {
      kind: "code",
      heading: "A tool client written from scratch",
      lang: "java",
      code: `class RpcClient {
    private final AtomicLong seq = new AtomicLong();
    private final Map<Long, CompletableFuture<JsonNode>> waiting = new ConcurrentHashMap<>();
    private final Transport transport;

    CompletableFuture<JsonNode> call(String method, JsonNode params) {
        long id = seq.incrementAndGet();
        var future = new CompletableFuture<JsonNode>().orTimeout(30, TimeUnit.SECONDS);
        waiting.put(id, future);
        future.whenComplete((result, error) -> waiting.remove(id));
        transport.send(new Request(id, method, params));
        return future;
    }

    void route(JsonNode message) {
        var future = waiting.get(message.path("id").asLong(-1));
        if (future == null) return;
        if (message.has("error")) future.completeExceptionally(new RpcException(message.get("error")));
        else future.complete(message.get("result"));
    }
}`,
      caption:
        "The core of a hand-written MCP client. Each call gets an id and a future with a timeout, and a separate handler matches each reply back by id. SSE and stdio transports sit underneath it.",
      source: "Simplified sketch of the approach, not production code",
    },
    {
      kind: "decisions",
      heading: "The calls I would defend",
      items: [
        {
          choice: "Write the MCP client by hand",
          why: "I could ask the server which tools it has instead of guessing names from documentation that might describe another build.",
          cost: "I own the protocol code, and a session is not thread-safe, so each generation opens a fresh one and closes it.",
        },
        {
          choice: "A teacher reviews before publishing",
          why: "A generated lesson can be wrong, so a person checks each scene and nothing goes live without approval.",
          cost: "Review is where the remaining time goes, about 1 to 2 hours of each lesson's 2 to 3.",
        },
        {
          choice: "Fix prompt failures with versioned migrations",
          why: "When a video narrated about its own outline instead of teaching, the fix went in as a versioned migration that can be re-run safely. I ported the base prompt from a colleague's original and wrote the fixes.",
          cost: "Every prompt change is a migration to write and review, not a quick edit.",
        },
      ],
    },
    {
      kind: "prose",
      heading: "What broke",
      paras: [
        "A video narrated about its own outline instead of teaching. Nothing about the pipeline was wrong, the prompt was, so the fix went in as a versioned migration that can be re-run safely. I ported the base prompt from a colleague's original and wrote the fixes.",
        "The other break was quieter. A protocol session is not thread-safe, so each generation opens a fresh one and closes it. That is the cost of writing the client by hand, and I pay it on every single lesson.",
      ],
    },
    {
      kind: "prose",
      heading: "What I learned",
      paras: [
        "To ask the server what it can do instead of guessing names from documentation that might describe another build. Writing the client by hand is what made that possible, and it is the reason the pipeline has not broken because a tool was renamed under it.",
        "That the teacher is not a rubber stamp. Review is where the remaining time goes, about 1 to 2 hours of each lesson's 2 to 3, and the scene-by-scene page exists because that is the shape the work actually takes.",
      ],
    },
    {
      kind: "prose",
      heading: "What I would do differently",
      paras: [
        "I would version the prompts from the first day. Every prompt change is a migration to write and review, not a quick edit, and starting that way would have saved me the awkwardness of retrofitting it after something went wrong.",
        "I would also measure the time per lesson properly instead of estimating it. The saving I quote is honest, but it is an estimate, and I would rather put a number in front of a teacher that I can defend.",
      ],
    },
    {
      kind: "facts",
      heading: "By the numbers",
      items: [
        { value: "about 80%", label: "less time per lesson (estimated)", note: "an estimate, not a measurement" },
        { value: "13 to 18 hours", label: "per lesson by hand", note: "plan, video, subtitles, quizzes and speaking exercises" },
        { value: "2 to 3 hours", label: "per lesson with the pipeline", note: "automatic generation, then 1 to 2 hours of teacher review" },
        { value: "32", label: "lessons in the course it powers" },
      ],
    },
  ],
  related: ["video-studio", "zoom-backup"],
};

export default work;
