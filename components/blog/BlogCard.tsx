import Link from "next/link";
import type { BlogEntry } from "@/lib/blog";
import { formatPostDate } from "@/lib/posts";
import { MediaItem } from "../work/MediaItem";

/**
 * One card on /blog. A case study keeps the visual card the work index had (cover, status,
 * outcome figure); an essay is set as a note — no screenshot that would claim to be about it,
 * but a panel, a dated kicker and its own cue so it reads as writing of a different kind.
 */
export function BlogCard({ entry, headingLevel = 3, featured = false }: { entry: BlogEntry; headingLevel?: 2 | 3; featured?: boolean }) {
  const H = headingLevel === 2 ? "h2" : "h3";

  if (entry.kind === "essay") {
    return (
      <article className="wcard wcard--note">
        <Link href={entry.href} className="wcard__link">
          <div className="wcard__body">
            <p className="kicker">
              Note
              {entry.date ? <> <span aria-hidden="true">·</span> <time dateTime={entry.date}>{formatPostDate(entry.date)}</time></> : null}
            </p>
            <H className="wcard__title">{entry.title}</H>
            <p className="wcard__summary">{entry.summary}</p>
            <p className="wcard__meta">
              <span className="wcard__more">Read the note <span aria-hidden="true">&rarr;</span></span>
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
