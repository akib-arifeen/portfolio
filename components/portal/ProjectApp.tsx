"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Project } from "@/lib/content";
import { playItems } from "@/lib/os/playground";
import type { Work } from "@/lib/work";
import { PlayFrame } from "@/components/play/PlayFrame";

export const PRODUCT_MEDIA: Record<string, { src: string; alt: string; w: number; h: number }> = {
  video: { src: "/work/video-studio/create-screen.png", alt: "The shipped video-studio planning workflow, including brief, quality checks and human approval before rendering.", w: 1440, h: 900 },
  booth: { src: "/work/photobooth/booth-screen.jpg", alt: "The working photobooth interface used to choose a style and review a photo.", w: 1600, h: 930 },
  lessons: { src: "/work/lesson-pipeline/review-page.png", alt: "The lesson review interface for checking generated learning material before publication.", w: 1600, h: 1000 },
  culinary: { src: "/work/culinary-companion/cooking-1280.png", alt: "Culinary Companion guiding a cooking step with voice and gesture controls.", w: 1280, h: 800 },
};

function engineeringItems(work: Work) {
  const decisions = work.blocks.find((block) => block.kind === "decisions");
  if (decisions) return decisions.items.slice(0, 4).map((item) => ({ title: item.choice, body: `${item.why} Trade-off: ${item.cost}` }));
  const steps = work.blocks.find((block) => block.kind === "steps");
  if (steps) return steps.items.slice(0, 4);
  return [];
}

export default function ProjectApp({ project, work }: { project: Project; work: Work }) {
  const [view, setView] = useState<"walkthrough" | "systems" | "evidence" | "live">("walkthrough");
  const media = PRODUCT_MEDIA[project.id];
  const judgments = engineeringItems(work);
  const play = playItems.find((item) => item.slug === work.playSlug);
  const facts = work.blocks.find((block) => block.kind === "facts");

  return (
    <section className="project-app" aria-labelledby="project-app-title">
      <header className="project-app__head">
        <p className="portal-kicker">{work.kicker} · {work.status}</p>
        <h2 id="project-app-title">How I built {project.title}.</h2>
        <p>{project.text}</p>
        <p className="portal-project__role">{work.role}</p>
        <nav className="project-app__tabs" aria-label={`${work.title} sections`}>
          {(["walkthrough", "systems", "evidence"] as const).map((id) => (
            <button key={id} type="button" aria-pressed={view === id} onClick={() => setView(id)}>
              {id === "walkthrough" ? "Walkthrough" : id === "systems" ? "System & trade-offs" : "Outcome & evidence"}
            </button>
          ))}
          {play ? <button type="button" aria-pressed={view === "live"} onClick={() => setView("live")}>Open the app</button> : null}
        </nav>
      </header>

      {view === "walkthrough" ? (
        <div className="project-app__walkthrough">
          {media ? <Image src={media.src} alt={media.alt} width={media.w} height={media.h} priority sizes="(min-width: 60rem) 72vw, 100vw" /> : null}
          <section>
            <h3>From the request to a working product</h3>
            <p>{work.summary}</p>
            <dl className="portal-facts">
              <div><dt>Stack</dt><dd>{work.stack.join(" · ")}</dd></div>
              <div><dt>Status</dt><dd>{work.status}</dd></div>
            </dl>
            <Link className="portal-read" href={`/blog/${project.slug}`}>Read the full Blog <span aria-hidden="true">↗</span></Link>
          </section>
        </div>
      ) : null}

      {view === "systems" ? (
        <div className="project-app__systems">
          <h3>Boundaries and engineering judgment</h3>
          <p>{work.role}</p>
          <ul className="project-app__decisions">
            {judgments.map((item) => <li key={item.title}><strong>{item.title}</strong><p>{item.body}</p></li>)}
          </ul>
          <Link className="portal-read" href={`/blog/${project.slug}`}>Read the implementation notes <span aria-hidden="true">↗</span></Link>
        </div>
      ) : null}

      {view === "evidence" ? (
        <div className="project-app__evidence">
          <h3>What shipped, and how it holds up</h3>
          {work.outcome ? <p className="project-app__outcome">{work.outcome.value}<span>{work.outcome.note}</span></p> : null}
          {facts ? (
            <dl className="project-app__facts">
              {facts.items.map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}{item.note ? <span>{item.note}</span> : null}</dd></div>)}
            </dl>
          ) : null}
          <p>Verification and implementation detail are documented in the full Blog, including the trade-offs that did not survive contact with real use.</p>
          <Link className="portal-read" href={`/blog/${project.slug}`}>Read the evidence in the Blog <span aria-hidden="true">↗</span></Link>
        </div>
      ) : null}

      {view === "live" && play?.url ? (
        <div className="project-app__live">
          <PlayFrame src={play.url} title={play.name} allow={play.allow} sandbox={play.sandbox} />
        </div>
      ) : null}
    </section>
  );
}
