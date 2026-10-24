import type { Metadata } from "next";
import Link from "next/link";
import { formatPostDate, publishedPosts } from "@/lib/posts";
import "../work.css";

const DESCRIPTION = "Essays about the work: the ask, the decision that mattered and what came of it.";

export const metadata: Metadata = {
  title: "Writing",
  description: DESCRIPTION,
  openGraph: { title: "Writing · Akib Arifeen", description: DESCRIPTION },
};

export default function WritingIndex() {
  const posts = publishedPosts();
  return (
    <main className="wrap work">
      <nav className="work__nav" aria-label="Site">
        <Link href="/work" className="back">All work</Link>
      </nav>
      <header className="work__head">
        <p className="kicker">Notes from the work</p>
        <h1 className="work__h1">Writing</h1>
        <p className="work__lede">{DESCRIPTION}</p>
      </header>
      <section className="wgroup" aria-labelledby="posts-h">
        <h2 id="posts-h" className="wgroup__title">Essays</h2>
        <div className="wlist wlist--essays">
          {posts.map((p) => (
            <article key={p.slug} className="wcard">
              <Link href={`/writing/${p.slug}`} className="wcard__link">
                <div className="wcard__body">
                  <h3 className="wcard__title">{p.title}</h3>
                  <p className="wcard__summary">{p.summary}</p>
                  <p className="wcard__meta">
                    <time dateTime={p.date}>{formatPostDate(p.date)}</time>
                  </p>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
