# Writing ledger

Claim-by-claim source record for the three essays in `lib/posts.ts`. Written before the copy, then
checked against it. A claim that is not in this file does not belong in an essay.

Rules applied:

- Every first-person statement is one of: an observed event tied to a dated artifact, a decision with
  the alternative and its engineering consequence, a measured result with a source, or a direct
  record written by Akib.
- Case study modules (`lib/cases/*.ts`) are draft indices. They are cited only where they restate a
  primary record, and never as evidence of motivation or feeling.
- No invented feeling, dialogue, scene, motivation, or metric. Where a number could not be found, the
  copy says so instead of estimating.
- Visible copy uses no em dash, no en dash, no emoji. Numeric ranges use a plain hyphen.

Source prefixes used below:

- `SYP/` = `/Users/seechange/work-dir/akib/SYP/`
- `WORK_RECORD` = `/Users/seechange/work-dir/akib/cv/WORK_RECORD.md`
- `HANDOVER` = `/Users/seechange/work-dir/t&S/video-studio-agent-R-handover/`
- `PRINT_AGENT` = `/Users/seechange/work-dir/t&S/print-agent/`
- repo paths are relative to this worktree unless absolute

---

## 1. the-room-had-no-bright-pixels

Related work: `save-your-princess`. Public link: `https://syp-playtest.vercel.app/?slice=1`.

| # | Claim in the essay | Primary source | Qualification |
|---|---|---|---|
| 1.1 | The first build had no bright pixels; the rooms read as flat cardboard. | `SYP/game/docs/GAP-ANALYSIS.md` §3.1 (line 198, table row line 207, line 219); `SYP/DECISIONS.md` LIGHT-005 (lines 2026 to 2032) | "Flat cardboard" is my description of a measurement, not a quoted opinion. The measurement is the evidence. |
| 1.2 | Cause is arithmetic: `col = ramp(N·L) * albedo`, and the ramp's ceiling is the mood key colour. | `SYP/DECISIONS.md` LIGHT-005 body, same lines; `SYP/game/src/states/chamber.ts` lines 53 to 57 | Stated as the recorded cause. I did not re-derive it for the essay. |
| 1.3 | Chamber stone albedo was `#101318`, about 4% reflectance, so the key colour is multiplied down before the grade runs. | `SYP/DECISIONS.md` LIGHT-005; `chamber.ts` lines 53 to 57 | Qualitative only. The essay does **not** compute a pixel value from 4% and 52%: the product is not self-evident from the record and the source does not print it, so no derived figure is quoted. "About 4%" is the record's own rounding. |
| 1.4 | Measurement was taken on the 1280 by 800 chamber frame with the HUD and the caption band excluded. | `SYP/DECISIONS.md` LIGHT-005; method described in `GAP-ANALYSIS.md` §3.1 | One frame, one resolution. Not a sample of scenes. |
| 1.5 | Before: 0.00% of pixels above 200, p99 76. | `SYP/DECISIONS.md` LIGHT-005; baseline p99 76 also in `GAP-ANALYSIS.md` table row `chamber` (line 207) | These four values (0.00%, 2.73%, 76, 237) appear only in this essay. |
| 1.6 | After: 2.73% of pixels above 200, p99 237. | `SYP/DECISIONS.md` LIGHT-005 | Same frame and same method as 1.5, so the pair is comparable. No claim about other scenes. |
| 1.7 | Decision: stone becomes a neutral mid grey (`#7A7E85`) and colour is carried by light only. | `SYP/DECISIONS.md` LIGHT-005 first bullet; `chamber.ts` line 57 and the comment above it | The "colour only from light" rule is the project's existing art rule (`ART-001`), cited inside LIGHT-005. |
| 1.8 | Shock mood was re-lit rather than only graded: key `#7189A3` to `#A9BCCF`, 52% to 74% luma, shadows lifted. | `SYP/DECISIONS.md` LIGHT-005 second bullet; `SYP/game/src/core/mood.ts` lines 26 and 27 (key, shadow), line 67 (acceptance shadow) | Data lives in `core/mood.ts`, so every scene on those moods inherits it. The essay says that, and no more. |
| 1.9 | Falloff was baked into vertex colours (window distance, floor ambient occlusion, ceiling die-off). | `SYP/DECISIONS.md` LIGHT-005 third bullet | Recorded as the decision that fixed flat per-face `N·L`. |
| 1.10 | Fog was treated as a depth cue (intensity 0.62 to 0.30), and a sky factor keeps the window visible through it. | `SYP/DECISIONS.md` LIGHT-005 fourth bullet | The essay keeps the direction of the change and drops the exact cap value. |
| 1.11 | Each side wall got one practical candle that warms as each pane is set; the requirement is structural, because a 14 by 18 metre room lit by one distant window has void corners. | `SYP/DECISIONS.md` LIGHT-005 fifth bullet; `chamber.ts` sconce constants (`SCONCE_COLD`, `SCONCE_WARM`) | "14 by 18 metre" is the record's own room size. |
| 1.12 | The window has a world behind it: night sky, moon with a halo, city roofline. | `SYP/DECISIONS.md` LIGHT-005 sixth bullet; `chamber.ts` `SKY_TOP`, `SKY_LOW`, `MOON_COLOR` | No claim about how the sky was drawn beyond "behind the glass". |
| 1.13 | The lighting change shipped with MEND on 24 October. | `SYP/game` git `86b194a` ("MECH-004: MEND becomes a finished game, and the room finds its light"), 2026-10-24 05:39 +0800, touching `src/core/mood.ts` and `src/states/chamber.ts` | The essay prints neither the hash nor the file list: the commit is the evidence behind the dated sentence, not copy. It is the rendering commit, not the portfolio's `33451bf`, which only refreshed this site. |
| 1.14 | Consequence recorded in tests: the LUT golden values were regenerated for the two changed moods and the other four are untouched. | `SYP/DECISIONS.md` LIGHT-005 last bullet; `SYP/game/test/moodLut.test.ts` lines 42 to 45 and 59 to 62 | Stated as a recorded consequence, not as a test count. |
| 1.15 | What is unproven: the number is a desktop frame. There are phone captures, but the same measurement was not run on one. | `SYP/DECISIONS.md` LIGHT-005 (frame is 1280 by 800); phone captures committed in `SYP/game` `02eafd3` | Explicit limitation. The essay does not claim the phone reads the same. |
| 1.16 | The public slice is live at the URL above. | `lib/cases/save-your-princess.ts` line 14 (`links[0]`); checked 2026-10-24: `curl -L` returned HTTP 200 | Same URL the case study links. HTTPS check is also pinned by a unit test. |

Claims deliberately not made: that the game is finished; that the window is the brightest object in
the frame (the record gives it only as a fog consequence, and it was not measured); any pixel value
derived from the 4% albedo and the 52% key luminance, such as 10 of 255 (the record does not print
that arithmetic); that the room feels or reads a particular way emotionally; that the slice performs
at a stated frame rate on a phone; any player or review reaction.

---

## 2. the-queue-that-waits-for-ram

Related work: `video-studio`. No public live link (nothing is exposed publicly for this work).

| # | Claim in the essay | Primary source | Qualification |
|---|---|---|---|
| 2.1 | Renders run on a Windows and WSL 2 box with one GPU. ComfyUI on that GPU runs the avatar video model (MiniMax H3), Chatterbox TTS handles the narration and Whisper makes the captions. | `WORK_RECORD` §3.1 "Self-hosted AI infrastructure" bullet ("**MiniMax H3** (local talking-avatar video model ...) on ComfyUI, **Chatterbox TTS** narration ..., **Whisper large-v3-turbo** ASR with CTC alignment"); `HANDOVER/video-studio-implementation-plan.md` line 54 (tech stack lists ComfyUI, MiniMax H3 Q4_0, Chatterbox, Whisper) | Each stage is named with the tool that performs it, so ComfyUI is never credited with narration or captions. Describes the machine, not a benchmark. |
| 2.2 | Measured on that box: 24,463 MiB of GPU memory total, 12,147 MiB already in use at idle, each avatar model 10.68 GB, so the two avatar engines cannot both be resident. | `HANDOVER/video-studio-implementation-plan.md`, hardware fact 6 (its source column is `nvidia-smi` and the model folder `Q4 models\`) | Measured with `nvidia-smi` on the box as recorded in the 2026-08-24 handover. It is a fact about the hardware, not about the queue. |
| 2.3 | Decision: the queue is memory-gated. A job waits for RAM headroom, and ComfyUI is released between stages so one heavy stage cannot starve the next. | `WORK_RECORD` §3.1 line 49 and line 54; `WORK_RECORD` §2 item 5 ("memory guards"); `lib/cases/video-studio.ts` decisions block ("A memory-gated render queue") | The case module restates the record; it is a draft index, not independent proof. |
| 2.4 | Cost of that decision: ComfyUI runs without pinned memory or a node cache, and jobs sit waiting for memory instead of racing ahead. | `WORK_RECORD` §3.1; `lib/cases/video-studio.ts` decisions block, `cost` field | Presented as a trade-off I chose. There is no measured latency for the wait, and the essay gives none. |
| 2.5 | The queue claims work in one statement: the status check sits inside the `UPDATE`, so two workers cannot both flip the same row, and the worker that loses gets no row back and looks again. | `lib/cases/video-studio.ts` code block "Two render boxes, one job" (SQL) and the `compare-and-swap` decision item; `WORK_RECORD` §2 item 5 ("crash-safe queues") | The case labels that SQL "a simplified sketch of the approach, not production code". The essay describes the shape, not a quoted production statement. It attributes no first implementation to me: no check-then-write version is recorded in any primary source, and the only prose describing one is the case module, which is a draft index. |
| 2.6 | Scope: I built the backend half of that contract (queue, endpoints, admin panel); the render-box half was written up by a colleague. | `lib/cases/video-studio.ts` code block caption, which states exactly this split | Attribution is mine to make only because the case states it. |
| 2.7 | There is no queue-specific measurement, so the essay offers no speedup figure. | Checked: `WORK_RECORD` has no queue metric; the case module has none; description of the wait is qualitative in both | Explicit omission, stated in the copy. |
| 2.8 | The 433 s to 99 s figure belongs to music score rendering in parallel windows, not to the queue, and is not used. | `WORK_RECORD` §3.1 "Audio engineering" bullet and §7; `lib/cases/video-studio.ts` facts block labels it "to render a music score" | Excluded on purpose. A test rejects `433` and `99 s` in this essay. |
| 2.9 | A job that waits is recoverable, while a box that runs out of memory part way through a render is not. | Engineering judgment from `WORK_RECORD` §3.1 ("guards RAM and VRAM") and §2 item 5 ("memory guards") | This is a statement about the two failure modes, not an event that happened. No crash, incident, or figure is claimed. |
| 2.10 | One engineer looks after the box. | `WORK_RECORD` §1 table row "SeeChange Studio" (sole engineer, 592 of 609 commits) and §1b "Solo: SeeChange Studio" | Sole engineer is the recorded ownership, not a claim about headcount today. |
| 2.11 | Alternating between the two avatar modes pays a cold model load on every shot that switches. | `HANDOVER/video-studio-implementation-plan.md` hardware fact 6 ("A cinematic that alternates engines per shot pays a cold model load every shot") and line 84 ("The 82-91x outliers are cold model loads") | Qualitative. The telemetry outliers behind the fact are not quoted and the essay draws no time or speed figure from it; it restates the residency constraint as cost and nothing more. |

Claims deliberately not made: that the queue made rendering faster; that the queue never lost a job;
that the memory gate removed crashes; any queue length, wait time, throughput, or failure rate; any
first version of the queue or change of approach over time (no primary record of one exists); any
feeling about watching jobs stall.

---

## 3. when-the-photo-booth-had-to-just-work

Related work: `photobooth`. No public live link.

| # | Claim in the essay | Primary source | Qualification |
|---|---|---|---|
| 3.1 | The booth ran live at SCMUN 2026 and at the AAI dinner. | `WORK_RECORD` §1 table (row "AI Photobooth"); §3.2 "Live deployments" bullet | SCMUN 2026 is recorded as Joseph Lee Hall, 3 to 9 August. The essay says August and does not print the room name. |
| 3.2 | The recorded attendance range is 200-300 guests per event. | `WORK_RECORD` §7 ("200-300 guests per event (SCMUN 2026 and the AAI corporate dinner)") | A range, not a precise count. The essay uses the range and never "300 guests". The `200-300` token is pinned by a test. |
| 3.3 | A browser cannot print silently, so the print dialog would appear in front of a guest and break the flow. | `PRINT_AGENT/README.md` opening paragraph ("no browser print dialog", "neither a server nor a browser can print silently"); `PRINT_AGENT/agent.js` header comment lines 1 to 6 | The browser limitation is a platform fact; the flow consequence is the reason recorded for building the agent. |
| 3.4 | Decision: a small Node service on the booth laptop, reached at `http://127.0.0.1:7777`, bound to loopback by default. | `PRINT_AGENT/agent.js` lines 30 to 33 (`PORT`, `HOST`, `PRINT_AGENT_HOST`), route table lines 388 to 445; `PRINT_AGENT/README.md` | Loopback default is from the code; LAN binding only by explicit env var for testing. |
| 3.5 | It renders the image to a PDF at a chosen paper size and prints it through the OS: SumatraPDF on Windows, CUPS `lp` on Mac and Linux. | `PRINT_AGENT/agent.js` header lines 8 to 12 and `imageToPdf` / `printPdf` / `printOnce` (lines 209 to 320); `PRINT_AGENT/README.md` | No claim about print quality or speed. |
| 3.6 | A Save-as-PDF mode (`__pdf__` sentinel) lets the whole flow be tested with no printer attached. | `PRINT_AGENT/agent.js` line 33 (`PDF_SENTINEL`) and the `/print` branch lines 415 to 419; `PRINT_AGENT/README.md` | Presented as a test mode I used, not as an event feature. |
| 3.7 | It ships as one roughly 87 MB background executable with the Node runtime and SumatraPDF inside, built with `@yao-pkg/pkg` and the PE subsystem flipped to GUI so no console window appears. | `PRINT_AGENT/README.md` "Build a single background .exe" (line 46 onward, including the build note); `PRINT_AGENT/scripts/build-exe.mjs`; `PRINT_AGENT/package.json` | "Roughly 87 MB" is the README's figure. |
| 3.8 | `--install` registers it to start at every Windows login under the per-user `HKCU\...\Run` key, with no administrator rights. | `PRINT_AGENT/README.md` table row for `--install` and the autostart paragraph (line 64); `PRINT_AGENT/agent.js` lines 116 to 165 (`setAutostart`, `--install`) | No claim that this was deployed by me personally at each event. |
| 3.9 | With no window, the log file is how you check on it. | `PRINT_AGENT/README.md` ("the log file is how you check on it", path `%LOCALAPPDATA%\PhotoboothPrintAgent\agent.log`); `PRINT_AGENT/agent.js` lines 44 to 55 (`DATA_DIR`) | Path is the packaged default. |
| 3.10 | The agent keeps a copy of every image it prints and can reprint one from that archive, including a front and back as a single job. | `PRINT_AGENT/agent.js` `archiveImage` (line 337), `POST /archive` (428), `GET /history` (487), `POST /reprint` (530) | Describes what the code does. The essay does not claim a specific reprint happened at an event. |
| 3.11 | Scope: the print agent is a separate project from the booth application. | `PRINT_AGENT/README.md` ("This is a separate project from the Think-and-Speak codebase") | Attribution stays as the README states it. |
| 3.12 | The guest flow: walk up, talk to ARI, pick a look, wait while the photo is restyled, leave with a card. | `WORK_RECORD` §3.2 "Flow" line (attract, capture, style, generating, result, confirm, QR, interview, print, bye); `lib/cases/photobooth.ts` steps block | Summarised to the steps the essay needs. The mic interview and the QR step are left out, not denied. |
| 3.13 | The booth laptop should not need a development setup, which is why the agent ships as one file that installs itself. | `PRINT_AGENT/README.md` (one ~87 MB file, `--install` autostart, no admin rights, hidden background process, log file) and `PRINT_AGENT/scripts/build-exe.mjs` | Phrased as the requirement the packaging answers, not as a claim about the machine. The essay does not say what is installed on the booth laptop. |
| 3.14 | The flow the agent is built for is a card out of the printer with no dialog in front of the guest. | `PRINT_AGENT/README.md` lines 3 to 7 ("prints the AI Photobooth's photos **silently** — no browser print dialog"); `PRINT_AGENT/agent.js` header lines 1 to 12 ("The browser can't print without showing its dialog ... prints it straight through the OS — no dialog") | Stated as the intended flow the service exists for, not as an observed print at an event. No guest, guest reaction, or run is described. |

Claims deliberately not made: any statement that printing never failed; queues at the event, wait
times, or guest reactions; any private photo, guest name, credential, internal screenshot, or the
commercial pricing of the later product; any claim about the booth's other features beyond what the
essay needs.

---

## Values and their allowed locations

| Value | Meaning | Allowed in |
|---|---|---|
| `0.00%`, `2.73%`, `76`, `237` | SYP luminance measurement, before and after (p99 values are 76 and 237) | the-room-had-no-bright-pixels only |
| `200-300` | Photobooth attendance range per event | when-the-photo-booth-had-to-just-work only |
| `433`, `99 s` | Music score rendering time, unrelated to the render queue | nowhere in these three essays |
| `255`, `10 of 255` | Bit depth, and a pixel value derived by multiplying 4% albedo by the 52% key luminance. The source does not print the derivation, and it does not reproduce the stated number: 0.04 times 0.52 times 255 is about 5 | nowhere in these three essays |

## Public link check

- `https://syp-playtest.vercel.app/?slice=1` was requested on 2026-10-24 and returned HTTP 200 through
  redirects. It is the same URL `lib/cases/save-your-princess.ts` publishes, so the essay links to a
  build the site already points at.
- No live link is set for the queue essay or the photo booth essay, and a unit test keeps it that way.

## Editorial invariants enforced by `tests/unit/posts.test.ts`

- Visible copy (title, summary, block headings, prose, step and decision and fact text) contains no em
  dash, no en dash, no emoji.
- Every post date is ISO `YYYY-MM-DD` and a real calendar day.
- Body copy is 350 to 550 words per essay, and no scaffolding sentence survives.
- No block heading reuses the generic case-study headings ("What I learned", "What I would do
  differently", "What broke").
- The SYP values above appear in the SYP essay and in neither of the other two.
- The queue essay contains no `433` and no `99 s`, and offers no speedup percentage.
- The photo booth essay contains `200-300` and never an exact count such as "300 guests".

The evidence guards, added after review, are checked sentence by sentence where a shared sentence would
imply an attribution:

- No sentence gives ComfyUI the narration or the captions; `Chatterbox` and `Whisper` are named.
- The queue essay contains no `first version`, `my first`, or `I originally`.
- The queue essay contains no `speed figure`, `elsewhere on this site`, or `borrow a number`.
- The SYP essay contains no `brightest`, no `255`, and no seven-character hex token in prose.
- The booth essay contains no `queue` and no `not a developer machine`.
- The booth essay asserts no observed guest reaction (`guest sees`, `saw`, `reacts`, `notices`).
- The booth essay contains `binds to loopback by default` and never `loopback only`.

## Known limitations of this ledger

1. The SeeChange Studio source is not on this machine, so claims 2.3 to 2.6 rest on `WORK_RECORD` and
   on the case module's own statement that its SQL is a simplified sketch. They are not checked
   against the production repository here.
2. The 2.73% and 237 figures exist only in the LIGHT-005 decision entry. The baseline 0.00% and p99 76
   are independently recorded in `GAP-ANALYSIS.md` §3.1, so the pair's starting point is corroborated,
   but the "after" figure is a single record.
3. The essay's attendance range is a record written by Akib on 2026-10-15, not an event log.
4. No claim in any essay was checked with Akib in this task. Final wording approval is his, before
   production.
5. The 10 of 255 arithmetic was cut in review. The record prints the 4% albedo and the 52% key
   luminance but not their product, and 0.04 times 0.52 times 255 is about 5 rather than 10, so the
   copy makes the qualitative point instead: a key colour multiplied by a 4% albedo cannot leave a
   bright pixel.
6. The queue's first implementation is unsupported and excluded. No primary source records a
   check-then-write version; the only prose describing one is the case module, which is a draft index,
   so the copy describes only the race and the current `UPDATE` shape.
