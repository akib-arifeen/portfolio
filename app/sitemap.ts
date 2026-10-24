import type { MetadataRoute } from "next";
import { caseEntries, essayEntries } from "@/lib/blog";
import { playItems } from "@/lib/os/playground";

const base = "https://akibarifeen.vercel.app";

// Canonical URLs only: /work and /writing still resolve, but /blog is where the content lives.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${base}/`, priority: 1 },
    { url: `${base}/blog`, priority: 0.8 },
    ...caseEntries().map((c) => ({ url: `${base}${c.href}`, priority: 0.6 })),
    ...essayEntries().map((e) => ({ url: `${base}${e.href}`, priority: 0.5 })),
    { url: `${base}/projects`, priority: 0.7 },
    { url: `${base}/profile`, priority: 0.6 },
    ...playItems.filter((p) => p.url).map((p) => ({ url: `${base}/play/${p.slug}`, priority: 0.4 })),
  ];
}
