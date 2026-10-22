"use client"; // error boundaries must be Client Components

/** A route crashed: show a calm page in the site's style, with a way back. The root layout (fonts, tokens) is still in place here. */
export default function Error({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main
      style={{
        minHeight: "100svh", display: "grid", placeContent: "center", justifyItems: "start", gap: "var(--space-md)",
        padding: "var(--gutter)", background: "var(--color-paper)", color: "var(--color-ink)",
      }}
    >
      <p style={{ fontFamily: "var(--font-outlier)", fontSize: "var(--text-sm)", color: "var(--color-muted)" }}>Something broke</p>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", lineHeight: "var(--leading-display)", maxWidth: "16ch" }}>
        That one is on me, not you.
      </h1>
      <p style={{ color: "var(--color-ink-2)", maxWidth: "38ch" }}>
        The page tripped while loading. Try again, or head back to the start and look around from there.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-xs)" }}>
        <button
          type="button"
          className="chip"
          onClick={() => retry()}
          style={{ background: "var(--color-accent-strong)", borderColor: "var(--color-accent-strong)", color: "var(--color-accent-ink)" }}
        >
          Try again
        </button>
        <a className="chip" href="/">Back to the start</a>
      </div>
    </main>
  );
}
