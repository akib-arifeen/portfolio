import { codeToHtml } from "shiki";
import type { Block } from "@/lib/work";
import { CopyButton } from "./CopyButton";
import { MediaItem } from "./MediaItem";

type Of<K extends Block["kind"]> = Extract<Block, { kind: K }>;

function Head({ text }: { text?: string }) {
  return text ? <h2 className="block__title">{text}</h2> : null;
}

export function ProseBlock({ block }: { block: Of<"prose"> }) {
  return (
    <section className="block block--prose">
      <Head text={block.heading} />
      <div className="prose">
        {block.paras.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </section>
  );
}

export async function CodeBlock({ block }: { block: Of<"code"> }) {
  // Highlighted at build time. Dual themes emit --shiki-light / --shiki-dark variables that work.css maps to colour.
  const html = await codeToHtml(block.code, {
    lang: block.lang,
    themes: { light: "github-light-high-contrast", dark: "github-dark" },
    defaultColor: false,
  });
  return (
    <section className="block block--code">
      <Head text={block.heading} />
      <figure className="code">
        <div className="code__bar">
          <span className="code__source">Source: {block.source}</span>
          <CopyButton text={block.code} />
        </div>
        <div className="code__body" tabIndex={0} role="region" aria-label={`Code: ${block.source}`} dangerouslySetInnerHTML={{ __html: html }} />
        <figcaption className="code__cap">{block.caption}</figcaption>
      </figure>
    </section>
  );
}

export function MediaBlock({ block }: { block: Of<"media"> }) {
  return (
    <section className="block block--media">
      <Head text={block.heading} />
      <div className="media-grid" data-count={block.items.length}>
        {block.items.map((m, i) => (
          <MediaItem key={i} item={m} />
        ))}
      </div>
    </section>
  );
}

export function StepsBlock({ block }: { block: Of<"steps"> }) {
  return (
    <section className="block block--steps">
      <Head text={block.heading} />
      <ol className="steps">
        {block.items.map((s, i) => (
          <li key={i} className="steps__item">
            <h3 className="steps__title">{s.title}</h3>
            <p>{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function DecisionsBlock({ block }: { block: Of<"decisions"> }) {
  return (
    <section className="block block--decisions">
      <Head text={block.heading} />
      <div className="decisions">
        {block.items.map((d, i) => (
          <article key={i} className="decision">
            <h3 className="decision__choice">{d.choice}</h3>
            <dl>
              <dt>Why</dt>
              <dd>{d.why}</dd>
              <dt>Cost</dt>
              <dd>{d.cost}</dd>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

export function FactsBlock({ block }: { block: Of<"facts"> }) {
  return (
    <section className="block block--facts">
      <Head text={block.heading} />
      <dl className="facts">
        {block.items.map((f, i) => (
          <div key={i} className="fact">
            <dt className="fact__label">{f.label}</dt>
            <dd className="fact__value">{f.value}</dd>
            {f.note ? <dd className="fact__note">{f.note}</dd> : null}
          </div>
        ))}
      </dl>
    </section>
  );
}
