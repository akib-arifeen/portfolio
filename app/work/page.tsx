import type { Metadata } from "next";
import Link from "next/link";
import { allWorks, type Work } from "@/lib/work";
import { contact } from "@/lib/content";
import { WorkCard } from "@/components/work/WorkCard";
import "../work.css";

export const metadata: Metadata = {
  title: "Work",
  description: "Case studies of things I built end to end: the ask, the decisions, the code and the result.",
  openGraph: { title: "Work · Akib Arifeen", description: "Case studies of things I built end to end: the ask, the decisions, the code and the result." },
};

const LIVE: Work["status"][] = ["shipped", "in production"];

export default function WorkIndex() {
  const works = allWorks();
  const live = works.filter((w) => LIVE.includes(w.status));
  const rest = works.filter((w) => !LIVE.includes(w.status));
  return (
    <main className="wrap work">
      <nav className="work__nav" aria-label="Site">
        <Link href="/" className="back">Back to the studio</Link>
      </nav>
      <header className="work__head">
        <p className="kicker">Case studies</p>
        <h1 className="work__h1">Work</h1>
        <p className="work__lede">Things I built end to end, with the ask, the decisions I made and the code that mattered.</p>
      </header>
      <section className="wgroup" aria-labelledby="live-h">
        <h2 id="live-h" className="wgroup__title">Shipped and in production</h2>
        <div className="wlist">
          {live.map((w, i) => (
            <WorkCard key={w.slug} work={w} headingLevel={3} featured={i < 2} />
          ))}
        </div>
      </section>
      {rest.length > 0 ? (
        <section className="wgroup" aria-labelledby="rest-h">
          <h2 id="rest-h" className="wgroup__title">In progress and concepts</h2>
          <div className="wlist">
            {rest.map((w) => (
              <WorkCard key={w.slug} work={w} headingLevel={3} />
            ))}
          </div>
        </section>
      ) : null}
      <section className="cta work__cta" aria-labelledby="cta-h">
        <h2 id="cta-h" className="cta__title">Work with me</h2>
        <p>I like owning a product from the first vague ask to the thing people use. If you have one, write to me.</p>
        <p className="links">
          <a className="chip chip--accent" href={`mailto:${contact.email}`}>{contact.email}</a>
          <a className="chip" href={contact.cv} download>Download my CV</a>
        </p>
      </section>
    </main>
  );
}
