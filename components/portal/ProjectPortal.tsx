"use client";

import { useState } from "react";
import { projects, type ProjectId } from "@/lib/content";
import { films } from "@/lib/media";
import { getWork } from "@/lib/work";
import { studioSound } from "@/lib/sound";
import FilmShelf from "./FilmShelf";
import BlogApp from "./BlogApp";
import ProfileApp from "./ProfileApp";
import ProjectApp from "./ProjectApp";
import PhotoboothApp from "./PhotoboothApp";

const entries = projects.flatMap((project) => {
  const work = getWork(project.slug);
  return work ? [{ project, work }] : [];
});

type Section = "home" | "blogs" | "projects" | "project" | "photobooth" | "sketchbook" | "profile";
const destinations: { id: Section; title: string; body: string }[] = [
  { id: "blogs", title: "Blogs", body: "How I reason about systems, make trade-offs and document what shipped." },
  { id: "projects", title: "Projects", body: "Open product walkthroughs, working apps, architecture and verification." },
  { id: "photobooth", title: "Photobooth", body: "A real camera and print flow, with sample and privacy choices intact." },
  { id: "sketchbook", title: "Sketchbook", body: "Four small drawn films, when you want the creative side of the work." },
  { id: "profile", title: "Profile & CV", body: "Experience, education and the engineering record behind this space." },
];

export default function ProjectPortal({ onClose, phone = false }: { onClose: () => void; phone?: boolean }) {
  const [section, setSection] = useState<Section>("home");
  const [projectId, setProjectId] = useState<ProjectId | null>(null);
  const selected = entries.find((entry) => entry.project.id === projectId);

  const navigate = (next: Section) => {
    studioSound.blip("click");
    setSection(next);
    if (next !== "project") setProjectId(null);
  };
  const openProject = (id: ProjectId) => {
    studioSound.blip("open");
    setProjectId(id);
    setSection("project");
  };

  return (
    <div className="project-portal" data-device={phone ? "phone" : "laptop"}>
      <header className="portal-masthead">
        <div>
          <p className="portal-kicker">Akib Arifeen · software / web engineer</p>
          <h1>My <em>workspace</em></h1>
        </div>
        <button type="button" className="portal-close" onClick={onClose} aria-label={`Close the ${phone ? "phone" : "laptop"}`}>
          Close <span aria-hidden="true">×</span>
        </button>
      </header>

      <div className="portal-layout">
        <aside className="portal-rail">
          <nav aria-label="Workspace apps">
            <button type="button" aria-pressed={section === "home"} onClick={() => navigate("home")}>Home</button>
            {destinations.map((destination) => (
              <button
                key={destination.id}
                type="button"
                aria-pressed={section === destination.id || (destination.id === "projects" && section === "project")}
                onClick={() => navigate(destination.id)}
              >
                {destination.title}{destination.id === "sketchbook" ? ` · ${films.length}` : ""}
              </button>
            ))}
          </nav>
          <p>A guided place for my products, writing and the engineering decisions behind them.</p>
        </aside>

        <main className="portal-content workspace-view" key={`${section}-${projectId ?? "all"}`}>
          {section !== "home" ? <button type="button" className="workspace-back" onClick={() => navigate("home")}>← Back to workspace</button> : null}

          {section === "home" ? (
            <section aria-labelledby="workspace-home-title">
              <header className="portal-section-head">
                <p className="portal-kicker">Step into my workspace</p>
                <h2 id="workspace-home-title">I build systems you can use, then sweat how they feel.</h2>
                <p>This is where I keep the working products and the notes behind them. Open an app to see the product itself, the architecture and what I verified—or read the Blog for the longer story.</p>
              </header>
              <div className="workspace-apps">
                {destinations.map((destination) => (
                  <button key={destination.id} type="button" onClick={() => navigate(destination.id)}>
                    <span className="workspace-apps__title">{destination.title}</span>
                    <span className="workspace-apps__body">{destination.body}</span>
                    <span className="workspace-apps__go" aria-hidden="true">Open ↗</span>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {section === "blogs" ? <BlogApp /> : null}

          {section === "projects" ? (
            <section aria-labelledby="workspace-projects-title">
              <header className="portal-section-head">
                <p className="portal-kicker">Projects as working apps</p>
                <h2 id="workspace-projects-title">Open the product, then look under the hood.</h2>
                <p>Each destination opens a walkthrough or the real experience. System boundaries, reliability decisions and evidence stay attached—not hidden in a gallery caption.</p>
              </header>
              <div className="workspace-project-list">
                {entries.map(({ project, work }) => (
                  <button key={project.id} type="button" onClick={() => openProject(project.id)}>
                    <span>
                      <strong>{project.title}</strong>
                      <span>{work.role}</span>
                    </span>
                    <span className="workspace-project-list__meta">{work.status} · Open app ↗</span>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {section === "project" && selected ? (
            selected.project.id === "booth" ? <PhotoboothApp onStepAway={() => navigate("projects")} /> : <ProjectApp project={selected.project} work={selected.work} />
          ) : null}
          {section === "photobooth" ? <PhotoboothApp onStepAway={() => navigate("home")} /> : null}

          {section === "sketchbook" ? (
            <section aria-labelledby="portal-sketchbook-title">
              <header className="portal-section-head">
                <p className="portal-kicker">Creative work</p>
                <h2 id="portal-sketchbook-title">Four films, drawn in code.</h2>
                <p>Watch the encoded films, or open the original HTML and making-of notes. Nothing plays until you ask.</p>
                <a className="portal-read" href="/blog/code-drawn">Open the Code Drawn collection <span aria-hidden="true">↗</span></a>
              </header>
              <FilmShelf />
            </section>
          ) : null}

          {section === "profile" ? <ProfileApp /> : null}
        </main>
      </div>
    </div>
  );
}
