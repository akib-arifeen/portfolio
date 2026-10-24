import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIES, projectEntries, projectsIn, resolveShow } from "@/lib/projects";
import { MediaGallery } from "@/components/projects/MediaGallery";
import { SiteNav } from "@/components/SiteNav";
import "../work.css";
import "../projects.css";

const DESCRIPTION =
  "Every project in one place: the products, the games and the experiments, each with the status it actually has, plus a gallery of motion work.";

export const metadata: Metadata = {
  title: "Projects",
  description: DESCRIPTION,
  openGraph: { title: "Projects · Akib Arifeen", description: DESCRIPTION },
};

type Props = { searchParams: Promise<{ show?: string }> };

const FILTERS = [
  { id: "all", label: "All" },
  ...CATEGORIES.map((c) => ({ id: c.id as string, label: c.title })),
  { id: "media", label: "Media" },
];

export default async function ProjectsPage({ searchParams }: Props) {
  const { show } = await searchParams;
  const active = resolveShow(show);
  const groups = CATEGORIES.filter((c) => active === "all" || c.id === active);
  const showMedia = active === "all" || active === "media";
  const total = projectEntries().length;

  return (
    <main className="wrap projects">
      <SiteNav current="/projects" />

      <header className="projects__head">
        <p className="kicker">Everything I have built</p>
        <h1 className="projects__h1">Projects</h1>
        <p className="projects__lede">
          {total} projects, each listed once, with the status it actually has rather than the one that would read
          best. Most have a written case study; the games have a slice you can play.
        </p>
      </header>

      <nav className="projects__filters" aria-label="Filter projects by kind">
        {FILTERS.map((f) => (
          <Link
            key={f.id}
            href={f.id === "all" ? "/projects" : `/projects?show=${f.id}`}
            className="chip"
            aria-current={active === f.id ? "true" : undefined}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {groups.map((group) => {
        const entries = projectsIn(group.id);
        return (
          <section key={group.id} className="projects__group" aria-labelledby={`${group.id}-h`}>
            <div className="projects__group-head">
              <h2 id={`${group.id}-h`} className="projects__title">{group.title}</h2>
              <p className="projects__blurb">{group.blurb}</p>
            </div>
            <ul className="pgrid">
              {entries.map((p) => (
                <li key={p.slug} className="pcard">
                  <div className="pcard__head">
                    <h3 className="pcard__name">{p.name}</h3>
                    <span className="badge" data-status={p.status}>{p.status}</span>
                  </div>
                  <p className="pcard__line">{p.line}</p>
                  {p.caseStudy || p.play ? (
                    <p className="links pcard__links">
                      {p.caseStudy ? <Link className="chip" href={p.caseStudy}>Case study</Link> : null}
                      {p.play ? <Link className="chip" href={p.play}>Play it</Link> : null}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {showMedia ? <MediaGallery /> : null}
    </main>
  );
}
