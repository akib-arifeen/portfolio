import Link from "next/link";

/** The only primary destinations. Work and writing live under Blog, the CV under Profile. */
export const PRIMARY_NAV = [
  { href: "/blog", label: "Blog" },
  { href: "/projects", label: "Projects" },
  { href: "/profile", label: "Profile" },
] as const;

export type NavHref = (typeof PRIMARY_NAV)[number]["href"];

type SiteNavProps = {
  /** "#top" keeps the wordmark an in-page jump on the studio; every other page sends it home. */
  wordmarkHref?: string;
  /** The destination this page owns, so it can mark itself. */
  current?: NavHref;
  /** Utility controls, right of the links: today only the studio's sound toggle. */
  children?: React.ReactNode;
};

const wordmark = (
  <>
    <span className="wordmark__full">Akib Arifeen</span>
    <span className="wordmark__short">Akib</span>
  </>
);

export function SiteNav({ wordmarkHref = "/", current, children }: SiteNavProps) {
  return (
    <header className="nav">
      <div className="nav__pill">
        {wordmarkHref.startsWith("#") ? (
          <a className="wordmark" href={wordmarkHref}>{wordmark}</a>
        ) : (
          <Link className="wordmark" href={wordmarkHref}>{wordmark}</Link>
        )}
        <nav className="nav__links" aria-label="Primary">
          {PRIMARY_NAV.map((item) => (
            <Link
              key={item.href}
              className="nav__link"
              href={item.href}
              aria-current={current === item.href ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        {children ? <div className="nav__actions">{children}</div> : null}
      </div>
    </header>
  );
}
