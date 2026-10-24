import Link from "next/link";
import type { BlogEntry } from "@/lib/blog";
import { formatPostDate } from "@/lib/posts";
import { MediaItem } from "../work/MediaItem";

/**
 * One card on /blog. A case study keeps the visual card the work index had (cover, status,
 * outcome figure); an essay is text only, because an essay has no screenshot that means anything.
 */
export function BlogCard({ entry, headingLevel = 3, featured = false }: { entry: BlogEntry; headingLevel?: 2 | 3; featured?: boolean }) {
  const H = headingLevel === 2 ? "h2" : "h3";

  if (entry.kind === "essay") {
    return (
      <article className="wcard">
        <Link href={entry.href} className="wcard__link">
          <div className="wcard__body">
            <H className="wcard__title">{entry.title}</H>
            <p className="wcard__summary">{entry.summary}</p>
            <p className="wcard__meta">
              {entry.date ? <time dateTime={entry.date}>{formatPostDate(entry.date)}</time> : null}
            </p>
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article className={featured ? "wcard wcard--featured" : "wcard"}>
      <Link href={entry.href} className="wcard__link">
        {entry.cover ? (
          <div className="wcard__cover">
            <MediaItem item={{ ...entry.cover, caption: undefined }} />
          </div>
        ) : null}
        <div className="wcard__body">
          <p className="kicker">{entry.kicker}</p>
          <H className="wcard__title">{entry.title}</H>
          <p className="wcard__summary">{entry.summary}</p>
          <p className="wcard__meta">
            {entry.status ? <span className="badge" data-status={entry.status}>{entry.status}</span> : null}
            {entry.outcome ? (
              <span className="wcard__outcome">
                <strong>{entry.outcome.value}</strong> {entry.outcome.note}
              </span>
            ) : null}
          </p>
        </div>
      </Link>
    </article>
  );
}
