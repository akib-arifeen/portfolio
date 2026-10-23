import type { Work } from "../work";

const work: Work = {
    slug: "photobooth",
    title: "AI photobooth with ARI",
    kicker: "See Change Education \u00b7 2026",
    summary:
      "I built a photobooth hosted by ARI, an animated character who greets guests, talks with them in English or Cantonese, restyles their photo with AI and prints it on the spot.",
    role: "I did the concept, the UX, the animation, the voicelines, the prompts, the frontend, the backend and the print agent",
    when: "2026",
    stack: ["React", "Spring Boot", "FastAPI", "Azure Speech", "MiniMax TTS", "Node.js print agent"],
    status: "shipped",
    outcome: { value: "200 to 300 guests", note: "per event, SCMUN 2026 and the AAI dinner" },
    links: [],
    cover: {
      kind: "image",
      src: "/work/photobooth/booth-card.jpg",
      alt: "The 3D photobooth on this site after a run: a printed card with a portrait and the title Akib's Studio held in front of the red booth.",
      w: 1600,
      h: 1000,
      caption: "The 3D photobooth on this site, a playable homage to the real one. This is its printed card, shown in demo mode with my own photo.",
    },
    blocks: [
      {
        kind: "prose",
        heading: "What I wanted to build",
        paras: [
          "The ask was a photobooth. What I wanted was for the thing to talk to people, so I turned it into a character-led experience: ARI greets you as you walk up, talks back in English or Cantonese, tells fun facts while you wait and prints silently.",
          "I wrote the voicelines, designed the animations and built a native print agent, because browsers cannot print silently. It ran live at SCMUN 2026 and at the AAI dinner, where most guests spoke Cantonese.",
        ],
      },
      {
        kind: "prose",
        heading: "What actually happened",
        paras: [
          "The booth became a host rather than a camera. Guests remember being greeted and talked to, so ARI speaks to them in their own language, and the voicelines are mine, written in English and Cantonese.",
          "Most of the room spoke Cantonese, which meant ARI had to speak Cantonese well rather than just English well, and that set the tone for the whole build. The audio and the animation are one thing here, not two: the character has to keep talking while the photo is being restyled, otherwise the wait feels like a stall.",
        ],
      },
      {
        kind: "media",
        heading: "The booth, rebuilt for this site",
        items: [
          {
            kind: "image",
            src: "/work/photobooth/booth-screen.jpg",
            alt: "Close up of the 3D photobooth's touchscreen reading Step up, with buttons to start the camera or use Akib's photo.",
            w: 1600,
            h: 1000,
            caption: "The booth's own screen, from the playable version in the studio on the home page. It is a homage to the real booth, not the event software.",
          },
          {
            kind: "image",
            src: "/work/photobooth/studio-room.jpg",
            alt: "The isometric 3D studio room with the red photobooth marked PHOTOS beside a plant, and a desk with a small avatar of Akib.",
            w: 1600,
            h: 1000,
            caption: "The booth in its room. Pick the photobooth on the home page to walk up to it.",
          },
        ],
      },
      {
        kind: "steps",
        heading: "The guest flow",
        items: [
          { title: "Walk up", body: "ARI notices someone approaching and greets them first." },
          { title: "Talk to ARI", body: "Guests speak with ARI in English or Cantonese and pick a look." },
          { title: "Take the photo", body: "The booth captures the guest, and a group gets its own set of voicelines." },
          { title: "AI restyle", body: "The photo becomes a themed look while ARI shares fun facts, so the wait is part of the show." },
          { title: "Print", body: "The native print agent sends the card to the printer without a dialog." },
        ],
      },
      {
        kind: "code",
        heading: "A bug that only showed up at scale",
        lang: "ts",
        code: `class VoiceBank {
  private clips = new Map<string, HTMLAudioElement>()

  // Browsers cap live media players per page, so elements are created lazily.
  get(id: string): HTMLAudioElement {
    let clip = this.clips.get(id)
    if (!clip) {
      clip = new Audio('/voice/' + id + '.mp3')
      clip.preload = 'none'
      this.clips.set(id, clip)
    }
    return clip
  }

  prefetch(ids: string[]) {
    ids.forEach((id) => this.get(id).load())
  }
}

const voices = new VoiceBank()
voices.prefetch(['greeting', 'first-question'])`,
      caption:
        "Browsers allow only a limited number of media players per page. Creating an element for every clip up front meant lines late in a long list never played. Creating elements lazily with preload none, and warming only a short list, fixed it.",
      source: "Simplified sketch of the approach, not production code",
      },
      {
        kind: "steps",
        heading: "The print agent",
        items: [
          { title: "A small service on the booth laptop", body: "The booth page hands each card to a Node service running on the same laptop, so no print dialog ever appears in front of a guest." },
          { title: "Windows, Mac and Linux", body: "It prints through SumatraPDF on Windows and CUPS on Mac and Linux. A Save-as-PDF test mode lets me check a layout without using paper." },
          { title: "Cards that match the event", body: "A6 templates, duplex and back-page printing, and group copies." },
          { title: "One hidden program", body: "It ships as a single background .exe. Running it with --install makes it start by itself, and it needs no admin rights." },
        ],
      },
      {
        kind: "code",
        heading: "Turning a green-screen frame into a transparent window",
        lang: "python",
        code: `import numpy as np
from matplotlib.colors import rgb_to_hsv
from scipy import ndimage

def key_to_alpha(img: np.ndarray, key_hue: float, tol: float = 0.06) -> np.ndarray:
    hsv = rgb_to_hsv(img / 255.0)
    gap = np.abs(hsv[..., 0] - key_hue)
    gap = np.minimum(gap, 1.0 - gap)  # hue wraps around
    is_key = (gap < tol) & (hsv[..., 1] > 0.4)
    is_key = ndimage.binary_opening(is_key, structure=np.ones((5, 5)))  # drop specks
    alpha = 1.0 - ndimage.gaussian_filter(is_key.astype(float), sigma=1.5)  # feather
    return np.dstack([img, (alpha * 255).astype(np.uint8)])`,
      caption:
        "Every event sends its frame as artwork with the photo area filled in one flat key colour. This script finds the pixels close to that colour by hue, removes stray specks with a morphological open, and blurs the mask slightly so the window gets a soft edge. The result is an image with a transparent window. It replaced a manual step I had been repeating.",
      source: "Simplified sketch of the approach, not production code",
      },
      {
        kind: "decisions",
        heading: "The calls I would defend",
        items: [
          {
            choice: "A character, not just a camera",
            why: "Guests remember being greeted and talked to, so the booth became ARI, who speaks to them in their own language.",
            cost: "I wrote the voicelines in English and Cantonese and designed the animations myself.",
          },
          {
            choice: "A native print agent",
            why: "Browsers cannot print silently, and a print dialog at an event breaks the flow.",
            cost: "A second project to build and ship: one hidden background program on the booth laptop that installs without admin rights.",
          },
          {
            choice: "Load audio clips on demand",
            why: "Preloading every clip hit the browser's media player cap, so most of the voice pack could not play.",
            cost: "A few milliseconds on the first play of a line, with a short hot set warmed ahead for the attract screen.",
          },
        ],
      },
      {
        kind: "prose",
        heading: "What broke",
        paras: [
          "The voice bank broke at the worst possible moment. I was creating an audio element for every clip up front, and browsers cap how many media players a page can hold, so lines late in a long list simply never played. Creating the elements lazily with preload none and warming only a short list fixed it. The cost was a few milliseconds on the first play of a line, with a short hot set warmed ahead for the attract screen.",
          "Printing broke in a way that was not my code's fault at all. A browser cannot print silently, so a print dialog would have appeared in front of a guest at an event and broken the whole flow. There was no way around that except to write my own program that runs on the booth laptop.",
        ],
      },
      {
        kind: "prose",
        heading: "What I learned",
        paras: [
          "A voice-first interface has to prove it is listening. The loudest status element on the screen is the heard strip, showing the live mic state and the last thing the app heard, because a guest who cannot tell whether the booth heard them will talk louder and then give up.",
          "Some of the hardest parts of this project were not about AI at all. They were about a browser refusing to print quietly and a page refusing to hold one more audio element. I had to treat those as product problems rather than platform problems, because at an event there is nobody to ask.",
        ],
      },
      {
        kind: "prose",
        heading: "What I would do differently",
        paras: [
          "I would write the print agent first. It was the piece I knew could not be done in the browser, and I built it late, which meant the card layout and the print flow had to bend around it instead of the other way round.",
          "I would also load the voice pack lazily from the start rather than after an event taught me to. The fix is small now, but it cost me a run to find.",
        ],
      },
      {
        kind: "facts",
        heading: "On the day",
        items: [
          { value: "200 to 300", label: "guests per event", note: "SCMUN 2026 and the AAI corporate dinner" },
          { value: "about 300", label: "guests at the AAI dinner" },
          { value: "about 95%", label: "of them Cantonese-speaking", note: "so ARI had to speak Cantonese well" },
        ],
      },
    ],
    related: ["video-studio", "lesson-pipeline"],
  };

export default work;
