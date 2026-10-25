"use client";

import Link from "next/link";
import { blogEntries } from "@/lib/blog";

export default function BlogApp() {
  const entries = blogEntries();
  return (
    <section aria-labelledby="blog-app-title">
      <header className="portal-section-head">
        <p className="portal-kicker">My Blog</p>
        <h2 id="blog-app-title">What I built, and what I learned making it work.</h2>
        <p>First-person notes from real projects: the system boundaries, implementation decisions, failures and evidence I thought were worth writing down.</p>
      </header>
      <div className="workspace-blog-list">
        {entries.map((entry) => (
          <article key={`${entry.kind}-${entry.slug}`}>
            <p className="portal-kicker">{entry.kicker}</p>
            <h3><Link href={entry.href}>{entry.title}</Link></h3>
            <p>{entry.summary}</p>
            <Link className="portal-read" href={entry.href}>Read the Blog <span aria-hidden="true">↗</span></Link>
          </article>
        ))}
      </div>
    </section>
  );
}
