// The two studio layers that live behind a hash on the home page. A link to /#booth opens the
// booth once; the URL is the state, so activating the same tile again needs its own event.
export type StudioLayer = "booth" | "laptop";

/** The layer a hash points at, or null for any other hash. */
export function studioLayerFromHash(hash: string): StudioLayer | null {
  if (hash === "#booth") return "booth";
  if (hash === "#laptop") return "laptop";
  return null;
}

export type SamePageLayer = {
  layer: StudioLayer;
  /** The hash the link would set, e.g. "#booth". */
  hash: string;
  /** True when the address bar is already on this layer, so no hashchange will fire. */
  alreadyThere: boolean;
};

/**
 * Resolve a PlayStrip tile for the current page. Null means the tile is a normal navigation
 * (another route, or no layer hash) and the link should be left alone.
 */
export function samePageLayer(href: string, pathname: string, hash: string): SamePageLayer | null {
  const url = new URL(href, "https://portfolio.invalid");
  if (url.pathname !== pathname) return null;
  const layer = studioLayerFromHash(url.hash);
  if (!layer) return null;
  return { layer, hash: url.hash, alreadyThere: url.hash === hash };
}

/** The parts of a mouse click that change what a link means. */
export type TileClick = {
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
};

export type TileIntent =
  /** The browser's own handling: another route, a modified click, a middle click. */
  | { kind: "ignore" }
  /** A first activation on a layer tile: let the address bar carry the state. */
  | { kind: "hash"; hash: string }
  /** The hash is already set, so no hashchange will fire: ask Hero to reopen the layer. */
  | { kind: "reopen"; layer: StudioLayer };

/**
 * What a PlayStrip tile click should do. A modified or non-primary click belongs to the visitor's
 * browser — new tab, new window, download, paste — so it must be left alone before anything is
 * prevented. Only a plain left click on a same-page layer tile is ours to intercept.
 */
export function tileIntent(click: TileClick, href: string, pathname: string, hash: string): TileIntent {
  if (click.button !== 0) return { kind: "ignore" };
  if (click.metaKey || click.ctrlKey || click.shiftKey || click.altKey) return { kind: "ignore" };
  const target = samePageLayer(href, pathname, hash);
  if (!target) return { kind: "ignore" };
  return target.alreadyThere ? { kind: "reopen", layer: target.layer } : { kind: "hash", hash: target.hash };
}

/** Hero listens for this to reopen a layer whose hash is already in the address bar. */
export const STUDIO_OPEN_EVENT = "studio:open";
