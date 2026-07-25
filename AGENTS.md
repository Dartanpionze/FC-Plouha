# AGENTS.md

Overview of this codebase for developers and AI agents.

## Project

Marketing/informational website for Football Club Plouha "Les Falaises", a
French amateur football club. Built with TanStack Start and deployed on
Netlify.

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | TanStack Start |
| Frontend | React 19, TanStack Router v1 (file-based routing) |
| Build | Vite 7 |
| Styling | Tailwind CSS 4 (utility classes + a handful of CSS custom properties for the club's colors) |
| Forms | Netlify Forms (contact page) |
| Language | TypeScript 5.9 (strict mode) |
| Deployment | Netlify |

## Directory Structure

```
├── public
│   └── contact-form.html   # Static skeleton so Netlify detects the contact form at build time (never rendered to users)
├── src
│   ├── components
│   │   ├── Navbar.tsx          # Sticky top navigation, mobile menu
│   │   ├── Footer.tsx          # Site footer with contact info and links
│   │   ├── ClubCrest.tsx       # Inline SVG club badge
│   │   ├── PhotoTile.tsx       # Illustrative gradient "photo" placeholder tile (no external image dependency)
│   │   └── SectionHeading.tsx  # Eyebrow + heading pattern reused across pages
│   ├── data
│   │   └── club.ts   # All club content: club info, news, teams, matches, gallery captions, sponsors
│   ├── routes
│   │   ├── __root.tsx      # Root layout: Navbar + Footer wrap every page
│   │   ├── index.tsx       # Home page: hero, presentation, news/teams/calendar/gallery/sponsors previews
│   │   ├── club.tsx        # Club history, timeline, values, board (bureau)
│   │   ├── actualites.tsx  # Full news list
│   │   ├── equipes.tsx     # All teams
│   │   ├── calendrier.tsx  # Upcoming fixtures + recent results
│   │   ├── galerie.tsx     # Filterable photo gallery
│   │   ├── partenaires.tsx # Sponsors by tier (Or / Argent / Bronze)
│   │   └── contact.tsx     # Contact form (Netlify Forms) + club location/hours
│   ├── router.tsx    # Router instance from generated route tree
│   └── styles.css    # Tailwind import, Google Fonts, CSS custom properties for club colors
├── netlify.toml
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Conventions

- All page copy is in French; routes are named with French slugs (`/equipes`, `/calendrier`, etc.).
- Club content (news, teams, matches, gallery, sponsors) lives entirely in `src/data/club.ts` — edit that file to update site content rather than hardcoding text in route components.
- There are no photographic assets. `PhotoTile` renders stylized gradient placeholders (club colors + a subtle pitch-mark SVG) instead of external image URLs, so the site never depends on third-party image hosting. Replace with real photos by swapping `PhotoTile` usages for `<img>` tags once photography is available.
- Color palette (navy blue, yellow, red) is defined as CSS custom properties in `src/styles.css` (`--club-navy`, `--club-yellow`, `--club-red`, etc.) — use those variables rather than hardcoded hex values in new components.
- Display headings use the "Anton" font (`font-display`/`h1`-`h3`), body/labels use "Barlow" and "Barlow Condensed" (`font-condensed`).
- Import paths use the `@/` alias for `src/*`.

## Contact form

The contact form on `/contact` submits via Netlify Forms (AJAX, `application/x-www-form-urlencoded`, posted to `/contact-form.html`). If you add or rename a field in `src/routes/contact.tsx`, you must mirror the change in `public/contact-form.html` or Netlify will reject the submission at build-time detection. Form submissions only work on a deployed site, not in local dev.

## Development Commands

```bash
npm install
npm run dev      # Start dev server (port 3000)
npm run build    # Production build
```
