import type { Work } from "../work";

const work: Work = {
  slug: "loopcraft",
  title: "LoopCraft",
  kicker: "Personal project · 2026",
  summary:
    "A multi-track looper in the browser. One tap plays a synthesized demo with no microphone, a theory-aware chord lane and a key-aware sample shelf keep everything in key, and you can record, mix with real effects and export a WAV on a sample-accurate Web Audio engine.",
  role: "I rebuilt the audio engine, the interface and the test suite",
  when: "Prototype June 2025, rebuilt October 2026",
  stack: ["Next.js 16", "React 19", "TypeScript", "Web Audio API", "AudioWorklet", "OfflineAudioContext", "CSS Modules"],
  status: "shipped",
  outcome: { value: "0 samples of drift", note: "over three runs of 24 to 26 loops, each loop exactly 118,762 frames" },
  links: [
    { label: "Play it live", href: "https://loop-craft-six.vercel.app" },
    { label: "Source on GitHub", href: "https://github.com/akib-arifeen/loop-craft" },
    { label: "Merged pull request", href: "https://github.com/akib-arifeen/loop-craft/pull/1" },
    { label: "Key-aware samples pull request", href: "https://github.com/akib-arifeen/loop-craft/pull/4" },
  ],
  cover: {
    kind: "image",
    src: "/work/loopcraft/01-desktop-drums.png",
    alt: "LoopCraft playing its demo: five track lanes with waveforms and ring playheads on the left, and a 16-step drum grid with filter, drive, delay, reverb and pan knobs on the right.",
    w: 1600,
    h: 1000,
  },
  playSlug: "loopcraft",
  blocks: [
    {
      kind: "prose",
      heading: "From a silent prototype to a real engine",
      paras: [
        "The first LoopCraft was a v0 scaffold with a good-looking interface and no audio engine. When I audited it, the only Web Audio calls on the live site were creating a context and resuming it.",
        "Pressing record produced nothing you could hear, and my audit of its ten core features found 0 working, 5 partial, 4 missing and 1 broken. I kept the interface idea and rebuilt everything underneath it.",
        "The new version makes sound 0.8 to 1.3 s after you press Play the demo, with no microphone needed, measured on a production build in headless Chromium across repeat runs. One cold browser start on a heavily loaded machine took 3.4 s. The start screen is also the click the browser needs before it allows audio.",
      ],
    },
    {
      kind: "media",
      heading: "What it looks like",
      items: [
        { kind: "image", src: "/work/loopcraft/02-desktop-recording.png", alt: "LoopCraft recording a loop, with a capture overlay sweeping across the track lane and the pads below.", w: 1600, h: 1000, caption: "Recording a loop from the pads. The overlay sweeps the lane while the engine captures exactly one loop." },
        { kind: "image", src: "/work/loopcraft/04-start-gate.png", alt: "The LoopCraft start screen with a Play the demo button.", w: 1600, h: 1000, caption: "The start screen. It is the user gesture that lets audio begin." },
        { kind: "image", src: "/work/loopcraft/05-phone.png", alt: "LoopCraft on a phone, with the track list and transport controls stacked for a narrow screen.", w: 390, h: 844, caption: "The phone layout. Phones work down to 320px wide." },
        { kind: "image", src: "/work/loopcraft/06-key-aware-samples.png", alt: "The LoopCraft sample shelf open over the tracks, with filters for type, key and mode and an In key marker on each keyed loop.", w: 1280, h: 800, caption: "The sample shelf. The filters and the in-key marker are calculated from the live project key, not from a static tag." },
        { kind: "image", src: "/work/loopcraft/07-key-aware-samples-phone.png", alt: "The same sample shelf on a phone, with the three groups and per-row badges.", w: 390, h: 844, caption: "The shelf on a phone: In key, Always fits, Clashes with A minor." },
      ],
    },
    {
      kind: "code",
      heading: "The audio clock: loops are whole frames",
      lang: "ts",
      code: "/**\n * Loop length in frames: the integer nearest to bars * beatsPerBar * 60 / bpm * sampleRate whose\n * duration round-trips exactly through a double, i.e. (L / sampleRate) * sampleRate === L.\n * Math.round's value is used when it round-trips. Always >= 1.\n *\n * Why: Chromium's looping AudioBufferSourceNode plays ONE pass and then goes silent when the buffer's\n * duration rounds up past its length ((L / sr) * sr > L), measured 2026-10-22: at 92 BPM, 4 bars,\n * 48 kHz the plain rounded length 500870 stops after 10.4 s; 500869 loops forever. ~84 % of lengths\n * round-trip, so the chosen L is within a few frames of the exact value (< 5 ppm tempo error).\n */\nexport function loopFrameCount(bpm: number, bars: number, sampleRate: number, beatsPerBar = 4): number {\n  const exact = ((bars * beatsPerBar * 60) / bpm) * sampleRate\n  const base = Math.max(1, Math.round(exact))\n  const roundTrips = (n: number) => n >= 1 && (n / sampleRate) * sampleRate === n\n  for (let d = 0; d <= 64; d++) {\n    const [near, far] = exact > base ? [base + d, base - d] : [base - d, base + d]\n    if (roundTrips(near)) return near\n    if (roundTrips(far)) return far\n  }\n  return base\n}",
      caption:
        "Every loop length is a whole number of sample frames, worked out once from tempo, bars and sample rate. Each track then loops on that integer in the audio thread, so no timer ever restarts a loop. The extra search for a length that survives a floating point round trip came from a real bug: a plain rounded length made the demo go silent after 10.4 s.",
      source: "loop-craft · lib/audio/timing.ts",
    },
    {
      kind: "steps",
      heading: "How the engine works",
      items: [
        { title: "Looping on the audio thread", body: "Each track is a looping buffer source on an integer frame length. No timer schedules or restarts a loop, so tracks cannot drift apart." },
        { title: "Recording by frame number", body: "An AudioWorklet captures exactly one loop by absolute frame, shifted by the measured latency: output, the compressor's look-ahead and, for the mic, input latency." },
        { title: "No mic, no problem", body: "A mic that is denied falls back to the pads automatically, so recording always works." },
        { title: "One graph for live and export", body: "The live audio graph and the WAV export are built by the same function, so what you export is what you heard." },
        { title: "Export a WAV", body: "Exports are 16-bit stereo PCM. The frame count matches an independent Python reference exactly, and the file loops seamlessly." },
      ],
    },
    {
      kind: "decisions",
      heading: "Three Chromium audio problems I found by measuring",
      items: [
        {
          choice: "Choose loop lengths that survive a round trip",
          why: "A looping buffer stops after one pass when its length times the sample rate rounds up in double precision, and the demo went silent after 10.4 s.",
          cost: "The loop is a few frames away from the exact tempo, under 5 ppm of tempo error.",
        },
        {
          choice: "Probe the real output before trusting it",
          why: "A worklet on the master output logged every onset. That is how a 128 frame skew on driven tracks, caused by 2x oversampling, showed up.",
          cost: "I had to write the probe and a set of stress runs before I could claim the loops stayed in time.",
        },
        {
          choice: "Compensate the compressor's look-ahead",
          why: "The master compressor's look-ahead is 6 ms, truncated to whole frames, and it shifted recordings and the playhead.",
          cost: "Recording, the playhead and the export each have to apply the same correction.",
        },
      ],
    },
    {
      kind: "facts",
      heading: "Measured",
      items: [
        { value: "0 samples", label: "of drift", note: "three runs of 24 to 26 loops, each exactly 118,762 frames, under buffer swaps, an agent command, a drive sweep and two 1.5 s main-thread freezes" },
        { value: "0.8 to 1.3 s", label: "from the click to sound, no microphone", note: "production build, headless Chromium, repeat runs" },
        { value: "exact", label: "WAV frame count and a seamless wrap", note: "matches an independent Python reference; the last pass differs from the first by at most 436 of 32768, against 26871 for a one-sample shift" },
        { value: "275", label: "Node tests", note: "a type-checked build and 0 axe violations; mutation testing killed 28 of 31 planted bugs and added tests now kill the other 3" },
        { value: "16", label: "loops in the sample shelf", note: "drums, bass, chords and arps, each with a stated key or no pitch at all" },
        { value: "iframe", label: "works across origins", note: "with allow=\"autoplay; microphone\"; if the mic is denied it falls back to the pads" },
        { value: "10.4 s", label: "silence bug fixed", note: "the demo used to go quiet after 10.4 s in Chromium until loop lengths were chosen to survive a floating point round trip" },
      ],
    },
    {
      kind: "prose",
      heading: "A chord lane that knows the key",
      paras: [
        "The harmony layer is the newest part. It knows the key and the scale, builds the diatonic chords, realises them with voice leading so the notes move by the smallest steps, and suggests progressions that stay in key. The demo is four bars in A minor: Am7, Fmaj7, Cmaj7, G6.",
        "Someone who knows theory sees the chords they expect. A beginner cannot pick a wrong note by accident, because the lane only offers chords that belong to the key.",
        "The chord lane reads and writes the same pattern model as the drum grid, so a shared link carries both.",
      ],
    },
    {
      kind: "prose",
      heading: "Samples that know their key",
      paras: [
        "The sample shelf is the other half of the promise. It has 16 loops rendered with LoopCraft's own synth voices: drums, bass, chords and arps. A keyed loop states its key when I author it, and a test checks every pitch is inside that key. Drums say no pitch instead of naming a key, and a recorded loop never gets a label it cannot prove.",
        "Against the live project key the shelf groups the loops In key, Always fits and Clashes. A clash names the notes that do not fit, spelled the way the loop's own key spells them. You can search by name or tag, filter by type, key and mode, and add a loop anyway if you like it. Share links carry sample tracks by id, so a shared beat reopens with the same loops.",
      ],
    },
    {
      kind: "prose",
      heading: "A project an agent can read",
      paras: [
        "Every session has a documented loopcraft-project JSON v1: tempo, bars, key, the chord lane as Roman numerals, and the tracks with their patterns, sample ids and mix. The interface can export it, copy it and load a pasted one back. Recorded audio stays local and is left out.",
        "The live app also exposes window.__loopcraft with dispatch, getDocument, getClock and import and export, so an external agent could drive it the same way the interface does. I looked at vendoring Strudel and did not: it is AGPL-3.0, and bundling its runtime would force LoopCraft to be AGPL too. A data-only text handoff is the honest version.",
      ],
    },
    {
      kind: "prose",
      heading: "Built for what's next",
      paras: [
        "Three seams are in the code. Track sources are pluggable, so a new kind of source only has to render a loop. Every state change is a validated command that the interface and an agent send down the same path, and undoable edits land on one shared undo stack. A readable transport clock reports the tempo, loop length and the position that is being heard. Mix moves are not undoable yet.",
        "I have not built an AI studio on top of these. They are the places it would plug in.",
        "Two things are still open: the sample shelf has no audition before you add a loop, and undo does not yet cover adding or removing a sample track.",
        "The engine has no audio or UI libraries behind it, only the browser's Web Audio API.",
      ],
    },
  ],
  related: ["gravity-wars", "photobooth"],
};

export default work;
