"use client";

import { Fragment, useEffect, useState } from "react";
import { notes } from "@/lib/desk";
import type { AppProps } from "@/lib/os/types";

/** Splits `code` spans out of a paragraph. */
function Inline({ text }: { text: string }) {
  return (
    <>
      {text.split("`").map((part, i) => (i % 2 ? <code key={i}>{part}</code> : <Fragment key={i}>{part}</Fragment>))}
    </>
  );
}

function indexOfNote(id: string | undefined): number {
  const i = notes.findIndex((n) => n.id === id);
  return i < 0 ? 0 : i;
}

export default function Notes({ win }: AppProps) {
  const wanted = win.arg?.noteId;
  const [index, setIndex] = useState(() => indexOfNote(wanted));
  // narrow containers show the list and the note as two screens
  const [screen, setScreen] = useState<"list" | "note">(wanted ? "note" : "list");

  useEffect(() => {
    if (!wanted) return;
    setIndex(indexOfNote(wanted));
    setScreen("note");
  }, [wanted, win.launch]);

  const note = notes[index];

  return (
    <div className="ac ac-notes" data-screen={screen}>
      <nav className="ac-notes-list" aria-label="Notes">
        <ul>
          {notes.map((n, i) => (
            <li key={n.id}>
              <button
                type="button"
                className="ac-notes-row"
                aria-current={i === index ? "true" : undefined}
                onClick={() => { setIndex(i); setScreen("note"); }}
              >
                <span className="ac-notes-row-title">{n.title}</span>
                <span className="ac-notes-row-meta">
                  <span>{n.date}</span>
                  <span className="ac-notes-row-line">{n.body[0]}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <article className="ac-notes-body" aria-label={note.title}>
        <button type="button" className="ac-back" onClick={() => setScreen("list")}>
          <span aria-hidden="true">&lsaquo;</span> Notes
        </button>
        <p className="ac-notes-date">{note.date}</p>
        <h2 className="ac-notes-title">{note.title}</h2>
        {note.body.map((p, i) => (
          <p key={i}><Inline text={p} /></p>
        ))}
      </article>
    </div>
  );
}
