import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { playItems } from "@/lib/os/playground";
import { getWork } from "@/lib/work";
import "../../work.css";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return playItems.filter((p) => p.url).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = playItems.find((p) => p.slug === slug);
  if (!item) return {};
  const title = `${item.name} · Akib Arifeen`;
  return { title: item.name, description: item.blurb, openGraph: { title, description: item.blurb } };
}

export default async function PlayPage({ params }: Props) {
  const { slug } = await params;
  const item = playItems.find((p) => p.slug === slug);
  if (!item || !item.url) notFound();

  return (
    <div className="play">
      <header className="play__bar">
        <Link href="/" className="back">Back to the site</Link>
        <h1 className="play__name">{item.name}</h1>
        <div className="play__actions">
          {item.workSlug && getWork(item.workSlug) ? <Link className="chip" href={`/blog/${item.workSlug}`}>Case study</Link> : null}
          <a className="chip" href={item.url} target="_blank" rel="noreferrer">Open in new tab</a>
        </div>
      </header>
      {item.embeddable ? (
        <iframe className="play__frame" src={item.url} title={item.name} allow={item.allow} />
      ) : (
        <div className="play__card">
          <h2>{item.name}</h2>
          <p>{item.blurb}</p>
          <p>This one cannot be shown inside the site, so it opens in its own tab.</p>
          <a className="chip chip--accent" href={item.url} target="_blank" rel="noreferrer">Open in new tab</a>
        </div>
      )}
    </div>
  );
}
