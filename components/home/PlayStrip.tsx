"use client";

import Link from "next/link";
import { playItems } from "@/lib/os/playground";
import type { PlayItem } from "@/lib/os/types";
import { samePageLayer, STUDIO_OPEN_EVENT, type StudioLayer } from "@/lib/hash-nav";

type Tile = { key: string; name: string; blurb: string; status: PlayItem["status"]; href: string };

const fromPlay = (slug: string): Tile => {
  const item = playItems.find((i) => i.slug === slug);
  if (!item) throw new Error(`playground item missing: ${slug}`);
  return { key: slug, name: item.name, blurb: item.blurb, status: item.status, href: `/play/${slug}` };
};

// The photobooth and the laptop run on this page, so they are not in playground.ts; both are playable.
const tiles: Tile[] = [
  fromPlay("gravity-wars"),
  fromPlay("loopcraft"),
  fromPlay("save-your-princess"),
  { key: "booth", name: "The photobooth", blurb: "Walk up to the booth in the studio, take a photo and get a printed card.", status: "playable", href: "/#booth" },
  { key: "laptop", name: "My laptop", blurb: "Open it and look around: Files, Notes, Photos, Music and a Terminal.", status: "playable", href: "/#laptop" },
];

/** A hash link cannot reopen a layer that is already in the address bar: no hashchange fires, so the tile asks Hero directly. */
function openLayer(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
  const target = samePageLayer(href, window.location.pathname, window.location.hash);
  if (!target) return;
  e.preventDefault();
  if (target.alreadyThere) {
    window.dispatchEvent(new CustomEvent<StudioLayer>(STUDIO_OPEN_EVENT, { detail: target.layer }));
    return;
  }
  // Let the address bar carry the state, exactly as following the link would, so Back still works.
  window.location.hash = target.hash;
}

export default function PlayStrip() {
  return (
    <ul className="tiles">
      {tiles.map((t) => (
        <li key={t.key} data-reveal>
          <Link className="tile" href={t.href} onClick={(e) => openLayer(e, t.href)}>
            <span className="hbadge" data-status={t.status}>{t.status}</span>
            <span className="tile__name">{t.name}</span>
            <span className="tile__blurb">{t.blurb}</span>
            <span className="tile__go" aria-hidden="true">&rarr;</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
