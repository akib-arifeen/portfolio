import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { allWorks, getWork } from "@/lib/work";
import { contact } from "@/lib/content";
import { Block } from "@/components/work/Block";
import { MediaItem } from "@/components/work/MediaItem";
import { WorkCard } from "@/components/work/WorkCard";
import "../../work.css";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return allWorks().map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const work = getWork(slug);
  if (!work) return {};
  const title = `${work.title} · Akib Arifeen`;
  return { title: work.title, description: work.summary, openGraph: { title, description: work.summary } };
}

export default async function WorkPage({ params }: Props) {
  const { slug } = await params;
  const work = getWork(slug);
  if (!work) notFound();

  const all = allWorks();
  const i = all.findIndex((w) => w.slug === slug);
  const prev = i > 0 ? all[i - 1] : undefined;
  const next = i < all.length - 1 ? all[i + 1] : undefined;
  const related = (work.related ?? []).map((s) => getWork(s)).filter((w): w is NonNullable<typeof w> => !!w);

  return (
    <main className="wrap work">
      <nav className="work__nav" aria-label="Case study">
        <Link href="/work" className="back">All work</Link>
      </nav>

      <header className="case__head">
        <p className="kicker">{work.kicker}</p>
        <h1 className="case__h1">{work.title}</h1>
        <p className="case__summary">{work.summary}</p>
        <dl className="meta">
          <div><dt>Role</dt><dd>{work.role}</dd></div>
          <div><dt>When</dt><dd>{work.when}</dd></div>
          {work.team ? <div><dt>Team</dt><dd>{work.team}</dd></div> : null}
          <div><dt>Status</dt><dd><span className="badge" data-status={work.status}>{work.status}</span></dd></div>
          <div className="meta__wide">
            <dt>Stack</dt>
            <dd>
              <ul className="tags">
                {work.stack.map((s) => (
                  <li key={s} className="case-tag">{s}</li>
                ))}
              </ul>
            </dd>
          </div>
        </dl>
        {work.links.length > 0 || work.playSlug ? (
          <p className="links">
            {work.playSlug ? <Link className="chip chip--accent" href={`/play/${work.playSlug}`}>Play it</Link> : null}
            {work.links.map((l) =>
              /^https?:/.test(l.href) ? (
                <a key={l.href} className="chip" href={l.href} target="_blank" rel="noreferrer">{l.label}</a>
              ) : (
                <Link key={l.href} className="chip" href={l.href}>{l.label}</Link>
              ),
            )}
          </p>
        ) : null}
      </header>

      <div className="case__cover">
        <MediaItem item={work.cover} priority />
      </div>

      <div className="case__blocks">
        {work.blocks.map((b, n) => (
          <Block key={n} block={b} />
        ))}
      </div>

      <footer className="case__foot">
        {related.length > 0 ? (
          <section aria-labelledby="related-h">
            <h2 id="related-h" className="block__title">Related work</h2>
            <div className="wlist wlist--grid">
              {related.map((w) => (
                <WorkCard key={w.slug} work={w} headingLevel={3} />
              ))}
            </div>
          </section>
        ) : null}

        <nav className="pn" aria-label="More case studies">
          {prev ? (
            <Link href={`/work/${prev.slug}`} className="pn__a" rel="prev"><span className="pn__dir">Previous</span><span className="pn__t">{prev.title}</span></Link>
          ) : <span />}
          {next ? (
            <Link href={`/work/${next.slug}`} className="pn__a pn__a--next" rel="next"><span className="pn__dir">Next</span><span className="pn__t">{next.title}</span></Link>
          ) : <span />}
        </nav>

        <section className="cta" aria-labelledby="cta-h">
          <h2 id="cta-h" className="cta__title">Work with me</h2>
          <p>I like owning a product from the first vague ask to the thing people use. If you have one, write to me.</p>
          <p className="links">
            <a className="chip chip--accent" href={`mailto:${contact.email}`}>{contact.email}</a>
            <a className="chip" href={contact.cv} download>Download my CV</a>
          </p>
        </section>
      </footer>
    </main>
  );
}
