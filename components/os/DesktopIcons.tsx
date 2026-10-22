"use client";

import { useMemo, useState, type ReactNode } from "react";
import { listDir, HOME } from "@/lib/os/fs";
import type { DesktopIconsProps, FsNode } from "@/lib/os/types";

const DESKTOP = `${HOME}/Desktop`;
const S = "var(--os-text-2)";

function glyphFor(node: FsNode): ReactNode {
  const isFolder = node.kind === "folder" || (node.type === "app" ? false : node.open?.type === "open" && node.open.app === "files");
  if (isFolder) {
    return (
      <g>
        <path d="M4 12 a3 3 0 0 1 3 -3 h8 a3 3 0 0 1 2.4 1.2 l1.8 2.3 H37 a3 3 0 0 1 3 3 V16 H4 z" fill="var(--os-icon-files-a)" />
        <path d="M4 16 a3 3 0 0 1 3 -3 h30 a3 3 0 0 1 3 3 v18 a3 3 0 0 1 -3 3 H7 a3 3 0 0 1 -3 -3 z" fill="var(--os-icon-files-b)" />
      </g>
    );
  }
  const type = node.kind === "file" ? node.type : "text";
  const page = <path d="M10 4 H26 L35 13 V40 a2 2 0 0 1 -2 2 H10 a2 2 0 0 1 -2 -2 V6 a2 2 0 0 1 2 -2 Z" fill="var(--os-icon-paper)" stroke={S} strokeWidth="1" />;
  const fold = <path d="M26 4 V13 H35" fill="none" stroke={S} strokeWidth="1" />;
  switch (type) {
    case "pdf":
      return <g>{page}{fold}<rect x="12" y="27" width="20" height="9" rx="2" fill="var(--os-close)" /><path d="M15 31.5 H29" stroke="var(--os-icon-glyph)" strokeWidth="1.6" strokeLinecap="round" /></g>;
    case "image":
      return <g>{page}{fold}<path d="M11 38 L19 28 L25 34 L29 30 L33 38 Z" fill="var(--color-icon-sage)" /><circle cx="27" cy="22" r="3" fill="var(--color-icon-amber)" /></g>;
    case "link":
      return <g>{page}{fold}<g fill="none" stroke="var(--os-icon-files-b)" strokeWidth="2.2" strokeLinecap="round"><path d="M18 30 a4 4 0 0 1 0 -6 l2 -2" /><path d="M26 25 a4 4 0 0 1 0 6 l-2 2" /><path d="M19 29 L25 27" /></g></g>;
    default:
      return <g>{page}{fold}<g stroke={S} strokeWidth="1.6" strokeLinecap="round"><path d="M13 22 H29" /><path d="M13 28 H29" /><path d="M13 34 H23" /></g></g>;
  }
}

export default function DesktopIcons({ onOpen }: DesktopIconsProps) {
  const [sel, setSel] = useState<string | null>(null);
  const items = useMemo<FsNode[]>(() => {
    try { return listDir(DESKTOP) ?? []; } catch { return []; }
  }, []);
  if (!items.length) return null;
  return (
    <div className="os-desk" onPointerDown={(e) => { if (e.target === e.currentTarget) setSel(null); }}>
      {items.map((n) => {
        const path = `${DESKTOP}/${n.name}`;
        return (
          <button
            key={n.name}
            type="button"
            className="os-desk__item"
            aria-label={`${n.name}${n.kind === "folder" ? ", folder" : ""}`}
            aria-pressed={sel === n.name}
            onClick={() => setSel(n.name)}
            onDoubleClick={() => onOpen(path)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onOpen(path); } }}
          >
            <svg className="os-desk__glyph" width="48" height="48" viewBox="0 0 44 46" aria-hidden="true" focusable="false">{glyphFor(n)}</svg>
            <span className="os-desk__label">{n.name}</span>
          </button>
        );
      })}
    </div>
  );
}
