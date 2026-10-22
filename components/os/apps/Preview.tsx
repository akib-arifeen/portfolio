"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { listDir, normalizePath, resolvePath } from "@/lib/os/fs";
import type { AppProps, FsFile } from "@/lib/os/types";
import { useOs } from "../OsContext";

const URL_RE = /(https?:\/\/[^\s<>()]+[^\s<>().,;:!?])/g;

function linkify(text: string, key: string): ReactNode[] {
  return text.split(URL_RE).map((part, i) =>
    /^https?:\/\//.test(part)
      ? <a key={`${key}-${i}`} href={part} target="_blank" rel="noopener noreferrer">{part}</a>
      : <Fragment key={`${key}-${i}`}>{part}</Fragment>,
  );
}

/** Headings (#, ##), "- " lists, blank-line paragraphs and bare links. Nothing else. */
function renderText(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let para: string[] = [];
  let list: string[] = [];
  let n = 0;
  const flushPara = () => {
    if (para.length) { const k = `p${n++}`; out.push(<p key={k}>{para.map((l, i) => <Fragment key={i}>{i > 0 && <br />}{linkify(l, `${k}-${i}`)}</Fragment>)}</p>); para = []; }
  };
  const flushList = () => {
    if (list.length) {
      const k = `l${n++}`;
      out.push(<ul key={k}>{list.map((li, i) => <li key={i}>{linkify(li, `${k}-${i}`)}</li>)}</ul>);
      list = [];
    }
  };
  for (const raw of text.split("\n")) {
    const line = raw.trimEnd();
    const h = /^(#{1,2})\s+(.*)$/.exec(line);
    if (h) {
      flushPara(); flushList();
      const k = `h${n++}`;
      out.push(h[1].length === 1 ? <h1 key={k}>{linkify(h[2], k)}</h1> : <h2 key={k}>{linkify(h[2], k)}</h2>);
    } else if (/^-\s+/.test(line)) {
      flushPara(); list.push(line.replace(/^-\s+/, ""));
    } else if (line.trim() === "") {
      flushPara(); flushList();
    } else {
      flushList(); para.push(line.trim());
    }
  }
  flushPara(); flushList();
  return out;
}

export default function Preview({ win }: AppProps) {
  const os = useOs();
  const [path, setPath] = useState<string | null>(win.arg?.path ? normalizePath(win.arg.path) : null);
  const [actual, setActual] = useState(false);
  const seenLaunch = useRef(win.launch);
  const viewerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (seenLaunch.current === win.launch) return;
    seenLaunch.current = win.launch;
    setPath(win.arg?.path ? normalizePath(win.arg.path) : null);
  }, [win.launch, win.arg?.path]);

  const node = path ? resolvePath(path) : null;
  const file: FsFile | null = node && node.kind === "file" ? node : null;

  useEffect(() => { os.setTitle(win.id, file ? file.name : "Preview"); }, [os, win.id, file]);
  useEffect(() => { setActual(false); }, [path]);
  // Take keyboard focus on open and on a new launch, so arrows step images instead of moving the opener's selection.
  useEffect(() => { viewerRef.current?.focus(); }, [path, win.launch, file?.type]);

  const siblings = useMemo(() => {
    if (!path || !file || file.type !== "image") return [];
    const parent = normalizePath("..", path);
    return (listDir(parent) ?? []).filter((n): n is FsFile => n.kind === "file" && n.type === "image").map((n) => normalizePath(n.name, parent));
  }, [path, file]);

  const stepImage = (d: number) => {
    if (!path || siblings.length < 2) return;
    const i = siblings.indexOf(path);
    setPath(siblings[(i + d + siblings.length) % siblings.length]);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") { e.preventDefault(); stepImage(1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); stepImage(-1); }
  };

  if (!file) {
    return (
      <div className="pv pv-empty">
        <p>Nothing to preview</p>
      </div>
    );
  }

  const title = file.name;
  let body: ReactNode;
  switch (file.type) {
    case "pdf":
      body = (
        <>
          <div className="pv-bar">
            <span className="pv-name">{title}</span>
            <a className="pv-btn" href={file.src} download>Download</a>
            <a className="pv-btn" href={file.src} target="_blank" rel="noopener noreferrer">Open in new tab</a>
          </div>
          <iframe className="pv-frame" src={file.src} title={title} />
        </>
      );
      break;
    case "image":
      body = (
        <div ref={viewerRef} className="pv-imgwrap" data-actual={actual} tabIndex={0} onKeyDown={onKeyDown} aria-label={`${title}. Left and right arrows show other images in this folder.`}>
          {siblings.length > 1 && (
            <>
              <button type="button" className="pv-nav pv-prev" aria-label="Previous image" onClick={() => stepImage(-1)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
              </button>
              <button type="button" className="pv-nav pv-next" aria-label="Next image" onClick={() => stepImage(1)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
              </button>
            </>
          )}
          <button type="button" className="pv-imgbtn" aria-label={actual ? "Fit to window" : "Show at actual size"} onClick={() => setActual((a) => !a)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={file.src} alt={title} draggable={false} />
          </button>
        </div>
      );
      break;
    case "video":
      body = <div className="pv-media"><video src={file.src} controls playsInline preload="metadata" aria-label={title} /></div>;
      break;
    case "audio":
      body = <div className="pv-media"><audio src={file.src} controls preload="metadata" aria-label={title} /></div>;
      break;
    case "text":
      body = <article className="pv-text">{renderText(file.text ?? "")}</article>;
      break;
    default:
      body = <div className="pv-empty"><p>Nothing to preview</p></div>;
  }

  return <div className="pv">{body}</div>;
}
