import * as fs from 'fs';
import * as path from 'path';
import { Wheel } from '@/types';

/**
 * Catalog loader. The data file is produced by `npm run fetch` (scripts/fetch-rucci.js)
 * from rucciwheels.com's public WooCommerce Store API, then `npm run upload` moves the
 * images to Cloudinary. Nothing is fetched from Rucci at request time.
 */
interface Cache { data: Wheel[]; fetchedAt: number; }

const CACHE_TTL_MS = 5 * 60 * 1000;
const DATA_FILE = path.join(process.cwd(), 'src/data/wheels.json');
let cache: Cache | null = null;

export async function getWheels(): Promise<Wheel[]> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) return cache.data;
  const data: Wheel[] = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  cache = { data, fetchedAt: Date.now() };
  return data;
}

export function clearCache(): void { cache = null; }
