import Image from "next/image";
import Link from "next/link";
import { projects } from "@/lib/content";
import { allWorks, type Work } from "@/lib/work";
import HoverVideo from "./HoverVideo";

function Cover({ work }: { work: Work }) {
  const c = work.cover;
  if (c.kind === "video") return <HoverVideo src={c.src} poster={c.poster} w={c.w} h={c.h} />;
  if (c.kind === "image") {
    return (
      <Image
        className="hcard__media"
        src={c.src}
        alt={c.alt}
        width={c.w}
        height={c.h}
        sizes="(min-width: 60rem) 50vw, 100vw"
        unoptimized={c.src.endsWith(".svg")}
      />
    );
  }
  return null; // an embed is never a cover on the home page
}

function Card({ work, large }: { work: Work; large: boolean }) {
  // The hero's "Read more" scrolls to #work-<projectId>, so the card carries that id when a project maps to it.
  const project = projects.find((p) => p.slug === work.slug);
  return (
    <li
      className={large ? "hcard hcard--lg" : "hcard hcard--sm"}
      id={project ? `work-${project.id}` : undefined}
      data-hover-play
      data-reveal
    >
      <div className="hcard__cover"><Cover work={work} /></div>
      <div className="hcard__body">
        <p className="hcard__kicker">
          <span>{work.kicker}</span>
          <span className="hbadge">{work.status}</span>
        </p>
        <h3 className="hcard__title">
          <Link className="hcard__link" href={`/work/${work.slug}`}>{work.title}</Link>
        </h3>
        <p className="hcard__summary">{work.summary}</p>
        {work.outcome ? (
          <p className="hcard__outcome">
            <strong>{work.outcome.value}</strong>
            <span>{work.outcome.note}</span>
          </p>
        ) : null}
        {large ? <span className="hcard__cta" aria-hidden="true">Read the case study &rarr;</span> : null}
      </div>
    </li>
  );
}

// The two statuses that mean the thing is live and usable. The rest (prototypes, in progress, concepts) are
// listed on /work so the home grid never mixes "you can open this" with "this is being built".
const LIVE: Work["status"][] = ["shipped", "in production"];

export default function WorkGrid() {
  const works = allWorks().filter((w) => LIVE.includes(w.status)); // "All work" carries the rest
  return (
    <ol className="hgrid">
      {works.map((w, i) => <Card key={w.slug} work={w} large={i < 2} />)}
    </ol>
  );
}
