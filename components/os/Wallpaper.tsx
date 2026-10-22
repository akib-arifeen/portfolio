"use client";

import type { WallpaperProps } from "@/lib/os/types";

/** Original wallpaper: layered gradients plus soft dunes, all colours from --os-wall-* tokens. No image files. */
export default function Wallpaper({ appearance }: WallpaperProps) {
  return (
    <div className="os-wall" data-appearance={appearance} aria-hidden="true">
      <div className="os-wall__sky" />
      <svg className="os-wall__dunes" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" focusable="false">
        <path d="M0 560 C260 470 470 520 720 590 C980 660 1250 560 1600 500 V900 H0 Z" fill="var(--os-wall-dune-1)" />
        <path d="M0 650 C220 590 420 640 660 690 C920 745 1230 650 1600 620 V900 H0 Z" fill="var(--os-wall-dune-2)" />
        <path d="M0 740 C260 690 520 730 800 770 C1080 810 1330 730 1600 720 V900 H0 Z" fill="var(--os-wall-dune-3)" />
        <path d="M0 825 C300 790 560 815 860 845 C1130 872 1390 815 1600 810 V900 H0 Z" fill="var(--os-wall-dune-4)" />
      </svg>
    </div>
  );
}
