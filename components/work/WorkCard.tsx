import Link from "next/link";
import type { Work } from "@/lib/work";
import { MediaItem } from "./MediaItem";

export function WorkCard({ work, headingLevel = 2, featured = false }: { work: Work; headingLevel?: 2 | 3; featured?: boolean }) {
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <article className={featured ? "wcard wcard--featured" : "wcard"}>
      <Link href={`/work/${work.slug}`} className="wcard__link">
        <div className="wcard__cover">
          <MediaItem item={{ ...work.cover, caption: undefined }} />
        </div>
        <div className="wcard__body">
          <p className="kicker">{work.kicker}</p>
          <H className="wcard__title">{work.title}</H>
          <p className="wcard__summary">{work.summary}</p>
          <p className="wcard__meta">
            <span className="badge" data-status={work.status}>{work.status}</span>
            {work.outcome ? (
              <span className="wcard__outcome">
                <strong>{work.outcome.value}</strong> {work.outcome.note}
              </span>
            ) : null}
          </p>
        </div>
      </Link>
    </article>
  );
}
