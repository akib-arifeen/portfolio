"use client";

import Link from "next/link";
import { useEffect } from "react";
import BoothScreen from "@/components/booth/BoothScreen";
import { useBooth } from "@/components/booth/useBooth";

export default function PhotoboothApp({ onStepAway }: { onStepAway: () => void }) {
  const booth = useBooth(true);
  useEffect(() => {
    document.querySelector<HTMLElement>("[data-booth-heading]")?.focus({ preventScroll: true });
  }, [booth.step]);

  return (
    <section className="workspace-booth" aria-label="The photobooth app">
      <div className="workspace-booth__context">
        <p className="portal-kicker">A working app in my workspace</p>
        <p>Camera access is optional. You can use my sample photo, review everything before it leaves the device, or download the card without an AI restyle.</p>
        <Link className="portal-read" href="/blog/photobooth">How I built the booth <span aria-hidden="true">↗</span></Link>
      </div>
      <BoothScreen booth={booth} onStepAway={onStepAway} />
    </section>
  );
}
