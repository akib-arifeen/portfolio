"use client";

import { useState } from "react";
import type { ExperienceEntry } from "@/lib/profile";

/**
 * Experience as a timeline. Each entry shows its role, organisation and dates; the detail opens
 * and closes on a button, so the page reads as a summary until a reader asks for more. Closing is
 * the reverse of the same transition, so a half-open entry can be reversed mid-move, and with
 * reduced motion the same button shows the same text with no movement at all.
 */
export function Timeline({ entries }: { entries: ExperienceEntry[] }) {
  return (
    <ol className="tl">
      {entries.map((entry, i) => (
        <Row key={entry.id} entry={entry} defaultOpen={i === 0} />
      ))}
    </ol>
  );
}

function Row({ entry, defaultOpen }: { entry: ExperienceEntry; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = `tl-body-${entry.id}`;
  const headingId = `tl-heading-${entry.id}`;

  return (
    <li className="tl__item">
      <div className="tl__head">
        <p className="tl__when">
          <time dateTime={entry.start}>{entry.when}</time>
        </p>
        <h3 className="tl__role" id={headingId}>{entry.role}</h3>
        <p className="tl__org">{entry.org} · {entry.where}</p>
      </div>

      <button
        type="button"
        className="tl__toggle"
        aria-expanded={open}
        aria-controls={bodyId}
        aria-label={`${open ? "Hide" : "Show"} detail for ${entry.role} at ${entry.org}`}
        onClick={() => setOpen((was) => !was)}
      >
        {open ? "Hide detail" : "Show detail"}
      </button>

      <div className="tl__body" id={bodyId} role="region" aria-labelledby={headingId} data-open={open}>
        <div className="tl__inner">
          <ul className="tl__points">
            {entry.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
      </div>
    </li>
  );
}
