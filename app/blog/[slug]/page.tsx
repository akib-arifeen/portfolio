import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { blogEntries, getBlogItem } from "@/lib/blog";
import { formatPostDate } from "@/lib/posts";
import type { Post } from "@/lib/posts";
import type { Work } from "@/lib/work";
import { contact } from "@/lib/content";
import { Block } from "@/components/work/Block";
import { MediaItem } from "@/components/work/MediaItem";
import { BlogCard } from "@/components/blog/BlogCard";
import { SiteNav } from "@/components/SiteNav";
import "../../work.css";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return blogEntries().map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = getBlogItem(slug);
  if (!item) return {};
  const [title, summary] = item.kind === "case" ? [item.work.title, item.work.summary] : [item.post.title, item.post.summary];
  return { title, description: summary, openGraph: { title: `${title} · Akib Arifeen`, description: summary }, alternates: { canonical: `/blog/${slug}` } };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const item = getBlogItem(slug);
  if (!item) notFound();
  return item.kind === "case" ? <CaseArticle work={item.work} /> : <EssayArticle post={item.post} />;
}

/** A case study, kept as it was on /work: the ask, the decisions, the code, the result. */
function CaseArticle({ work }: { work: Work }) {
  const cases = blogEntries().filter((c) => c.kind === "case");
  const i = cases.findIndex((c) => c.slug === work.slug);
  const prev = i > 0 ? cases[i - 1] : undefined;
  const next = i < cases.length - 1 ? cases[i + 1] : undefined;
  const related = (work.related ?? [])
    .map((s) => cases.find((c) => c.slug === s))
    .filter((c): c is NonNullable<typeof c> => !!c);

  return (
    <main className="wrap work">
      <SiteNav current="/blog" />

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
              {related.map((c) => (
                <BlogCard key={c.slug} entry={c} headingLevel={3} />
              ))}
            </div>
          </section>
        ) : null}

        <nav className="pn" aria-label="More Blogs">
          {prev ? (
            <Link href={prev.href} className="pn__a" rel="prev"><span className="pn__dir">Previous</span><span className="pn__t">{prev.title}</span></Link>
          ) : <span />}
          {next ? (
            <Link href={next.href} className="pn__a pn__a--next" rel="next"><span className="pn__dir">Next</span><span className="pn__t">{next.title}</span></Link>
          ) : <span />}
        </nav>

        <Cta />
      </footer>
    </main>
  );
}

/** An essay: no cover, no metadata table, just the date and the argument. */
function EssayArticle({ post }: { post: Post }) {
  const relatedWork = blogEntries().find((e) => e.kind === "case" && e.slug === post.relatedWork);

  return (
    <main className="wrap work">
      <SiteNav current="/blog" />

      <header className="case__head">
        <p className="kicker"><time dateTime={post.date}>{formatPostDate(post.date)}</time></p>
        <h1 className="case__h1">{post.title}</h1>
        <p className="case__summary">{post.summary}</p>
      </header>

      <div className="case__blocks">
        {post.blocks.map((b, n) => (
          <Block key={n} block={b} />
        ))}
      </div>

      <footer className="case__foot">
        <section aria-labelledby="related-h">
          <h2 id="related-h" className="block__title">Related work</h2>
          <p className="links">
            {relatedWork ? <Link className="chip" href={relatedWork.href}>{relatedWork.title}</Link> : null}
            {post.liveUrl ? <a className="chip" href={post.liveUrl} target="_blank" rel="noreferrer">Live build</a> : null}
          </p>
        </section>
        <Cta />
      </footer>
    </main>
  );
}

function Cta() {
  return (
    <section className="cta" aria-labelledby="cta-h">
      <h2 id="cta-h" className="cta__title">Work with me</h2>
      <p>I like owning a product from the first vague ask to the thing people use. If you have one, write to me.</p>
      <p className="links">
        <a className="chip chip--accent" href={`mailto:${contact.email}`}>{contact.email}</a>
        <a className="chip" href={contact.cv} download>Download my CV</a>
      </p>
    </section>
  );
}
