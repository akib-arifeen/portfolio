# Personal Writing Section Design

## Intent

Add a small set of natural, personal, technically honest essays to the portfolio. The writing should sound like Akib describing real work and decisions, not like a sequence of recruiter case-study templates or invented emotional reflections.

Readers should understand what happened, why a decision mattered, and what resulted, then follow a link to the related case study or public live build.

## Goals

- Add `/writing` as a dated collection of three initial essays.
- Ground every substantive claim in an inspectable source: `WORK_RECORD.md`, project reports, source code, Git history, measurements, or direct words from Akib.
- Use one scene, one decision, and one consequence as the editorial shape of each post.
- Preserve every existing `/work/<slug>` and `/play/<slug>` URL and all current case content.
- Cross-link essays to their related case study and public live project where one exists.
- Keep implementation consistent with the existing TypeScript/Next.js content model and token-based styling.

## Non-goals and anti-goals

- No wholesale rewrite of `/work`, redirects, a CMS, MDX dependency, comments, accounts, analytics, or RSS in the first pass.
- No invented feelings, dialogue, late-night scenes, motivations, client claims, or personal lessons.
- No private repository links, confidential screenshots, student IDs, unapproved company details, or photography whose rights are unresolved.
- No fake timestamps or daily publishing cadence.
- No second collection of case studies with generic `What I learned` paragraphs.
- No media blocks or new image assets in the first pass, so no photography rights or credit changes are introduced.

## Approaches considered

### Parallel `/writing` collection — proposed

Keep `/work` as the reference library and add a separate essay type, index, and detail routes. This has the smallest URL and regression risk and gives the writing a different editorial contract.

Trade-off: two content collections need editorial discipline so they do not repeat each other.

### Essays inside `/work`

Resolve both cases and essays in the existing detail route. Fewer routes but mixed semantics and more coupling to work search, sitemap, and the laptop layer.

### Replace `/work` with `/writing`

Make essays canonical and permanently redirect the old routes. Cleanest only if the case-study label itself is unwanted, but the largest diff and unnecessary SEO risk.

## Content contract

Each essay has a slug, title, ISO date, short summary, prose body blocks, related work slug, and an optional public live link. No new rich-text dependency is needed. Inline body links are out of scope; related links have a dedicated field.

Every first-person statement must be at least one of:

- an observed event tied to a dated artifact;
- a decision with the alternative and engineering consequence;
- a measured result with a source;
- a direct quote or explicitly confirmed paraphrase from Akib.

If a feeling or lesson is not sourced, cut it. Existing case modules are drafts, not evidence of Akib's feelings. Re-anchor technical claims to primary records and do not reuse worker-authored reflective sections as Akib's words.

Keep an internal `docs/writing-ledger.md` with each post's claims, source paths, and qualification notes. The Lead reviews it before the PR; Akib approves the final public wording before production.

## Initial posts and evidence

### The room had no bright pixels

- Sources: `SYP/DECISIONS.md` LIGHT-005 (around lines 2026-2032), `lib/cases/save-your-princess.ts`, SYP project reports, and the current public live build.
- Arc: the visual problem, `col = ramp(N·L) * albedo`, the 4% reflectance choice, measured change from 0.00% to 2.73% of pixels above 200 and p99 from 76 to 237, and what remains unproven on a real phone.
- Constraint: commit `33451bf` is only the portfolio refresh, not evidence of the rendering change. Describe the rendering evidence, not a claim that the game is finished or emotionally effective.

### The queue that waits for RAM

- Sources: `cv/WORK_RECORD.md` §3.1 and the actual compare-and-swap queue and memory-gate implementation evidence; `lib/cases/video-studio.ts` is a draft index, not proof of personal motivation.
- Arc: concurrent render jobs exhausting the machine, the queue and memory-gate decision, and the trade-off between latency and reliability.
- Constraint: there is no recorded queue-specific measurement. Present this as a decision and consequence, not a quantified win. Do not attach the unrelated 433-second to 99-second render metric to the queue claim. No public live link; link only to the case study.

### When the photo booth had to just work

- Sources: `cv/WORK_RECORD.md` §3.2 and §7, plus the local print-agent and browser design evidence; `lib/cases/photobooth.ts` is a draft index.
- Arc: a public event with real hardware and network constraints, the local print-agent/browser design, and the operational choices that made it usable.
- Constraint: the recorded range is 200-300 guests, not a precise 300-person claim. No private photos, names, credentials, internal-tool screenshots, unsupported reliability claims, or public live link; link only to the case study.

## Implementation shape

- `lib/posts.ts`: post type, ordered registry, `publishedPosts()` sorted newest first, and `getPost()` excluding drafts.
- `app/writing/page.tsx`: title and chronological post index.
- `app/writing/[slug]/page.tsx`: static params, metadata, not-found behavior, simple date/title/summary header, body blocks, and related-work links. Keep it a server component because the code-block renderer is async.
- `app/sitemap.ts`: append published writing URLs without changing existing entries or adding `lastModified` only to writing.
- Home/navigation: one visible Writing link beside the existing All work link, plus a Writing link from `/work`. Do not add posts to laptop search/files in the first pass.
- Styling: import `../work.css` for `.prose`, `.block`, `.code`, and `.media-grid`; use tokens from `app/tokens.css` for any new declaration. No new colors or visual theme.

## Verification

- Unit tests for unique kebab-case slugs, ISO dates, newest-first ordering, draft exclusion with an inline fixture, every related-work slug resolving through `getWork()`, and at least one prose block per post.
- `docs/writing-ledger.md` review for every number and personal claim; unresolved claims are removed or explicitly qualified. No unsupported queue metric or precise guest count.
- `npx tsc --noEmit && npm test && npm run build`.
- Start the production build and exercise `/writing` and all three post pages on desktop and mobile widths.
- Recheck all 13 existing `/work/<slug>` routes and six `/play/<slug>` routes: no regressions or broken links.
- Check sitemap, unknown-slug 404, related-work links, console errors, line length, and contrast using the installed dsh-verify MCP. No runtime draft-404 case is required because no draft post is planned.
- Visible copy follows the existing no-em-dash, no-en-dash, no-emoji convention.

## Merge and deployment boundary

Create `feat/personal-writing` from the current local `33451bf` content, not from stale local `main`. PR #3 is merged, but this local HEAD is the clean preserved base. No merge to `main`, production deployment, or publication without explicit user approval.
