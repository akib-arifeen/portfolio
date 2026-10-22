"use client"; // error boundaries must be Client Components

import "../tokens.css";

/** The root layout itself crashed, so this page brings its own <html>, <body> and fonts (system ones: the font loader lives in the layout that failed). */
export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const button = {
    font: "inherit", fontSize: "0.9rem", padding: "0.55rem 1.1rem", borderRadius: "999px", cursor: "pointer",
    border: "1px solid var(--color-rule)", background: "transparent", color: "var(--color-ink)", textDecoration: "none",
  } as const;
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "var(--color-paper)", color: "var(--color-ink)", fontFamily: "system-ui, sans-serif", lineHeight: 1.6 }}>
        <main style={{ minHeight: "100svh", display: "grid", placeContent: "center", justifyItems: "start", gap: "1rem", padding: "clamp(1.25rem, 4vw, 3.5rem)" }}>
          <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 500, fontSize: "clamp(1.6rem, 4vw, 2.2rem)", lineHeight: 1.1, maxWidth: "16ch", margin: 0 }}>
            That one is on me, not you.
          </h1>
          <p style={{ color: "var(--color-ink-2)", maxWidth: "38ch", margin: 0 }}>
            The site tripped while loading. Try again, or head back to the start.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={() => retry()}
              style={{ ...button, background: "var(--color-accent-strong)", borderColor: "var(--color-accent-strong)", color: "var(--color-accent-ink)" }}
            >
              Try again
            </button>
            <a href="/" style={button}>Back to the start</a>
          </div>
        </main>
      </body>
    </html>
  );
}
