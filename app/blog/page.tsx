import type { Metadata } from "next";
import Link from "next/link";
import { caseEntries, essayEntries } from "@/lib/blog";
import type { Work } from "@/lib/work";
import { contact } from "@/lib/content";
import { BlogCard } from "@/components/blog/BlogCard";
import { SiteNav } from "@/components/SiteNav";
import "../work.css";
import "../blog.css";

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
  // Two stories open the page and the notes come straight after them, so the essays are part of the
  // feed rather than a tail. Everything else is one catalogue below, shipped first.
  const featured = live.slice(0, 2);
  const stories = cases.filter((c) => !featured.includes(c));
  const essays = essayEntries();

  return (
    <main className="wrap work">
      <SiteNav current="/blog" />

      <header className="work__head">
        <p className="kicker">Case studies and essays</p>
        <h1 className="work__h1">Blog</h1>
        <p className="work__lede">{DESCRIPTION}</p>
      </header>

      <section className="wgroup" aria-labelledby="selected-h">
        <h2 id="selected-h" className="wgroup__title">Selected stories</h2>
        <div className="wlist">
          {featured.map((c) => (
            <BlogCard key={c.slug} entry={c} headingLevel={3} featured />
          ))}
        </div>
      </section>

      <section className="wgroup" aria-labelledby="notes-h">
        <div className="wgroup__head">
          <h2 id="notes-h" className="wgroup__title">Notes and essays</h2>
          <p className="wgroup__lede">
            Three shorter pieces from inside the builds: a room with no daylight, a queue waiting for RAM, and
            the night the booth had to work.
          </p>
        </div>
        <div className="wlist wlist--grid">
          {essays.map((e) => (
            <BlogCard key={e.slug} entry={e} headingLevel={3} />
          ))}
        </div>
      </section>

      <section className="wgroup" aria-labelledby="stories-h">
        <div className="wgroup__head">
          <h2 id="stories-h" className="wgroup__title">More project stories</h2>
          <p className="wgroup__lede">
            The rest of the catalogue: the work that is live first, then what is still in progress or a concept.
          </p>
        </div>
        <div className="wlist wlist--grid">
          {stories.map((c) => (
            <BlogCard key={c.slug} entry={c} headingLevel={3} />
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
