# Forgiato Wheels Gallery — Design Spec
**Date:** 2026-04-27
**Project:** Forgiato Authorized Dealer Store (New Next.js Site)

---

## Overview

A wheels showcase section for an authorized Forgiato dealer store. Wheel data and images are scraped live from forgiato.com and served through a Next.js API route with in-memory caching. Users can filter wheels by series/collection and click any wheel to open a "Request a Quote" form.

---

## Architecture

### Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Scraping:** Cheerio + Axios
- **Image handling:** Next.js Image component with remote pattern config

### Project Structure

```
/app
  page.tsx                  ← Home page, renders WheelsGallery
  api/
    wheels/
      route.ts              ← GET /api/wheels — scrapes & caches forgiato.com
    quote/
      route.ts              ← POST /api/quote — receives quote form submissions
/components
  WheelsGallery.tsx         ← Fetches /api/wheels, manages filter + modal state
  WheelCard.tsx             ← Displays wheel image, name, series, CTA button
  FilterBar.tsx             ← Series pill-button filters
  QuoteModal.tsx            ← Quote request form modal
/lib
  scraper.ts                ← Scraping logic + in-memory cache (5-min TTL)
next.config.js              ← Remote image pattern: forgiato.com
```

---

## Data Flow

1. `page.tsx` renders `<WheelsGallery />`
2. `WheelsGallery` calls `GET /api/wheels` on mount
3. `/api/wheels` checks in-memory cache (5-min TTL)
   - Cache hit → returns cached data immediately
   - Cache miss → scrapes `https://forgiato.com/wheels` with Cheerio, parses wheels, stores in cache, returns data
4. Each wheel object has: `{ name, series, imageUrl, slug }`
5. `WheelsGallery` holds filter state; `FilterBar` updates it; filtered list renders in the grid
6. User clicks "Get a Quote" on a `WheelCard` → `QuoteModal` opens with wheel name pre-filled
7. User submits form → `POST /api/quote` (logs submission; ready for email integration)

---

## Components

### WheelsGallery
- Fetches wheel data from `/api/wheels` on mount
- Holds state: `wheels[]`, `activeSeries`, `selectedWheel` (for modal)
- Renders `<FilterBar>` + responsive grid of `<WheelCard>`
- Passes `onQuoteClick` handler to each card

### WheelCard
- Props: `name`, `series`, `imageUrl`, `onQuoteClick`
- Layout: image (top, full width), name, series badge, "Get a Quote" button
- Uses Next.js `<Image>` for optimized loading

### FilterBar
- Props: `series[]` (unique list), `activeSeries`, `onChange`
- Renders "All" pill + one pill per series
- Active pill highlighted; clicking filters the grid client-side (no re-fetch)

### QuoteModal
- Props: `wheel` (name + imageUrl), `onClose`
- Fields: Full Name, Email, Phone, Message (all required except Message)
- On submit: POST to `/api/quote`, show success message, close modal
- Closes on backdrop click or X button

---

## API Routes

### GET /api/wheels
- Checks module-level cache: `{ data, fetchedAt }`
- If `Date.now() - fetchedAt > 5 * 60 * 1000` → re-scrape
- Scrapes `https://forgiato.com/wheels` with Axios + Cheerio
- Extracts per wheel: name, series, image src, slug
- Returns `{ wheels: WheelData[] }`
- On scrape failure: returns cached data if available, else 500

### POST /api/quote
- Body: `{ wheelName, name, email, phone, message }`
- Validates required fields (wheelName, name, email, phone)
- Logs submission to console
- Returns `{ success: true }`
- Ready for future email integration (e.g. Resend, SendGrid)

---

## Styling

- Tailwind CSS utility classes throughout
- Dark background to match Forgiato's brand aesthetic (black/dark gray)
- Wheel cards: dark card with subtle border, hover scale effect
- Filter pills: outlined default, filled on active
- Modal: centered overlay with backdrop blur

---

## Image Handling

- `next.config.js` adds `forgiato.com` as an allowed remote image hostname
- `WheelCard` uses `<Image src={imageUrl} />` for automatic optimization and lazy loading
- No images are stored locally — always served from forgiato.com via Next.js image optimization

---

## Out of Scope

- User authentication / dealer login
- Shopping cart or pricing
- Inventory management
- Email delivery for quote form (stub only — logs to console)
- SEO / metadata optimization
