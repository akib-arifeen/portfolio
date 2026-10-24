# Personal Writing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three evidence-backed personal essays under `/writing` without changing existing case-study URLs or content.

**Architecture:** Use a small typed post registry and server-rendered Next.js routes, reusing the existing block renderer and work stylesheet. Keep `/work` unchanged and cross-link only to related public cases and live builds that exist.

**Tech Stack:** Next.js 16.4.1, React 19, TypeScript, Vitest, existing token-based CSS, dsh-verify MCP for browser checks.

**Spec:** `docs/superpowers/specs/2026-10-24-personal-writing-design.md`

## Global Constraints

- Work only on new branch `feat/personal-writing` from local `33451bf`; never stage `.kimi-code/` or unrelated files.
- No merge, production deployment, new dependency, CMS, MDX, RSS, analytics, images, or laptop search/files integration.
- No em dashes, en dashes, emoji, invented feelings, unsupported metrics, private material, or public live links for essays 2 and 3.
- Every essay claim must appear in `docs/writing-ledger.md` with a primary source and qualification.
- Existing 13 `/work/<slug>` and six `/play/<slug>` routes must keep working.
- Use `npx tsc --noEmit && npm test && npm run build` after each task, and run the complete gate after the last task.

## Review Focus

- Worker-authored reflections must not become Akib's voice: each post needs a claim-by-claim ledger checked in Task 3.
- The queue has no queue-specific measurement: Task 3 must not attach the 433-to-99-second metric to it.
- Guest count is a range of 200-300, not an exact 300: Task 3 must not use the rounded number in a title or claim.
- Drafts and unknown slugs must not become public: Tasks 1 and 2 test registry exclusion and runtime 404 behavior.
- Existing work routes and navigation must not regress: Task 2 adds sitemap/nav links only, and Task 4 rechecks all old routes.

---

### Task 1: Post registry and content invariants

**Files:**
- Create: `lib/posts.ts`
- Create: `tests/unit/posts.test.ts`
- Create: `docs/superpowers/specs/2026-10-24-personal-writing-design.md` (already present)
- Create: `docs/superpowers/plans/2026-10-24-personal-writing.md` (this plan)

**Interfaces:**
- Produces: `Post`, `publishedPosts(): Post[]`, `getPost(slug: string): Post | undefined`.
- `Post` fields: `slug`, `title`, `date`, `summary`, `blocks`, `relatedWork`, `liveUrl?`, `draft?`.

- [ ] **Step 1: Create the branch and write failing registry tests**

Run `git switch -c feat/personal-writing`. In `tests/unit/posts.test.ts`, use the existing inline-fixture idiom to assert unique kebab-case slugs, ISO `YYYY-MM-DD` dates, newest-first ordering, draft exclusion, and at least one prose block per post. Import `publishedPosts` and `getPost` from `lib/posts`.

- [ ] **Step 2: Verify the tests fail**

Run `npx vitest run tests/unit/posts.test.ts`. Expected: failure because `lib/posts.ts` and its exports do not exist.

- [ ] **Step 3: Implement the minimal registry**

In `lib/posts.ts`, define the `Post` type, `publishedPosts()` newest first with drafts excluded, and `getPost()` excluding drafts. Reuse `Block` from `lib/work`. Start with the three slugs planned in the design, using placeholder one-paragraph bodies only until Task 3 replaces them.

- [ ] **Step 4: Verify registry tests and typecheck**

Run `npx vitest run tests/unit/posts.test.ts` and `npx tsc --noEmit`. Expected: all new tests and existing typecheck pass.

- [ ] **Step 5: Commit Task 1**

Commit only `lib/posts.ts`, `tests/unit/posts.test.ts`, and the two planning documents with `feat: add personal writing registry`. Do not include placeholder copy in this commit if it can be mistaken for final content; keep it clearly marked as scaffolding.

### Task 2: Writing routes, sitemap, and navigation

**Files:**
- Create: `app/writing/page.tsx`
- Create: `app/writing/[slug]/page.tsx`
- Modify: `app/sitemap.ts`
- Modify: `app/page.tsx`
- Modify: `app/work/page.tsx`
- Test: `tests/unit/posts.test.ts`

**Interfaces:**
- Consumes: `publishedPosts()`, `getPost()`, `Block`, and `getWork()` from Tasks 1 and the existing work registry.
- Produces: `/writing` and `/writing/<slug>` static routes.

- [ ] **Step 1: Add failing route-content tests**

Extend `tests/unit/posts.test.ts` to assert every `relatedWork` resolves through `getWork()`, every `liveUrl` is HTTPS, essays 2 and 3 have no `liveUrl`, and all three planned slugs are present.

- [ ] **Step 2: Verify the tests fail**

Run `npx vitest run tests/unit/posts.test.ts`. Expected: failures for missing `relatedWork` and/or public-link invariants.

- [ ] **Step 3: Implement the routes**

Create the index and dynamic server components. Import `../work.css` in the index and `../../work.css` in the detail route. Use `generateStaticParams`, `generateMetadata`, `notFound()`, a simple date/title/summary header, existing block rendering, and related-work/live links only where present. Do not add inline-link support or media blocks.

- [ ] **Step 4: Append sitemap and navigation entries**

Append published writing URLs in `app/sitemap.ts` without altering old entries. Add one Writing link beside All work in `app/page.tsx` and one in the `/work` navigation. Do not modify laptop search/files or their tests.

- [ ] **Step 5: Verify tests, typecheck, and build**

Run `npx vitest run tests/unit/posts.test.ts`, `npx tsc --noEmit`, and `npm run build`. Expected: all pass and every writing route is statically generated.

- [ ] **Step 6: Commit Task 2**

Commit only the five route/sitemap/nav files plus `lib/posts.ts` and `tests/unit/posts.test.ts` if changed in this task with `feat: add personal writing routes`.

### Task 3: Evidence-led essays and claim ledger

**Files:**
- Modify: `lib/posts.ts`
- Create: `docs/writing-ledger.md`
- Test: `tests/unit/posts.test.ts`

**Interfaces:**
- Consumes: the primary sources listed in the design and the registry contract from Task 1.
- Produces: final copy for `the-room-had-no-bright-pixels`, `the-queue-that-waits-for-ram`, and `when-the-photo-booth-had-to-just-work`.

- [ ] **Step 1: Write the evidence ledger before the copy**

For each post, record every proposed factual/personal claim, exact source path and section, and required qualification. Confirm the SYP LIGHT-005 numbers, queue implementation/decision evidence without a queue metric, and the 200-300 guest range. No live URL for essays 2 and 3.

- [ ] **Step 2: Add failing editorial-invariant tests**

Add tests rejecting em/en dashes and emoji in visible copy, requiring ISO dates, and checking the exact SYP values 0.00%, 2.73%, 76, and 237 only in the SYP post. Assert the queue post contains no `433` or `99 s` metric and the photo-booth post contains `200-300` rather than an exact 300-person title.

- [ ] **Step 3: Verify editorial tests fail**

Run `npx vitest run tests/unit/posts.test.ts`. Expected: placeholder or incomplete copy fails the new assertions.

- [ ] **Step 4: Write the three essays**

Replace scaffolding with approximately 350-550 words per post using first person only where the evidence supports it. Follow one scene, one decision, one consequence. Do not reuse generic `What I learned` sections or create emotions, dialogue, or new metrics. Keep prose readable and personal rather than promotional.

- [ ] **Step 5: Review copy against the ledger and tests**

Run `npx vitest run tests/unit/posts.test.ts` and manually compare every essay claim with `docs/writing-ledger.md`. Expected: all tests pass and no unledgered substantive claim remains.

- [ ] **Step 6: Commit Task 3**

Commit only `lib/posts.ts`, `docs/writing-ledger.md`, and `tests/unit/posts.test.ts` with `feat: publish evidence-led personal essays`.

### Task 4: Full quality and browser verification

**Files:**
- Review only; no product edits unless a verified defect requires a bounded correction.

**Interfaces:**
- Consumes: the completed branch from Tasks 1-3.

- [ ] **Step 1: Run the complete repository gate**

Run `npx tsc --noEmit && npm test && npm run build`. Record exact test count and build result. Run `git diff --check` and confirm `.kimi-code/` remains untracked and no unrelated file changed.

- [ ] **Step 2: Start and exercise the production build**

Start `npm start -- -p 3220` with its PID recorded. Verify `/writing`, all three post pages, unknown slug 404, sitemap, related-work links, and no console errors on desktop and mobile widths using dsh-verify MCP. Stop only that server PID.

- [ ] **Step 3: Check all existing public routes**

Recheck all 13 `/work/<slug>` and six `/play/<slug>` routes for HTTP 200 and no new console errors. Verify no draft route or essay live link exists for essays 2 and 3.

- [ ] **Step 4: Lead review before publication**

Report files changed, commit SHAs, test/build results, browser evidence, ledger exceptions, and remaining risks. Do not push, open a PR, merge, or deploy until the Lead has reviewed the actual diff and browser evidence.
