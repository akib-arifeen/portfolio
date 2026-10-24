import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPostDate, getPost, publishedPosts } from "@/lib/posts";
import { getWork } from "@/lib/work";
import { Block } from "@/components/work/Block";
import "../../work.css";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return publishedPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  const title = `${post.title} · Akib Arifeen`;
  return { title: post.title, description: post.summary, openGraph: { title, description: post.summary } };
}

export default async function WritingPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const related = getWork(post.relatedWork);

  return (
    <main className="wrap work">
      <nav className="work__nav" aria-label="Writing">
        <Link href="/writing" className="back">All writing</Link>
      </nav>

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
            {related ? <Link className="chip" href={`/work/${related.slug}`}>{related.title}</Link> : null}
            {post.liveUrl ? <a className="chip" href={post.liveUrl} target="_blank" rel="noreferrer">Live build</a> : null}
          </p>
        </section>
      </footer>
    </main>
  );
}
