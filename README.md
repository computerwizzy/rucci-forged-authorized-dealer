# Rucci Forged — Authorized Dealer Catalog

Quote-only catalog of Rucci Forged wheels for Wheels Below Retail, built from the
Forgiato dealer site (same stack: Next.js app router, Tailwind, Vercel).

## How it works
- `npm run fetch` pulls all wheels from rucciwheels.com's public WooCommerce Store API
  (name, style categories, finishes, center-cap options, images) into `src/data/wheels.json`
  and downloads the images to `public/wheels/`.
- The same run then reads Rucci's public media library (`wp/v2/media`). Product records
  carry one photo each, but the library holds finish renders named like
  `ace20big20cap2024k20gold20brush20_web.png` (a lost `%20` between words) and
  `Trapstar-Copper-Red-ChromeBarrel.png`, plus car photos named
  `CHEVROLET_IMPALA_RUCCI_HASHASH_1.jpg`. They are matched to wheels by name and become
  `detail.variants` (finish + center cap) and `detail.vehicles`. Last run: 431 renders on
  211 wheels (71 with two or more finishes), 24 car photos.
- `npm run upload` pushes those images to Cloudinary (folder `rucci/wheels`) and rewrites
  the JSON with CDN URLs. `public/wheels/` is git-ignored; production serves Cloudinary.
- The gallery filters by style (5 spoke, 10 spoke, Mesh…). Tapping a wheel opens the
  detail modal with a finish picker (and a large/small cap toggle where Rucci rendered
  both); "Get a Quote" opens the quote form pre-filled with the finish being viewed.
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
