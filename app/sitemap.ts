import type { MetadataRoute } from "next";
import { allWorks } from "@/lib/work";
import { playItems } from "@/lib/os/playground";

const base = "https://akibarifeen.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${base}/`, priority: 1 },
    { url: `${base}/work`, priority: 0.8 },
    ...allWorks().map((w) => ({ url: `${base}/work/${w.slug}`, priority: 0.6 })),
    ...playItems.filter((p) => p.url).map((p) => ({ url: `${base}/play/${p.slug}`, priority: 0.4 })),
  ];
}
