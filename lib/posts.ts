// Personal writing (/writing/<slug>) contract. Copy is final; every claim is recorded in
// docs/writing-ledger.md, and tests/unit/posts.test.ts enforces the editorial invariants.
import type { Block } from "./work";

export type Post = {
  slug: string;            // kebab-case, unique
  title: string;
  date: string;            // ISO YYYY-MM-DD
  summary: string;         // one or two sentences for the index
  blocks: Block[];
  relatedWork: string;     // /work/<slug>
  liveUrl?: string;        // only where a public build exists
  /** Unfinished: hidden from every route, index, sitemap and link until removed. */
  draft?: boolean;
};

/** Every post, drafts included, in the order they were written. */
export const posts: Post[] = [
  {
    slug: "the-room-had-no-bright-pixels",
    title: "The room had no bright pixels",
    date: "2026-10-24",
    summary:
      "The hero room measured 0.00% of pixels above 200. I changed what the light had to work with instead of the grade, then measured the same frame again.",
    blocks: [
      {
        kind: "prose",
        paras: [
          "The hero room in Save Your Princess was dark in a way that grading could not fix. I measured one frame at 1280 by 800, with the debug HUD and the caption band excluded, and 0.00% of its pixels were above 200. The 99th percentile was 76.",
          "That was arithmetic rather than taste. Every surface is shaded as the product of the lighting ramp and its albedo: col = ramp(N·L) * albedo. The ramp's ceiling is the mood's key colour, and the chamber's stone was #101318, about 4% reflectance. Multiplying a key colour by a 4% albedo cannot leave a bright pixel, so the value structure was being flattened before the grade ever ran, which is why every room read as flat cardboard no matter how I tuned it.",
          "So I changed the inputs instead of the grade. Stone became a neutral mid grey, #7A7E85, and colour comes from light only. Shock and acceptance were lit up rather than graded up, with the new keys living in core/mood.ts as data, so every scene on those moods inherits them: the shock key went from #7189A3 to #A9BCCF, 52% to 74% luminance. Falloff moved into the vertex colours, because eight box corners give a shader one N·L per face and that is exactly why every wall looked like cardboard. Fog became a depth cue instead of a filter. Each side wall got one candle sconce that warms as each pane is set, and behind the leaded glass there is now a night sky, a moon and a city roofline.",
          "I re-ran the measurement on the same frame. 2.73% of pixels are now above 200 and the 99th percentile is 237. The LUT golden values for those two moods were regenerated and the other four moods' reference values are untouched, which is the test telling me the change went where I aimed it and nowhere else. The lighting change landed with MEND on 24 October.",
          "The part I have not closed is the phone. That number is a desktop frame at 1280 by 800. I have phone captures of the same room, but I have not run the luminance analysis on one, so I cannot claim the phone reads the same way. What I can say is narrower and checkable: the room now has bright pixels in it. The slice is public if you want to look at it.",
        ],
      },
    ],
    relatedWork: "save-your-princess",
    liveUrl: "https://syp-playtest.vercel.app/?slice=1",
  },
  {
    slug: "the-queue-that-waits-for-ram",
    title: "The queue that waits for RAM",
    date: "2026-10-24",
    summary:
      "One GPU, two avatar models that cannot both be resident, and a render queue that hands out work only when the box has memory to spare.",
    blocks: [
      {
        kind: "prose",
        paras: [
          "The studio renders on one machine. It is a Windows box running WSL 2 with a single GPU, and ComfyUI on that GPU runs the avatar video model. Chatterbox handles the narration and Whisper makes the captions. The memory is a fixed and not very generous number: nvidia-smi reports 24,463 MiB in total with 12,147 MiB already in use at idle, and each avatar model is a 10.68 GB file that has to be resident to run. The two avatar modes cannot both be in memory at once. A video that alternates between them pays a cold model load on every shot that switches, which is the same constraint showing up as time.",
          "The obvious queue hands out the next job the moment the last one finishes, and on this box that is the wrong rule. A stage that ends leaves ComfyUI holding memory it no longer needs, the next stage starts before that memory is back, and one heavy job starves the job behind it. The queue I run is memory gated instead. ComfyUI is released between stages, and a job is only handed out when the box reports RAM headroom.",
          "Two workers must never take the same job, and a check followed by a write leaves a gap between the two steps that a second worker can slip through. In the queue I run, the status check sits inside the UPDATE, so one worker flips the row, and the worker that loses gets no row back and looks again. That is a much smaller failure than two workers doing one job. I built the backend half of that contract, the queue, its endpoints and the admin panel.",
          "The cost is in the queue rather than in the render. ComfyUI runs without pinned memory and without a node cache, so there is less to reclaim and less to go wrong, and jobs sometimes sit waiting for memory instead of racing ahead. I have no queue timing in my records, so I am not going to dress that wait up as a number. On a single GPU with one engineer looking after it, I would rather have a job that waits than a render that dies for memory.",
        ],
      },
    ],
    relatedWork: "video-studio",
  },
  {
    slug: "when-the-photo-booth-had-to-just-work",
    title: "When the photo booth had to just work",
    date: "2026-10-24",
    summary:
      "A browser cannot print without a dialog, so the booth's last step became a small service on the booth laptop, shipped as one hidden program.",
    blocks: [
      {
        kind: "prose",
        paras: [
          "The booth was live at SCMUN 2026, which ran from 3 to 9 August, and at the AAI dinner. The recorded attendance is 200-300 guests per event, and that is a range rather than a count. A guest walks up, talks to ARI, picks a look, waits while the photo is restyled, and leaves with a card.",
          "The last step is a print, and that is where the browser stops being able to help. A browser cannot print without opening its dialog. That dialog is a person deciding whether to send a page to a printer, and in front of a guest it is the wrong question to be asking. There is no browser API that skips it, so the print had to stop being the browser's job.",
          "I wrote a small Node service that runs on the booth laptop. The booth page posts each finished card to http://127.0.0.1:7777, the agent turns the image into a PDF at the paper size it was given, and prints it through the operating system: SumatraPDF on Windows, CUPS lp on Mac and Linux. It binds to loopback by default. The flow it is built for is a card that comes out of the printer with no dialog in front of the guest.",
          "Shipping it turned out to be the part that mattered. The booth laptop should not need a development setup, so the agent arrives as one file of about 87 MB with the Node runtime and SumatraPDF inside it. Running that file with --install registers it to start at every Windows login under the per-user Run key, so it needs no administrator rights, and the build flips the executable to a GUI subsystem so it opens with no console window. With no window, the log file is how you check on it.",
          "There is also a Save-as-PDF mode: a sentinel value in place of a printer name, which writes the print to a file and opens it. That let me test the whole flow, layout included, on a machine with no printer attached. The agent keeps a copy of every image it prints, lists them in a history, and can reprint one, front and back as a single job, so a card still exists on the laptop after the guest has walked away.",
          "The booth is the product: ARI greeting someone, the restyle, the fun facts that cover the wait. The print agent is the part that has to happen before any of it reaches a guest's hand, and at 200-300 guests per event it is the step that repeats for every one of them.",
        ],
      },
    ],
    relatedWork: "photobooth",
  },
];

/** Published posts (drafts excluded), newest first. */
export function publishedPosts(): Post[] {
  return posts
    .filter((p) => !p.draft)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

/** A published post, or undefined for unknown and draft slugs. */
export function getPost(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug && !p.draft);
}

/** "24 October 2026" for headers. UTC so the build output never depends on the server timezone. */
export function formatPostDate(date: string): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00Z`),
  );
}
