# Design system · Akib Arifeen portfolio

This file records the design system as it is already built, so that new pages extend it
instead of inventing a second one. `tokens.css` is the machine-readable source: where this
document and `tokens.css` disagree, `tokens.css` wins and this document is wrong.

Everything below describes the site as shipped, not an aspiration.

## 1. Genre and macrostructure

- **Genre:** atmospheric. The page is a room you stand in, not a document you scroll.
- **Macrostructure:** Workbench. The home page is a desk: a laptop you can open, a booth you
  can walk up to, papers on the surface. Content pages are the desk's flat output — cards laid
  out, read straight.
- **Enrichment:** one custom enrichment, the interactive 3D room (React Three Fiber) plus the
  DOM photobooth inside a native `<dialog>`. The enrichment stays on the home page. It is not
  repeated on content pages, which are deliberately quiet so the room remains the one loud thing.
- **Brief:** a late-night workbench, a warm lamp against blue-grey, quiet.

New pages must not add a second enrichment. The room is home-only; blog, projects and profile
are typographic surfaces that borrow the same tokens.

## 2. Theme

Custom theme, dark, cool paper with one warm accent. Axes: dark / grotesk-sans / warm.

| Token | Value | Role |
|---|---|---|
| `--color-paper` | `oklch(17% 0.014 255)` | page ground |
| `--color-paper-2` | `oklch(20% 0.016 255)` | raised surface: cards, panels |
| `--color-paper-3` | `oklch(24% 0.018 255)` | innermost surface: code, wells |
| `--color-ink` | `oklch(94% 0.010 75)` | headings, primary text |
| `--color-ink-2` | `oklch(80% 0.012 255)` | body text |
| `--color-muted` | `oklch(72% 0.018 255)` | kickers, metadata, captions |
| `--color-rule` | `oklch(31% 0.018 255)` | hairlines that must be seen |
| `--color-rule-2` | `oklch(26% 0.016 255)` | hairlines that must only be felt |
| `--color-accent` | `oklch(72% 0.14 48)` | the lamp: accent text, links, marks |
| `--color-accent-ink` | `oklch(97% 0.01 75)` | text on an accent fill |
| `--color-accent-strong` | `oklch(52% 0.15 48)` | accent fill that must carry cream text (4.90:1) |
| `--color-focus` | `oklch(79% 0.18 48)` | focus ring |
| `--color-scrim` / `--color-backdrop` | `oklch(8% 0.012 255 / 0.4)` / `oklch(11% 0.012 255 / 0.82)` | dialog scrim |

Two palettes live beside the page palette and are not interchangeable with it:

- **The print** (`--color-print-*`): a cream card, warm regardless of page theme. Only the booth
  print and print-like surfaces use it.
- **akibOS** (`--os-*`): the laptop layer's own macOS-like chrome, light and dark, with the shell
  setting `data-appearance` on `.os`. Values are owned by the chrome layer; names are the contract.

Rules:

- The accent is a lamp, not a highlighter. One accent element per view is the budget; a card grid
  of accent chips is over budget.
- `--color-accent` on `--color-paper` is for text at large or semibold sizes. Cream text on
  amber must use `--color-accent-strong` as the fill.
- Never hardcode a hex, `rgb()`, or `oklch()` literal in a page or component. Add a token or use
  one. `tokens.css` is the only file allowed to hold raw colour values.

## 3. Type

Loaded through `next/font/google` in `app/layout.tsx`:

| Family | CSS var | Role |
|---|---|---|
| Geist | `--font-display`, `--font-body` | display and body. Grotesk, roman, unromantic |
| Fraunces | `--font-accent` | statement footer, print, booth artwork. Nowhere else |
| Geist Mono | `--font-outlier` | kickers, labels, code, terminal, figures |

Fraunces is a deliberate constraint: it appears only where the site is pretending to be paper
(footer statement, the printed card, the booth sign). Using it for a page heading would break the
room's illusion.

Scale: major third on a 16px base.

```
--text-sm      0.8125rem   labels, captions, kickers
--text-base    1rem        body
--text-md      1.25rem     lead paragraphs, card summaries
--text-lg      1.5625rem   grouped section labels
--text-xl      1.9531rem   section and card titles
--text-display clamp(2.6rem, 2.2vw + 1.7rem, 4.6rem)   page titles: hero and content pages
```

- Display line-height `1.04`; body `1.6`.
- Kickers are `--text-sm` in Geist with `0.04em` letter-spacing, colour `--color-muted`. They are
  set in sentence case, not shouted in caps or mono.
- `--text-display` is the page title size, on the home hero and on a content page's `h1` alike;
  it clamps, so a 320px screen gets 2.6rem rather than 4.6rem. Section headings step down to
  `--text-xl`. Do not scale a section heading up to fill a gap; let the gutter do that work.

## 4. Space, radius, rules

4pt scale: `--space-2xs .25` · `--space-xs .5` · `--space-sm .75` · `--space-md 1` ·
`--space-lg 1.5` · `--space-xl 2.5` · `--space-2xl 4` · `--space-3xl 6` · `--space-4xl 9rem`.
Page gutter is `--gutter: clamp(1.25rem, 4vw, 3.5rem)`.

Radius: `--radius-sm 6px` (chips, inputs), `--radius-md 12px` (cards), `--radius-lg 18px`
(dialogs, the booth). Nothing is fully rounded except the nav pill and status dots.

Hairlines: `--rule-hair 1px`, `--rule-thick 2px`. Section dividers are hairlines; the only 2px
rules are active states.

Layers: `--z-base 0` · `--z-raised 10` · `--z-panel 20` · `--z-nav 30`. A dialog sits above nav.

## 5. Motion

```
--ease-out    cubic-bezier(0.16, 1, 0.3, 1)     entrances, expansions, anything into place
--ease-in     cubic-bezier(0.7, 0, 0.84, 0)     exits only
--ease-in-out cubic-bezier(0.65, 0, 0.35, 1)    state flips that stay on screen
--dur-micro   120ms    hover, focus, chip state
--dur-short   220ms    disclosure, card lift, nav
--dur-long    420ms    dialog, page-level transitions
```

Idioms in use:

- **Camera glide.** The 3D room moves the camera; the page never scrolls itself to fake depth.
- **Lift.** Cards raise by a token shadow on hover and return with `--ease-out`.
- **Disclosure.** Anything that opens (expander, timeline entry) animates height and opacity over
  `--dur-short` with `--ease-out`; the exit uses `--ease-in` and is shorter.
- **No scroll-jacking, no parallax, no autoplaying video with sound.**

Reduced motion is a hard requirement, not a nicety:

```css
@media (prefers-reduced-motion: reduce) { /* transitions → none, transforms → none */ }
```

Under reduced motion every disclosure must be readable in its static form: content visible or
reachable without animation, no information carried only by movement, and video never required
to understand a page. The site already honours this in the room, the booth and the nav; new pages
must extend the same rule rather than restate it.

## 6. Navigation and footer

- **Nav — N5, floating pill.** A small pill fixed near the top: wordmark on the left, links on the
  right, `--z-nav`, translucent paper with a hairline. Primary destinations on every page are
  **Blog · Projects · Profile**, in that order. Studio-specific controls (the sound toggle) may sit
  in the same pill as a utility, visually separated from the three links. The CV lives under
  Profile, not in the nav.
- **Footer — Ft5, statement, home only.** A large Fraunces statement line, then a quiet row of
  links and the letter-style sign-off. It stays on `/`; content pages end with their own close —
  `/blog` with the "Work with me" CTA, `/profile` with the contact links, `/projects` with the
  media gallery.

The nav is one component; a page does not draw its own, it renders the shared one. The letter
footer is markup on the home page, not a component content pages mount.

## 7. Page structure

Existing pages stay as they are. New pages follow these shapes.

### `/` home — unchanged in structure

Hero (name, one-line position, the two entry links), the desk, the room, the playable booth,
the proof band, the writing strip. Nothing about this page is redesigned by the content work;
only its outbound links change to the canonical URLs.

### `/blog` — the merged index

The strongest of the two old presentations, not a compromise between them.

1. Kicker and `h1`: what this is (case studies and essays about the work).
2. A short lede in `--text-md`.
3. **Selected stories**: the two live case studies as visual cards with cover media, title,
   summary, status badge and outcome figure — the presentation `/work` already had.
4. **Notes and essays**: the three essays as note panels — dated kicker, accent rule, a
   "Read the note" cue and no borrowed screenshot. They sit third, not last.
5. **More project stories**: every remaining case study in the same visual card grid.
6. Email CTA with a `Profile and CV` link. The CV download itself lives on `/profile`; the blog
   points at the person rather than dropping a PDF from a page about the work.

Two selected cases open the feed, the essays follow them, and the rest of the catalogue closes it.
The essays are evidence of how the work was made, so they belong in the feed rather than after it.

### `/blog/[slug]` — cases and essays in one template

Cases keep `case__head` / `case__blocks` / `case__foot` exactly as built: kicker, `h1`, summary,
then prose, code, media, steps, decisions and facts blocks. Essays reuse the same block renderer
with a date kicker. The foot block carries related work and any live link. Both kinds end with a
back link to `/blog`.

### `/projects` — the catalog

Every project once, nothing invented.

1. Kicker and `h1`.
2. Filter row: plain links to `/projects?show=all|products|games|experiments`, rendered from the
   URL so they work without JavaScript, with `aria-current="true"` on the active filter and a real
   `aria-label` on the group. Page navigation — the nav links, the crumb — marks itself with
   `aria-current="page"`; the filter row is a set of options, so it says `"true"`. No
   `<div role="tab">` theatre, no client state for filtering.
3. Grouped lists: **Products**, **Games**, **Experiments**, each a grid of compact cards carrying
   name, one line, honest status, and a link out (case study, playable slice, or repo — whichever
   genuinely exists).
4. **Creative media** as its own section, separated by a rule: the curated Studio pieces and the
   drawing films. This is a gallery, not a product grid — posters, then explicit play.

Status vocabulary is fixed and honest: `shipped`, `in production`, `in progress`, `prototype`,
`concept`, `retired`. No "coming soon", no invented metrics.

### `/profile` — the person, factually

1. Kicker, `h1`, and a two-sentence position statement.
2. **Experience**: an expandable timeline. Each entry is a `<button aria-expanded>` controlling a
   region with `aria-controls`; the summary line (role, organisation, dates) is always visible and
   the detail expands beneath it. Under `prefers-reduced-motion` the expansion is instant, and
   every region is reachable and readable; nothing depends on the animation to be legible.
3. **Education**, **Skills** — grouped lists, no ratings, no percentages.
4. **CV**: `View CV` opens the PDF in a new tab; `Download CV` saves it. Both point at the existing
   `/akib-arifeen-cv.pdf`. The PDF is unchanged by this work.
5. Contact links: email, LinkedIn, GitHub.

Facts come from the CV and the site's existing copy. Nothing is rounded up, no title is inflated,
no date is guessed.

## 8. Voice

- First person, plain, specific. "I built", "I cut", "it broke here".
- Numbers only when they are real and already in the content (`200 to 300 guests`, `32-lesson
  course`, `150 GB`).
- No superlatives about myself, no "passionate", no "crafting delightful experiences".
- Kickers set the frame; headings state the thing.
- CTA voice: an invitation to write, with the email address shown in full. `Download CV` is a
  plain, honest label.

## 9. Content model

- `lib/work.ts` — case studies. `Work` with slug, title, kicker, summary, role, when, team, stack,
  status, outcome, links, cover media, blocks, optional play slug, related, draft.
- `lib/posts.ts` — essays. `Post` with slug, title, date, summary, blocks, related work, optional
  live URL. Blocks reuse the `lib/work` block types.
- `lib/blog.ts` — the union of both, tagged `kind: "case" | "essay"`, each with a canonical
  `/blog/<slug>` href. It is a view over the two sources, not a third copy of the content.
- `lib/projects.ts` — the catalog: one entry per project, a category, a status, and links that
  only include destinations that exist.
- `lib/profile.ts` — timeline and skills, transcribed from the CV and existing site copy.
- `lib/media.ts` — the curated gallery: file paths, dimensions, duration, poster, and credit for
  each piece.

Case study content is written once, in `lib/cases/*`. There is no second implementation of a
case study for the blog.

## 10. Accessibility floor

- The targets this work owns are at least 44×44 CSS px including padding on a coarse pointer,
  from 320px up: the wordmark, the nav links, the icon buttons and the short footer links are
  widened for touch by CSS alone. It is not a claim about every target on the site — fine-pointer
  nav keeps its 36px height, and the pre-existing home strip links (32px) and studio tool buttons
  (36px) are unchanged.
- Focus is visible: `--color-focus` ring, never `outline: none` without a replacement.
- Landmarks: one `h1` per page, `main`, `nav` with an accessible name, `footer`.
- Video: `controls`, `preload="none"`, a poster, and an `aria-label` naming the piece. Never
  autoplay with sound; nothing that requires a mouse to reach.
- Embedded film frames: `iframe` with `sandbox="allow-scripts"`, a `title`, and `loading="lazy"`;
  mounted only after an explicit click, never on page load.
- Status is never colour-only: the status badge carries its word.
- Text contrast: body on paper is at least 4.5:1; the accent-fill rule in §2 exists to keep it so.

## 11. Media rules

- Files are served from this site. No hotlinking, no third-party player, no credentials in a URL.
- Video is H.264 MP4 with `-movflags +faststart`, square-safe, and small enough to load on a phone.
- Posters are real frames from the piece, not stock images.
- Originals are preserved outside the build; the copies under `public/` are optimised derivatives
  with descriptive names.
- Credits for collaborators appear with the work they made.

## 12. Exports and exclusions

Exported by this system:

- `tokens.css` — the token layer, unchanged by the content work.
- `app/globals.css`, `app/work.css`, `app/projects.css`, `app/profile.css` — page styles. New
  page CSS only adds what the page needs; shared card, badge and block classes come from
  `work.css`. `/blog` reuses `work.css` as it stands and adds no stylesheet of its own.
- `components/SiteNav.tsx` — the one nav.
- `components/work/*` — card, media, block renderers, reused by the blog.

Excluded on purpose:

- No component library, no CSS framework, no animation library for page transitions.
- No new dependency for the timeline, the filters or the gallery. Native elements first.
- No second theme, no light mode for the page (akibOS keeps its own appearance switch).
