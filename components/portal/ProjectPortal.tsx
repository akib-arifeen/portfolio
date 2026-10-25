"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { projects } from "@/lib/content";
import { notes } from "@/lib/desk";
import { films } from "@/lib/media";
import { getWork, type Work } from "@/lib/work";
import FilmShelf from "./FilmShelf";

const entries = projects.flatMap((project) => {
  const work = getWork(project.slug);
  return work ? [{ project, work }] : [];
});
const deskNotes = notes.filter((note) => note.id !== "welcome");

const PRODUCT_MEDIA: Record<string, { src: string; alt: string; w: number; h: number }> = {
  video: { src: "/work/video-studio/create-screen.png", alt: "The shipped video-studio planning workflow, including brief, quality checks and human approval before rendering.", w: 1440, h: 900 },
  booth: { src: "/work/photobooth/booth-screen.jpg", alt: "The working photobooth interface used to choose a style and review a photo.", w: 1600, h: 930 },
  lessons: { src: "/work/lesson-pipeline/review-page.png", alt: "The lesson review interface for checking generated learning material before publication.", w: 1600, h: 1000 },
  culinary: { src: "/work/culinary-companion/cooking-1280.png", alt: "Culinary Companion guiding a cooking step with voice and gesture controls.", w: 1280, h: 800 },
};

function engineeringItems(work: Work) {
  const decisions = work.blocks.find((block) => block.kind === "decisions");
  if (decisions) return decisions.items.slice(0, 3).map((item) => ({ title: item.choice, body: `${item.why} Trade-off: ${item.cost}` }));
  const steps = work.blocks.find((block) => block.kind === "steps");
  if (steps) return steps.items.slice(0, 3);
  return [];
}

type Section = "projects" | "sketchbook" | "notes";

export default function ProjectPortal({ onClose }: { onClose: () => void }) {
  const [section, setSection] = useState<Section>("projects");
  const tabs: { id: Section; label: string }[] = [
    { id: "projects", label: `Case files · ${entries.length}` },
    { id: "notes", label: "Build notes" },
    { id: "sketchbook", label: `Sketchbook · ${films.length}` },
  ];

  return (
    <div className="project-portal">
      <header className="portal-masthead">
        <div>
          <p className="portal-kicker">Akib Arifeen · software / web engineer</p>
          <h1>Engineering <em>case files</em></h1>
        </div>
        <button type="button" className="portal-close" onClick={onClose} aria-label="Close the laptop">
          Close <span aria-hidden="true">×</span>
        </button>
      </header>

      <div className="portal-layout">
        <aside className="portal-rail">
          <nav aria-label="Project reader sections">
            {tabs.map((tab) => (
              <button key={tab.id} type="button" aria-pressed={section === tab.id} onClick={() => setSection(tab.id)}>
                {tab.label}
              </button>
            ))}
          </nav>
          <p>Architecture, system boundaries, trade-offs, verification and shipped outcomes.</p>
          <Link href="/blog">The complete blog <span aria-hidden="true">↗</span></Link>
        </aside>

        <main className="portal-content">
          {section === "projects" ? (
            <section aria-labelledby="portal-projects-title">
              <header className="portal-section-head">
                <p className="portal-kicker">Engineering workbench</p>
                <h2 id="portal-projects-title">Systems, decisions, and what shipped.</h2>
              </header>
              <div className="portal-project-grid">
                {entries.map(({ project, work }, index) => {
                  const media = PRODUCT_MEDIA[project.id];
                  const judgments = engineeringItems(work);
                  return (
                    <article className={index === 0 ? "portal-project portal-project--lead" : "portal-project"} key={project.id}>
                      <div className="portal-project__body">
                        <div className="portal-project__meta">
                          <p>{work.kicker}</p>
                          <span data-status={work.status}>{work.status}</span>
                        </div>
                        <h3><Link href={`/blog/${project.slug}`}>{project.title}</Link></h3>
                        <p>{project.text}</p>
                        <p className="portal-project__role">{work.role}</p>
                        <dl className="portal-facts">
                          <div><dt>Stack</dt><dd>{work.stack.join(" · ")}</dd></div>
                          {work.outcome ? <div><dt>Shipped outcome</dt><dd>{work.outcome.value} · {work.outcome.note}</dd></div> : null}
                        </dl>
                        {judgments.length > 0 ? (
                          <section className="portal-judgment" aria-label={`Engineering judgment: ${work.title}`}>
                            <h4>Engineering judgment</h4>
                            <ul>
                              {judgments.map((item) => <li key={item.title}><strong>{item.title}</strong><span>{item.body}</span></li>)}
                            </ul>
                          </section>
                        ) : null}
                        <Link className="portal-read" href={`/blog/${project.slug}`}>Read the full case file <span aria-hidden="true">↗</span></Link>
                      </div>
                      {media ? (
                        <Link className="portal-project__media" href={`/blog/${project.slug}`} aria-label={`Read ${work.title}`}>
                          <Image src={media.src} alt={media.alt} width={media.w} height={media.h} priority={index === 0} sizes={index === 0 ? "(min-width: 60rem) 42vw, 100vw" : "(min-width: 60rem) 30vw, 100vw"} />
                        </Link>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}

          {section === "notes" ? (
            <section aria-labelledby="portal-notes-title">
              <header className="portal-section-head">
                <p className="portal-kicker">Build notes</p>
                <h2 id="portal-notes-title">Decisions worth documenting.</h2>
                <p>I’m Akib, a software engineer at See Change Education in Hong Kong, and a computer science student at City University of Hong Kong.</p>
                <Link className="portal-read" href="/profile">Profile and CV <span aria-hidden="true">↗</span></Link>
              </header>
              <div className="portal-notes">
                {deskNotes.map((note) => (
                  <article key={note.id}>
                    <p className="portal-kicker">{note.date}</p>
                    <h3>{note.title}</h3>
                    {note.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {section === "sketchbook" ? (
            <section aria-labelledby="portal-sketchbook-title">
              <header className="portal-section-head">
                <p className="portal-kicker">Creative work</p>
                <h2 id="portal-sketchbook-title">Four films, drawn in code.</h2>
                <p>Watch the encoded films, or open the original HTML and making-of notes. Nothing plays until you ask.</p>
                <Link className="portal-read" href="/blog/code-drawn">Open the Code Drawn collection <span aria-hidden="true">↗</span></Link>
              </header>
              <FilmShelf />
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}
