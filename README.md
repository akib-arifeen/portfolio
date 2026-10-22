# Akib Arifeen, portfolio

My portfolio site. It opens on a small 3D studio room you can look around. In the room there is a photobooth that can restyle your photo with a real image model, and a laptop you can open. The laptop is a small desktop of its own, with windows, a dock, a terminal, search and a browser. Behind the room there are case studies for the things I built end to end.

I am Akib Arifeen, a software engineer in Hong Kong at See Change Education (Asia Allied Group), and a computer science student at City University of Hong Kong.

## What is in here

- **The 3D studio.** A React Three Fiber room with a desk, a monitor loop and a character. Click a spot to read about a project.
- **The photobooth.** A 3D booth and a screen UI. It sends your photo to an image model through `app/api/booth/route.ts`. There is a free mock mode that spends nothing.
- **The laptop layer.** A desktop-style shell (windows, dock, menu bar, search, terminal, notes, photos, a small browser and a playground). On a phone it becomes a full screen app launcher.
- **Case studies.** One page per project under `/work/<slug>`, written from my own work record. Media lives in `public/work`.

## Stack

Versions are pinned in `package.json`.

| Piece | Version |
|---|---|
| Next.js (App Router, Turbopack) | 16.4.1 |
| React and React DOM | 19.3.1 |
| three | 0.186.1 |
| @react-three/fiber | 9.8.2 |
| @react-three/drei | 10.7.9 |
| motion | 13.5.1 |
| shiki | 4.4.3 |
| TypeScript | ^5.9.0 |
| vitest | 4.1.11 |

Fonts are Fraunces, Geist and Geist Mono through `next/font/google`.

## Run it

```bash
npm install
cp .env.example .env.local
npm run dev
```

Then open http://localhost:3000.

Environment, see `.env.example`:

- `BOOTH_MOCK=1` is the free test mode for local use; set it in `.env.local` (`.env.example` leaves it empty). The booth returns your own photo after a short delay and spends no credits.
- `KIE_API_KEY` is your own kie.ai key. It is needed for real photobooth runs, with `BOOTH_MOCK` unset or not `1`.
- `KIE_IMAGE_MODEL` picks the image model. The default is `gpt-image-2-5-flare-image-to-image`.

With neither set, as in production now, the booth says the AI is resting and prints the photo as it is.

Before setting `KIE_API_KEY` in production: the daily limit lives in memory per server instance, so move it to a shared store (Upstash or Redis), add a global daily cap, and set a spend cap on the kie.ai account.

Never commit `.env.local`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | `vitest run` (unit tests in `tests/unit`) |

## Project structure

```
app/            routes, layout, metadata, sitemap, robots, social image, icons
  work/         case study index and /work/[slug]
  play/         /play/[slug] pages for games that run inside the site
  api/booth/    photobooth endpoint
components/
  studio/       the 3D room
  booth/        the photobooth screen
  desk/         the laptop entry point
  os/           the laptop shell: windows, dock, menu bar, apps
  work/         case study blocks
lib/            content, case study data (lib/cases), laptop logic (lib/os)
public/         CV, studio loop, work media, desk photos
tests/unit/     vitest tests for the laptop logic
tokens.css      design tokens, the only place colours are defined
```

## Performance and accessibility

- Performance: Lighthouse scores, Core Web Vitals and bundle sizes are to be measured on the final build. I have not published any numbers yet.
- The 3D room is meant to load after the page content and sit behind a client-only boundary. Whether this holds on a throttled device is to be measured.
- Accessibility intent: visible `:focus-visible` rings, labels on icon-only buttons, 44 px minimum touch targets on the phone layer, and reduced motion limited to opacity changes. A full audit with a screen reader and keyboard pass is to be measured and recorded.

## Credits

Libraries, fonts and media are listed in [CREDITS.md](./CREDITS.md).

## Not affiliated with Apple

The laptop layer is a desktop-style interface I drew myself. It uses my own icons, my own wallpaper and my own "a" monogram. It is not affiliated with, endorsed by or sponsored by Apple Inc.
