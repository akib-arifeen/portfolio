import type { Metadata } from "next";
import Link from "next/link";
import { caseEntries, essayEntries } from "@/lib/blog";
import type { Work } from "@/lib/work";
import { contact } from "@/lib/content";
import { BlogCard } from "@/components/blog/BlogCard";
import { SiteNav } from "@/components/SiteNav";
import "../work.css";

const DESCRIPTION =
  "Case studies and essays about the work: the ask, the decisions I made, the code that mattered and what came of it.";

export const metadata: Metadata = {
  title: "Blog",
  description: DESCRIPTION,
  openGraph: { title: "Blog · Akib Arifeen", description: DESCRIPTION },
};

const LIVE: Work["status"][] = ["shipped", "in production"];

export default function BlogIndex() {
  const cases = caseEntries();
  const live = cases.filter((c) => c.status && LIVE.includes(c.status));
  const rest = cases.filter((c) => !c.status || !LIVE.includes(c.status));
  const essays = essayEntries();

  return (
    <main className="wrap work">
      <SiteNav current="/blog" />

      <header className="work__head">
        <p className="kicker">Case studies and essays</p>
        <h1 className="work__h1">Blog</h1>
        <p className="work__lede">{DESCRIPTION}</p>
      </header>

      <section className="wgroup" aria-labelledby="live-h">
        <h2 id="live-h" className="wgroup__title">Shipped and in production</h2>
        <div className="wlist">
          {live.map((c, i) => (
            <BlogCard key={c.slug} entry={c} headingLevel={3} featured={i < 2} />
          ))}
        </div>
      </section>

      {rest.length > 0 ? (
        <section className="wgroup" aria-labelledby="rest-h">
          <h2 id="rest-h" className="wgroup__title">In progress and concepts</h2>
          <div className="wlist">
            {rest.map((c) => (
              <BlogCard key={c.slug} entry={c} headingLevel={3} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="wgroup" aria-labelledby="essays-h">
        <h2 id="essays-h" className="wgroup__title">Essays</h2>
        <div className="wlist wlist--essays">
          {essays.map((e) => (
            <BlogCard key={e.slug} entry={e} headingLevel={3} />
          ))}
        </div>
      </section>

      <section className="cta work__cta" aria-labelledby="cta-h">
        <h2 id="cta-h" className="cta__title">Work with me</h2>
        <p>I like owning a product from the first vague ask to the thing people use. If you have one, write to me.</p>
        <p className="links">
          <a className="chip chip--accent" href={`mailto:${contact.email}`}>{contact.email}</a>
          <Link className="chip" href="/profile">Profile and CV</Link>
        </p>
      </section>
    </main>
  );
}
