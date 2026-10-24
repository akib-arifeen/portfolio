import type { Work } from "../work";

const work: Work = {
  slug: "leyci",
  title: "Léyci storefront",
  kicker: "Self-initiated concept · July 2026",
  summary:
    "From an Instagram account to a live bilingual storefront in about a day: a self-initiated concept for a Hong Kong womenswear label.",
  role: "I did the research, the bilingual copy, the storefront, the admin, the product films and the deployment",
  when: "25 to 26 July 2026",
  stack: ["Astro", "Cloudflare Pages", "Cloudflare D1", "GSAP", "Image-to-video AI"],
  status: "concept",
  outcome: { value: "About a day", note: "from an Instagram archive to a live bilingual storefront" },
  links: [{ label: "Visit the storefront", href: "https://leyci.pages.dev" }],
  cover: {
    kind: "image",
    src: "/work/leyci/cover.svg",
    alt: "A wireframe of a clothing storefront: a navigation bar, a wide hero panel with a headline, and a row of product cards with names and prices as grey bars.",
    w: 1200,
    h: 750,
  },
  blocks: [
    {
      kind: "prose",
      heading: "The idea",
      paras: [
        "This is a self-initiated concept. Nobody asked for it. I took a Hong Kong womenswear label's Instagram feed and turned it into a working online shop in about a day, to show what the brand could look like online.",
        "I started from the label's own Instagram archive. This page shows none of its photographs, because they belong to the label.",
        "The storefront is live as a demo. It was redeployed in October with the polish pass: desktop wheel scrolling is smoothed with Lenis, and every editorial photo and poster uses one corner radius.",
      ],
    },
    {
      kind: "steps",
      heading: "From archive to live shop",
      items: [
        { title: "25 July: pull the archive", body: "I pulled the label's Instagram archive: its photographs and captions." },
        { title: "Build the catalogue", body: "The archive became a catalogue of 15 looks, 25 products and 39 colourways." },
        { title: "Write and build in two languages", body: "The shop is bilingual, with Hong Kong Chinese first and English second, and has an admin area for orders, products and homepage scenes." },
        { title: "Make the films", body: "Eight short looping films of cloth, generated from the label's photographs, bring the pages to life." },
        { title: "26 July: deploy", body: "The storefront went live on Cloudflare Pages with a D1 database in the APAC region." },
      ],
    },
    {
      kind: "decisions",
      heading: "The calls I would defend",
      items: [
        {
          choice: "Server-rendered, not a static build",
          why: "The owner changes prices and stock in the admin, and those changes should appear at once. A static site would need a redeploy for every edit.",
          cost: "Catalog pages are cached for five minutes, so an edit can take up to that long to reach every visitor.",
        },
        {
          choice: "Three registers of Chinese, not one",
          why: "Four large Hong Kong shopping sites use written Chinese in their interface, and none use colloquial Cantonese there. So buttons and checkout use written Chinese, the editorial lines carry a light Cantonese touch, and heavy colloquial writing would have read as cheap and urgent.",
          cost: "A non-native writer cannot hear register mistakes, so the copy still needs a native Hong Kong reader before a real launch.",
        },
        {
          choice: "Films about cloth, never faces",
          why: "When a source frame showed any head, the video model invented a face that was not the real model. Prompting against it did not help.",
          cost: "Every frame is cropped below the hairline, both ends of the clip are pinned and the camera never widens, so the films show fabric and drape rather than people.",
        },
        {
          choice: "Ambient loops, not scroll-scrubbed video",
          why: "Scrubbing video on scroll needs a second encode for Firefox and is unreliable on iOS.",
          cost: "The films are six-second loops that scroll reveals, not frames you scrub through.",
        },
      ],
    },
    {
      kind: "facts",
      heading: "The numbers",
      items: [
        { value: "25", label: "products", note: "in 15 looks and 39 colourways" },
        { value: "8", label: "six-second films", note: "$0.25 each to generate" },
        { value: "$0", label: "per month to run", note: "on Cloudflare's free tier, at demo traffic" },
      ],
    },
    {
      kind: "prose",
      heading: "What is not finished",
      paras: [
        "It is a demo, and I am clear about that. Prices are placeholders, the English copy is machine-written and unreviewed, and checkout does not take payment: the cart hands the customer to WhatsApp with the order already written, and the WhatsApp number is a placeholder until a real shop sets its own.",
      ],
    },
  ],
  related: ["video-studio", "photobooth"],
};

export default work;
