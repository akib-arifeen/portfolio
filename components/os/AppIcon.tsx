"use client";

import { useId, type ReactNode } from "react";
import type { AppIconProps, AppId } from "@/lib/os/types";

/** Superellipse ("squircle") outline in a 100 x 100 box. */
const SQUIRCLE = "M50 0 C86 0 100 14 100 50 C100 86 86 100 50 100 C14 100 0 86 0 50 C0 14 14 0 50 0 Z";

const G = "var(--os-icon-glyph)";
const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function glyph(id: AppId): ReactNode {
  switch (id) {
    case "files":
      return (
        <g>
          <path d="M18 34 a5 5 0 0 1 5 -5 h16 a5 5 0 0 1 4 2 l4 5 h26 a5 5 0 0 1 5 5 v6 H18 z" fill={G} fillOpacity="0.7" />
          <path d="M18 44 a5 5 0 0 1 5 -5 h54 a5 5 0 0 1 5 5 v26 a5 5 0 0 1 -5 5 H23 a5 5 0 0 1 -5 -5 z" fill={G} />
        </g>
      );
    case "browser":
      return (
        <g fill="none" stroke={G} strokeWidth="5" strokeLinecap="round">
          <circle cx="50" cy="50" r="23" />
          <ellipse cx="50" cy="50" rx="10" ry="23" strokeWidth="3.5" />
          <path d="M27 50 H73" strokeWidth="3.5" />
          <ellipse cx="50" cy="50" rx="37" ry="12" strokeWidth="3.5" transform="rotate(-28 50 50)" strokeOpacity="0.8" />
        </g>
      );
    case "mail":
      return (
        <g>
          <rect x="19" y="29" width="62" height="42" rx="7" fill={G} />
          <path d="M23 35 L50 55 L77 35" fill="none" stroke="var(--os-icon-mail-b)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
    case "notes":
      return (
        <g>
          <rect x="25" y="17" width="50" height="66" rx="6" fill="var(--os-icon-paper)" />
          <rect x="25" y="17" width="50" height="13" rx="6" fill="var(--os-icon-notes-b)" fillOpacity="0.55" />
          <g stroke="var(--os-icon-notes-b)" strokeWidth="3.5" strokeLinecap="round">
            <path d="M33 42 H67" /><path d="M33 53 H67" /><path d="M33 64 H55" />
          </g>
        </g>
      );
    case "photos":
      return (
        <g>
          <circle cx="62" cy="34" r="10" fill="var(--color-icon-amber)" />
          <path d="M14 76 L40 46 L58 66 L68 56 L86 76 Z" fill="var(--color-icon-sage)" />
          <path d="M14 76 L30 58 L48 76 Z" fill="var(--os-icon-files-b)" fillOpacity="0.85" />
        </g>
      );
    case "music":
      return (
        <g fill={G}>
          <path d="M42 26 L70 20 V62 H63 V34 L49 37 V66 H42 Z" />
          <ellipse cx="38" cy="68" rx="11" ry="8.5" transform="rotate(-18 38 68)" />
          <ellipse cx="59" cy="63" rx="11" ry="8.5" transform="rotate(-18 59 63)" />
        </g>
      );
    case "calendar":
      return <CalendarGlyph />;
    case "playground":
      return (
        <g>
          <path d="M30 34 H70 a16 16 0 0 1 16 16 v6 a12 12 0 0 1 -21 8 l-5 -6 H40 l-5 6 a12 12 0 0 1 -21 -8 v-6 a16 16 0 0 1 16 -16 z" fill={G} />
          <path d="M33 44 v14 M26 51 h14" stroke="var(--os-icon-playground-b)" strokeWidth="4.5" strokeLinecap="round" />
          <circle cx="63" cy="47" r="4" fill="var(--os-icon-playground-b)" />
          <circle cx="72" cy="55" r="4" fill="var(--os-icon-playground-b)" />
        </g>
      );
    case "terminal":
      return (
        <g fill="none" stroke="var(--color-terminal-ink)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M26 36 L44 50 L26 64" />
          <path d="M52 66 H74" />
        </g>
      );
    case "preview":
      return (
        <g>
          <rect x="18" y="22" width="50" height="42" rx="6" fill="var(--os-icon-paper)" />
          <path d="M18 56 L34 40 L46 52 L54 44 L68 58 V58 a6 6 0 0 1 -6 6 H24 a6 6 0 0 1 -6 -6 z" fill="var(--os-icon-preview-b)" />
          <circle cx="56" cy="34" r="4.5" fill="var(--color-icon-amber)" />
          <circle cx="60" cy="58" r="14" fill="var(--os-icon-preview-a)" fillOpacity="0.35" stroke={G} strokeWidth="5" />
          <path d="M70 69 L82 81" stroke={G} strokeWidth="6" strokeLinecap="round" />
        </g>
      );
    case "about":
      return (
        <g fill="none" stroke={G} strokeLinecap="round">
          <circle cx="50" cy="50" r="30" strokeWidth="4" strokeOpacity="0.7" />
          <circle cx="46" cy="52" r="10" strokeWidth="6" />
          <path d="M57 41 V63" strokeWidth="6" />
        </g>
      );
  }
}

function CalendarGlyph() {
  const now = new Date();
  return (
    <g fontFamily="var(--os-font)" textAnchor="middle" fontWeight="700">
      <text x="50" y="33" fontSize="15" fill="var(--os-close)" letterSpacing="1">{WEEKDAYS[now.getDay()]}</text>
      <text x="50" y="73" fontSize="42" fill="var(--color-ink)" fontWeight="500">{now.getDate()}</text>
    </g>
  );
}

export default function AppIcon({ id, size = 56 }: AppIconProps) {
  const uid = useId();
  const grad = `${uid}-g`;
  const hi = `${uid}-h`;
  return (
    <svg
      className={`os-icon os-icon--${id}`}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
      style={{ display: "block", filter: "drop-shadow(0 1.5px 2px var(--os-icon-shadow))" }}
    >
      <defs>
        <linearGradient id={grad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: `var(--os-icon-${id}-a)` }} />
          <stop offset="1" style={{ stopColor: `var(--os-icon-${id}-b)` }} />
        </linearGradient>
        <linearGradient id={hi} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "var(--os-icon-glyph)", stopOpacity: 0.55 }} />
          <stop offset="0.5" style={{ stopColor: "var(--os-icon-glyph)", stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      <path d={SQUIRCLE} fill={`url(#${grad})`} />
      <path d={SQUIRCLE} fill="none" stroke={`url(#${hi})`} strokeWidth="2" transform="translate(1 1) scale(0.98)" />
      {glyph(id)}
    </svg>
  );
}
