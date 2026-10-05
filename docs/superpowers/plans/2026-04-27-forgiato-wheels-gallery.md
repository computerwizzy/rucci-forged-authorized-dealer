# Forgiato Wheels Gallery — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js 14 dealer store with a filterable Forgiato wheel gallery that scrapes forgiato.com, caches results server-side, and shows a "Request a Quote" modal on wheel click.

**Architecture:** A Next.js API route scrapes forgiato.com/wheels with Axios + Cheerio, caches results in a module-level variable (5-min TTL), and serves them to the gallery page. The gallery filters wheels client-side by series, and opens a quote modal pre-filled with the selected wheel.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Axios, Cheerio, Jest, React Testing Library

---

## File Map

| File | Responsibility |
|------|----------------|
| `next.config.js` | Allow forgiato.com as remote image hostname |
| `src/types/index.ts` | Shared TypeScript types (Wheel, QuoteFormData) |
| `src/lib/scraper.ts` | Scrape + cache wheel data from forgiato.com |
| `src/app/api/wheels/route.ts` | GET /api/wheels — returns wheel list |
| `src/app/api/quote/route.ts` | POST /api/quote — logs quote submission |
| `src/components/WheelCard.tsx` | Single wheel card (image, name, series, CTA) |
| `src/components/FilterBar.tsx` | Series filter pill buttons |
| `src/components/QuoteModal.tsx` | Quote request form modal |
| `src/components/WheelsGallery.tsx` | Fetch + filter + modal orchestrator |
| `src/app/page.tsx` | Home page — renders WheelsGallery |
| `jest.config.ts` | Jest + Next.js test configuration |
| `jest.setup.ts` | jest-dom matchers setup |
| `src/__tests__/scraper.test.ts` | Scraper unit tests |
| `src/__tests__/wheels-route.test.ts` | GET /api/wheels tests |
| `src/__tests__/quote-route.test.ts` | POST /api/quote tests |
| `src/__tests__/WheelCard.test.tsx` | WheelCard component tests |
| `src/__tests__/FilterBar.test.tsx` | FilterBar component tests |
| `src/__tests__/QuoteModal.test.tsx` | QuoteModal component tests |
| `src/__tests__/WheelsGallery.test.tsx` | WheelsGallery integration tests |

---

### Task 1: Scaffold Next.js project

**Files:**
- Create: `package.json` (via create-next-app)
- Create: `next.config.js` (via create-next-app)
- Create: `src/app/page.tsx` (via create-next-app)

- [ ] **Step 1: Scaffold the project**

Run inside `c:/Users/DELL-i7/Downloads/Forgiato-new-site`:

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

If prompted interactively: TypeScript → Yes, ESLint → Yes, Tailwind → Yes, `src/` directory → Yes, App Router → Yes, import alias → `@/*`

- [ ] **Step 2: Verify scaffold**

```bash
ls src/app
```

Expected output includes: `globals.css  layout.tsx  page.tsx`

- [ ] **Step 3: Commit**

```bash
git init && git add . && git commit -m "chore: scaffold Next.js 14 project"
```

---

### Task 2: Install dependencies + configure image hosting

**Files:**
- Modify: `package.json`
- Modify: `next.config.js`

- [ ] **Step 1: Install scraping and test dependencies**

```bash
npm install axios cheerio
npm install --save-dev jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/jest
```

- [ ] **Step 2: Replace next.config.js**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'forgiato.com', pathname: '/**' },
      { protocol: 'https', hostname: '*.forgiato.com', pathname: '/**' },
    ],
  },
};

module.exports = nextConfig;
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json next.config.js
git commit -m "chore: install axios, cheerio, testing deps; configure remote images"
```

---

### Task 3: Configure Jest

**Files:**
- Create: `jest.config.ts`
- Create: `jest.setup.ts`
- Modify: `package.json`

- [ ] **Step 1: Create jest.config.ts**

```typescript
import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};

export default createJestConfig(config);
```

- [ ] **Step 2: Create jest.setup.ts**

```typescript
import '@testing-library/jest-dom';
```

- [ ] **Step 3: Add test scripts to package.json**

In `package.json` `"scripts"` section add:

```json
"test": "jest",
"test:watch": "jest --watch"
```

- [ ] **Step 4: Verify Jest works**

```bash
npm test -- --passWithNoTests
```

Expected: exits with no errors, `Test Suites: 0 passed`

- [ ] **Step 5: Commit**

```bash
git add jest.config.ts jest.setup.ts package.json
git commit -m "chore: configure jest with next/jest and testing-library"
```

---

### Task 4: Create shared types

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: Create src/types/index.ts**

```typescript
export interface Wheel {
  name: string;
  series: string;
  imageUrl: string;
  slug: string;
}

export interface QuoteFormData {
  wheelName: string;
  name: string;
  email: string;
  phone: string;
  message: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "chore: add shared Wheel and QuoteFormData types"
```

---

### Task 5: Implement scraper with cache

**Files:**
- Create: `src/lib/scraper.ts`
- Create: `src/__tests__/scraper.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/scraper.test.ts`:

```typescript
import axios from 'axios';
import { getWheels, clearCache } from '@/lib/scraper';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const MOCK_HTML = `
<html><body>
  <div class="wheel-card">
    <a href="/wheels/d-uno">
      <img src="/images/d-uno.jpg" alt="D'Uno">
      <h3 class="wheel-title">D'Uno</h3>
      <span class="wheel-series">Classics</span>
    </a>
  </div>
  <div class="wheel-card">
    <a href="/wheels/d-due">
      <img src="https://forgiato.com/images/d-due.jpg" alt="D'Due">
      <h3 class="wheel-title">D'Due</h3>
      <span class="wheel-series">Flow Forged</span>
    </a>
  </div>
</body></html>
`;

beforeEach(() => {
  clearCache();
  mockedAxios.get.mockResolvedValue({ data: MOCK_HTML });
});

afterEach(() => jest.clearAllMocks());

test('returns parsed wheels from HTML', async () => {
  const wheels = await getWheels();
  expect(wheels).toHaveLength(2);
  expect(wheels[0]).toEqual({
    name: "D'Uno",
    series: 'Classics',
    imageUrl: 'https://forgiato.com/images/d-uno.jpg',
    slug: 'd-uno',
  });
  expect(wheels[1]).toEqual({
    name: "D'Due",
    series: 'Flow Forged',
    imageUrl: 'https://forgiato.com/images/d-due.jpg',
    slug: 'd-due',
  });
});

test('caches results and does not re-fetch within TTL', async () => {
  await getWheels();
  await getWheels();
  expect(mockedAxios.get).toHaveBeenCalledTimes(1);
});

test('clearCache forces a fresh fetch on next call', async () => {
  await getWheels();
  clearCache();
  await getWheels();
  expect(mockedAxios.get).toHaveBeenCalledTimes(2);
});
```

- [ ] **Step 2: Run — verify fail**

```bash
npm test -- src/__tests__/scraper.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/scraper'`

- [ ] **Step 3: Create src/lib/scraper.ts**

```typescript
import axios from 'axios';
import * as cheerio from 'cheerio';
import { Wheel } from '@/types';

interface Cache { data: Wheel[]; fetchedAt: number; }

const CACHE_TTL_MS = 5 * 60 * 1000;
let cache: Cache | null = null;

export async function getWheels(): Promise<Wheel[]> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) return cache.data;
  const data = await scrapeWheels();
  cache = { data, fetchedAt: Date.now() };
  return data;
}

export function clearCache(): void { cache = null; }

async function scrapeWheels(): Promise<Wheel[]> {
  const { data: html } = await axios.get('https://forgiato.com/wheels', {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ForgiataDealer/1.0)' },
  });
  const $ = cheerio.load(html);
  const wheels: Wheel[] = [];

  $('.wheel-card').each((_, el) => {
    const name = $(el).find('.wheel-title').text().trim();
    const series = $(el).find('.wheel-series').text().trim();
    let imageUrl = $(el).find('img').first().attr('src') || '';
    const href = $(el).find('a').first().attr('href') || '';
    const slug = href.split('/').filter(Boolean).pop() || '';

    if (imageUrl.startsWith('/')) imageUrl = `https://forgiato.com${imageUrl}`;
    if (name && imageUrl) wheels.push({ name, series: series || 'Uncategorized', imageUrl, slug });
  });

  return wheels;
}
```

- [ ] **Step 4: Run — verify pass**

```bash
npm test -- src/__tests__/scraper.test.ts
```

Expected: PASS — 3 tests passing

- [ ] **Step 5: Verify scraper against live site**

```bash
npx tsx -e "import { getWheels } from './src/lib/scraper'; getWheels().then(w => console.log('Count:', w.length, JSON.stringify(w[0], null, 2)));"
```

If `Count: 0` — the live site uses different selectors or client-side rendering.
- Run `curl -s https://forgiato.com/wheels | grep -i 'class=' | head -60` to inspect actual class names
- Update `.wheel-card`, `.wheel-title`, `.wheel-series` in `scrapeWheels()` to match
- If curl returns minimal HTML (JS-rendered), install Puppeteer: `npm install puppeteer` and replace the axios.get block with a Puppeteer page.evaluate call

- [ ] **Step 6: Commit**

```bash
git add src/lib/scraper.ts src/__tests__/scraper.test.ts
git commit -m "feat: implement wheel scraper with 5-min in-memory cache"
```

---

### Task 6: GET /api/wheels route

**Files:**
- Create: `src/app/api/wheels/route.ts`
- Create: `src/__tests__/wheels-route.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/wheels-route.test.ts`:

```typescript
import { GET } from '@/app/api/wheels/route';
import { getWheels } from '@/lib/scraper';
import { NextRequest } from 'next/server';
import { Wheel } from '@/types';

jest.mock('@/lib/scraper');
const mockedGetWheels = getWheels as jest.MockedFunction<typeof getWheels>;

const MOCK_WHEELS: Wheel[] = [
  { name: "D'Uno", series: 'Classics', imageUrl: 'https://forgiato.com/d-uno.jpg', slug: 'd-uno' },
];

test('returns 200 with wheels array', async () => {
  mockedGetWheels.mockResolvedValue(MOCK_WHEELS);
  const res = await GET(new NextRequest('http://localhost:3000/api/wheels'));
  const body = await res.json();
  expect(res.status).toBe(200);
  expect(body.wheels).toEqual(MOCK_WHEELS);
});

test('returns 500 when scraper throws', async () => {
  mockedGetWheels.mockRejectedValue(new Error('Network error'));
  const res = await GET(new NextRequest('http://localhost:3000/api/wheels'));
  expect(res.status).toBe(500);
});
```

- [ ] **Step 2: Run — verify fail**

```bash
npm test -- src/__tests__/wheels-route.test.ts
```

Expected: FAIL — `Cannot find module '@/app/api/wheels/route'`

- [ ] **Step 3: Create src/app/api/wheels/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getWheels } from '@/lib/scraper';

export async function GET(_req: NextRequest) {
  try {
    const wheels = await getWheels();
    return NextResponse.json({ wheels });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch wheels' }, { status: 500 });
  }
}
```

- [ ] **Step 4: Run — verify pass**

```bash
npm test -- src/__tests__/wheels-route.test.ts
```

Expected: PASS — 2 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/app/api/wheels/route.ts src/__tests__/wheels-route.test.ts
git commit -m "feat: add GET /api/wheels route"
```

---

### Task 7: POST /api/quote route

**Files:**
- Create: `src/app/api/quote/route.ts`
- Create: `src/__tests__/quote-route.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/quote-route.test.ts`:

```typescript
import { POST } from '@/app/api/quote/route';
import { NextRequest } from 'next/server';

function makeRequest(body: object) {
  return new NextRequest('http://localhost:3000/api/quote', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

test('returns 200 with valid data', async () => {
  const res = await POST(makeRequest({
    wheelName: "D'Uno", name: 'John Smith', email: 'john@example.com', phone: '555-1234',
  }));
  const body = await res.json();
  expect(res.status).toBe(200);
  expect(body.success).toBe(true);
});

test('returns 400 when required fields missing', async () => {
  const res = await POST(makeRequest({ wheelName: "D'Uno" }));
  expect(res.status).toBe(400);
});
```

- [ ] **Step 2: Run — verify fail**

```bash
npm test -- src/__tests__/quote-route.test.ts
```

Expected: FAIL — `Cannot find module '@/app/api/quote/route'`

- [ ] **Step 3: Create src/app/api/quote/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { QuoteFormData } from '@/types';

export async function POST(req: NextRequest) {
  const body: Partial<QuoteFormData> = await req.json();
  const { wheelName, name, email, phone } = body;

  if (!wheelName || !name || !email || !phone) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  console.log('[Quote Request]', { wheelName, name, email, phone, message: body.message });
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 4: Run — verify pass**

```bash
npm test -- src/__tests__/quote-route.test.ts
```

Expected: PASS — 2 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/app/api/quote/route.ts src/__tests__/quote-route.test.ts
git commit -m "feat: add POST /api/quote route with validation"
```

---

### Task 8: WheelCard component

**Files:**
- Create: `src/components/WheelCard.tsx`
- Create: `src/__tests__/WheelCard.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/WheelCard.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WheelCard from '@/components/WheelCard';
import { Wheel } from '@/types';

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}));

const WHEEL: Wheel = {
  name: "D'Uno", series: 'Classics',
  imageUrl: 'https://forgiato.com/images/d-uno.jpg', slug: 'd-uno',
};

test('renders wheel name and series', () => {
  render(<WheelCard wheel={WHEEL} onQuoteClick={jest.fn()} />);
  expect(screen.getByText("D'Uno")).toBeInTheDocument();
  expect(screen.getByText('Classics')).toBeInTheDocument();
});

test('renders wheel image with correct src', () => {
  render(<WheelCard wheel={WHEEL} onQuoteClick={jest.fn()} />);
  expect(screen.getByRole('img')).toHaveAttribute('src', WHEEL.imageUrl);
});

test('calls onQuoteClick with wheel when button clicked', async () => {
  const onQuoteClick = jest.fn();
  render(<WheelCard wheel={WHEEL} onQuoteClick={onQuoteClick} />);
  await userEvent.click(screen.getByRole('button', { name: /get a quote/i }));
  expect(onQuoteClick).toHaveBeenCalledWith(WHEEL);
});
```

- [ ] **Step 2: Run — verify fail**

```bash
npm test -- src/__tests__/WheelCard.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/WheelCard'`

- [ ] **Step 3: Create src/components/WheelCard.tsx**

```tsx
'use client';
import Image from 'next/image';
import { Wheel } from '@/types';

interface Props { wheel: Wheel; onQuoteClick: (wheel: Wheel) => void; }

export default function WheelCard({ wheel, onQuoteClick }: Props) {
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg overflow-hidden hover:scale-[1.02] transition-transform duration-200">
      <div className="relative aspect-square">
        <Image
          src={wheel.imageUrl}
          alt={wheel.name}
          fill
          className="object-contain p-4"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <div className="p-4">
        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
          {wheel.series}
        </span>
        <h3 className="text-white font-bold text-lg mt-1">{wheel.name}</h3>
        <button
          onClick={() => onQuoteClick(wheel)}
          className="mt-4 w-full bg-white text-black font-semibold py-2 px-4 rounded hover:bg-zinc-200 transition-colors"
        >
          Get a Quote
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run — verify pass**

```bash
npm test -- src/__tests__/WheelCard.test.tsx
```

Expected: PASS — 3 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/components/WheelCard.tsx src/__tests__/WheelCard.test.tsx
git commit -m "feat: add WheelCard component"
```

---

### Task 9: FilterBar component

**Files:**
- Create: `src/components/FilterBar.tsx`
- Create: `src/__tests__/FilterBar.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/FilterBar.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FilterBar from '@/components/FilterBar';

const SERIES = ['Classics', 'Flow Forged', 'Signature'];

test('renders All button and one button per series', () => {
  render(<FilterBar series={SERIES} activeSeries="All" onChange={jest.fn()} />);
  expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
  SERIES.forEach(s => expect(screen.getByRole('button', { name: s })).toBeInTheDocument());
});

test('calls onChange with series name when clicked', async () => {
  const onChange = jest.fn();
  render(<FilterBar series={SERIES} activeSeries="All" onChange={onChange} />);
  await userEvent.click(screen.getByRole('button', { name: 'Classics' }));
  expect(onChange).toHaveBeenCalledWith('Classics');
});

test('calls onChange with All when All button clicked', async () => {
  const onChange = jest.fn();
  render(<FilterBar series={SERIES} activeSeries="Classics" onChange={onChange} />);
  await userEvent.click(screen.getByRole('button', { name: 'All' }));
  expect(onChange).toHaveBeenCalledWith('All');
});
```

- [ ] **Step 2: Run — verify fail**

```bash
npm test -- src/__tests__/FilterBar.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/FilterBar'`

- [ ] **Step 3: Create src/components/FilterBar.tsx**

```tsx
'use client';

interface Props { series: string[]; activeSeries: string; onChange: (s: string) => void; }

export default function FilterBar({ series, activeSeries, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2 mb-8">
      {['All', ...series].map(s => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
            activeSeries === s
              ? 'bg-white text-black border-white'
              : 'bg-transparent text-zinc-300 border-zinc-600 hover:border-zinc-400'
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run — verify pass**

```bash
npm test -- src/__tests__/FilterBar.test.tsx
```

Expected: PASS — 3 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/components/FilterBar.tsx src/__tests__/FilterBar.test.tsx
git commit -m "feat: add FilterBar with series pill buttons"
```

---

### Task 10: QuoteModal component

**Files:**
- Create: `src/components/QuoteModal.tsx`
- Create: `src/__tests__/QuoteModal.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/QuoteModal.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuoteModal from '@/components/QuoteModal';
import { Wheel } from '@/types';

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}));

const WHEEL: Wheel = {
  name: "D'Uno", series: 'Classics',
  imageUrl: 'https://forgiato.com/images/d-uno.jpg', slug: 'd-uno',
};

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ success: true }),
  });
});

test('displays wheel name as readonly field', () => {
  render(<QuoteModal wheel={WHEEL} onClose={jest.fn()} />);
  expect(screen.getByDisplayValue("D'Uno")).toBeInTheDocument();
});

test('calls onClose when X button clicked', async () => {
  const onClose = jest.fn();
  render(<QuoteModal wheel={WHEEL} onClose={onClose} />);
  await userEvent.click(screen.getByRole('button', { name: /close/i }));
  expect(onClose).toHaveBeenCalled();
});

test('submits form and shows success message', async () => {
  render(<QuoteModal wheel={WHEEL} onClose={jest.fn()} />);
  await userEvent.type(screen.getByLabelText(/your name/i), 'John Smith');
  await userEvent.type(screen.getByLabelText(/email/i), 'john@example.com');
  await userEvent.type(screen.getByLabelText(/phone/i), '555-1234');
  await userEvent.click(screen.getByRole('button', { name: /send request/i }));
  await waitFor(() => expect(screen.getByText(/request sent/i)).toBeInTheDocument());
});
```

- [ ] **Step 2: Run — verify fail**

```bash
npm test -- src/__tests__/QuoteModal.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/QuoteModal'`

- [ ] **Step 3: Create src/components/QuoteModal.tsx**

```tsx
'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Wheel } from '@/types';

interface Props { wheel: Wheel; onClose: () => void; }

export default function QuoteModal({ wheel, onClose }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch('/api/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wheelName: wheel.name, name, email, phone, message }),
    });
    setLoading(false);
    setSubmitted(true);
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md p-6 relative" onClick={e => e.stopPropagation()}>
        <button aria-label="Close" onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-white text-xl">✕</button>

        <div className="flex items-center gap-4 mb-6">
          <div className="relative w-16 h-16 flex-shrink-0">
            <Image src={wheel.imageUrl} alt={wheel.name} fill className="object-contain" />
          </div>
          <div>
            <p className="text-zinc-400 text-xs uppercase tracking-widest">{wheel.series}</p>
            <h2 className="text-white font-bold text-xl">{wheel.name}</h2>
          </div>
        </div>

        {submitted ? (
          <p className="text-green-400 text-center py-8 font-semibold">Request Sent! We'll contact you shortly.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" value={wheel.name} readOnly aria-label="Wheel" className="hidden" />
            <div>
              <label htmlFor="name" className="block text-zinc-300 text-sm mb-1">Your Name</label>
              <input id="name" type="text" required value={name} onChange={e => setName(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-600 rounded px-3 py-2 text-white focus:outline-none focus:border-white" />
            </div>
            <div>
              <label htmlFor="email" className="block text-zinc-300 text-sm mb-1">Email</label>
              <input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-600 rounded px-3 py-2 text-white focus:outline-none focus:border-white" />
            </div>
            <div>
              <label htmlFor="phone" className="block text-zinc-300 text-sm mb-1">Phone</label>
              <input id="phone" type="tel" required value={phone} onChange={e => setPhone(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-600 rounded px-3 py-2 text-white focus:outline-none focus:border-white" />
            </div>
            <div>
              <label htmlFor="message" className="block text-zinc-300 text-sm mb-1">Message (optional)</label>
              <textarea id="message" value={message} onChange={e => setMessage(e.target.value)} rows={3}
                className="w-full bg-zinc-800 border border-zinc-600 rounded px-3 py-2 text-white focus:outline-none focus:border-white resize-none" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-white text-black font-semibold py-2 px-4 rounded hover:bg-zinc-200 transition-colors disabled:opacity-50">
              {loading ? 'Sending...' : 'Send Request'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run — verify pass**

```bash
npm test -- src/__tests__/QuoteModal.test.tsx
```

Expected: PASS — 3 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/components/QuoteModal.tsx src/__tests__/QuoteModal.test.tsx
git commit -m "feat: add QuoteModal with form and success state"
```

---

### Task 11: WheelsGallery component

**Files:**
- Create: `src/components/WheelsGallery.tsx`
- Create: `src/__tests__/WheelsGallery.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/WheelsGallery.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WheelsGallery from '@/components/WheelsGallery';
import { Wheel } from '@/types';

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}));

const MOCK_WHEELS: Wheel[] = [
  { name: "D'Uno", series: 'Classics', imageUrl: 'https://forgiato.com/d-uno.jpg', slug: 'd-uno' },
  { name: 'D-Flow', series: 'Flow Forged', imageUrl: 'https://forgiato.com/d-flow.jpg', slug: 'd-flow' },
  { name: "D'Due", series: 'Classics', imageUrl: 'https://forgiato.com/d-due.jpg', slug: 'd-due' },
];

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ wheels: MOCK_WHEELS }),
  });
});

test('shows loading state initially', () => {
  render(<WheelsGallery />);
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
});

test('renders all wheels after fetch', async () => {
  render(<WheelsGallery />);
  await waitFor(() => {
    expect(screen.getByText("D'Uno")).toBeInTheDocument();
    expect(screen.getByText('D-Flow')).toBeInTheDocument();
    expect(screen.getByText("D'Due")).toBeInTheDocument();
  });
});

test('filters wheels by series when filter pill clicked', async () => {
  render(<WheelsGallery />);
  await waitFor(() => screen.getByText("D'Uno"));
  await userEvent.click(screen.getByRole('button', { name: 'Flow Forged' }));
  expect(screen.getByText('D-Flow')).toBeInTheDocument();
  expect(screen.queryByText("D'Uno")).not.toBeInTheDocument();
});

test('opens quote modal when Get a Quote clicked', async () => {
  render(<WheelsGallery />);
  await waitFor(() => screen.getAllByRole('button', { name: /get a quote/i }));
  await userEvent.click(screen.getAllByRole('button', { name: /get a quote/i })[0]);
  expect(screen.getByText(/send request/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run — verify fail**

```bash
npm test -- src/__tests__/WheelsGallery.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/WheelsGallery'`

- [ ] **Step 3: Create src/components/WheelsGallery.tsx**

```tsx
'use client';
import { useState, useEffect } from 'react';
import { Wheel } from '@/types';
import WheelCard from './WheelCard';
import FilterBar from './FilterBar';
import QuoteModal from './QuoteModal';

export default function WheelsGallery() {
  const [wheels, setWheels] = useState<Wheel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSeries, setActiveSeries] = useState('All');
  const [selectedWheel, setSelectedWheel] = useState<Wheel | null>(null);

  useEffect(() => {
    fetch('/api/wheels')
      .then(r => r.json())
      .then(data => { setWheels(data.wheels ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const allSeries = [...new Set(wheels.map(w => w.series))].sort();
  const filtered = activeSeries === 'All' ? wheels : wheels.filter(w => w.series === activeSeries);

  if (loading) {
    return <div className="flex items-center justify-center py-24 text-zinc-400 text-lg">Loading wheels...</div>;
  }

  return (
    <section className="px-6 py-12 max-w-7xl mx-auto">
      <FilterBar series={allSeries} activeSeries={activeSeries} onChange={setActiveSeries} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(wheel => (
          <WheelCard key={wheel.slug} wheel={wheel} onQuoteClick={setSelectedWheel} />
        ))}
      </div>
      {selectedWheel && <QuoteModal wheel={selectedWheel} onClose={() => setSelectedWheel(null)} />}
    </section>
  );
}
```

- [ ] **Step 4: Run — verify pass**

```bash
npm test -- src/__tests__/WheelsGallery.test.tsx
```

Expected: PASS — 4 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/components/WheelsGallery.tsx src/__tests__/WheelsGallery.test.tsx
git commit -m "feat: add WheelsGallery with filter and quote modal integration"
```

---

### Task 12: Wire up page.tsx and verify

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Replace src/app/globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #09090b;
  color: #fafafa;
}
```

- [ ] **Step 2: Update metadata in src/app/layout.tsx**

Find the `export const metadata` block and replace it with:

```typescript
export const metadata: Metadata = {
  title: 'Forgiato Authorized Dealer | Premium Wheels',
  description: 'Browse the full Forgiato wheel collection. Authorized dealer — request a quote today.',
};
```

- [ ] **Step 3: Replace src/app/page.tsx**

```tsx
import WheelsGallery from '@/components/WheelsGallery';

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950">
      <header className="border-b border-zinc-800 px-6 py-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Forgiato Wheels — Authorized Dealer
        </h1>
        <p className="text-zinc-400 mt-1 text-sm">
          Browse the full collection and request a quote on any wheel.
        </p>
      </header>
      <WheelsGallery />
    </main>
  );
}
```

- [ ] **Step 4: Run full test suite**

```bash
npm test
```

Expected: All tests pass. Fix any failures before continuing.

- [ ] **Step 5: Start dev server and verify in browser**

```bash
npm run dev
```

Open `http://localhost:3000`. Verify:
- Dark background and header render
- "Loading wheels..." appears briefly
- Wheel cards appear in a responsive grid
- Series filter pills appear above the grid and filter correctly
- Clicking "Get a Quote" opens the modal with wheel name pre-filled
- Submitting the form shows "Request Sent!" message

If 0 wheel cards appear, return to Task 5 Step 5 for selector debugging.

- [ ] **Step 6: Final commit**

```bash
git add src/app/page.tsx src/app/globals.css src/app/layout.tsx
git commit -m "feat: complete Forgiato dealer wheel gallery"
```
