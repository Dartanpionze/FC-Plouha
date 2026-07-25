# Football Club Plouha — Les Falaises

Official website for Football Club Plouha "Les Falaises", an amateur football
club in Plouha, Côtes-d'Armor (Brittany, France). The site presents the club,
its news, teams, match calendar, photo gallery, sponsors, and a contact form.

## Tech stack

- [TanStack Start](https://tanstack.com/start) (React 19, file-based routing via TanStack Router)
- Vite 7
- Tailwind CSS 4
- Netlify Forms for the contact form
- Deployed on Netlify

## Project structure

- `src/routes/` — one file per page (`index.tsx` is the home page; `__root.tsx` is the shared layout)
- `src/components/` — `Navbar`, `Footer`, `ClubCrest` (SVG badge), `PhotoTile` (illustrative placeholder imagery), `SectionHeading`
- `src/data/club.ts` — all club content (club info, news, teams, matches, gallery captions, sponsors)
- `public/contact-form.html` — static skeleton required for Netlify to detect the contact form at build time

## Running locally

```bash
npm install
npm run dev
```

The dev server runs on port 3000 (proxied through the Netlify CLI on 8888 when using `netlify dev`).

```bash
npm run build    # production build
```

Note: Netlify Forms submissions only work once deployed to Netlify — they are not captured in local dev.
