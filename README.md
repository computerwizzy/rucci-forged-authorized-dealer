# Rucci Forged — Authorized Dealer Catalog

Quote-only catalog of Rucci Forged wheels for Wheels Below Retail, built from the
Forgiato dealer site (same stack: Next.js app router, Tailwind, Vercel).

## How it works
- `npm run fetch` pulls all wheels from rucciwheels.com's public WooCommerce Store API
  (name, style categories, finishes, center-cap options, images) into `src/data/wheels.json`
  and downloads the images to `public/wheels/`.
- `npm run upload` pushes those images to Cloudinary (folder `rucci/wheels`) and rewrites
  the JSON with CDN URLs. `public/wheels/` is git-ignored; production serves Cloudinary.
- The gallery filters by style (5 spoke, Directional, Mesh…). Tapping a wheel opens the
  detail modal; "Get a Quote" opens the quote form.
- `POST /api/quote` writes the request to the shared Google Sheet (Apps Script web app,
  payload carries `sheet: "Rucci"` so it lands in the Rucci tab) and sends two Podium SMS:
  one to the dealer line, one confirmation to the customer. No prices anywhere: Rucci
  wheels are built to order and priced per quote.

## Env (`.env.local`, same values as the Forgiato site)
`GOOGLE_SHEETS_URL`, `SHEETS_SECRET`, `CLOUDINARY_*`, `PODIUM_*`.

## Dev
```
npm run dev      # http://localhost:3008
npm test
npm run build
```
