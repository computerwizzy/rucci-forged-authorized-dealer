#!/usr/bin/env node
/**
 * Pull the full Rucci Forged catalog from rucciwheels.com (WooCommerce Store API,
 * public, no key) and write it in the same shape the gallery already understands.
 *
 * Usage: node scripts/fetch-rucci.js
 *
 * Output:
 *   public/wheels/<slug>-<n>.webp   — wheel images (downloaded, then pushed to Cloudinary
 *                                     by scripts/upload-to-cloudinary.js)
 *   src/data/wheels.json            — [{ name, series, imageUrl, slug, detail }]
 *
 * Resumable: images already on disk are not downloaded again.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const API = 'https://www.rucciwheels.com/wp-json/wc/store/v1/products';
const OUT_DIR = path.join(__dirname, '../public/wheels');
const DATA_FILE = path.join(__dirname, '../src/data/wheels.json');
const UA = 'Mozilla/5.0 (X11; Linux x86_64) WheelsBelowRetail-catalog/1.0';

// Rucci files every wheel under several style categories (a wheel is often
// "Directional" + "Split spoke" + "5 spoke"). The filter bar wants ONE series per
// wheel, so pick the most descriptive one in this order; the rest stay in specs.
const SERIES_PRIORITY = [
  '5 spoke', '6 spoke', '7 spoke', '8 spoke', '9 spoke', '10 spoke', '12 spoke', '13 spoke',
  '14 spoke', '15 spoke', '16 spoke', '18 spoke', '20 spoke', '25 spoke', 'Multispoke',
  'Mesh', 'Luxury', 'Sharp', 'Solid Face', 'Directional', 'Split spoke', 'Symmetrical',
];
const NOT_STYLES = new Set(['Wheels', 'Home Featured', 'New']);

function get(url, binary = false) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': UA, 'Accept-Encoding': 'identity' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(get(res.headers.location, binary));
      }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error(`HTTP ${res.statusCode} ${url}`)); }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(binary ? Buffer.concat(chunks) : Buffer.concat(chunks).toString('utf8')));
      res.on('error', reject);
    }).on('error', reject);
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

function stripHtml(html) {
  return (html || '')
    .replace(/<div class="tinv-wraper[\s\S]*?<\/div>\s*<\/div>/g, '')   // wishlist widget
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#8217;|&rsquo;/g, "'")
    .replace(/&#8220;|&#8221;|&ldquo;|&rdquo;/g, '"').replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ').trim();
}

function pickSeries(categories) {
  const names = categories.map(c => c.name).filter(n => !NOT_STYLES.has(n));
  for (const s of SERIES_PRIORITY) if (names.includes(s)) return s;
  return names[0] || 'Other';
}

async function fetchAll() {
  const all = [];
  for (let page = 1; page < 20; page++) {
    const body = await get(`${API}?per_page=100&page=${page}`);
    const list = JSON.parse(body);
    if (!list.length) break;
    all.push(...list);
    process.stdout.write(`  page ${page}: ${list.length} (total ${all.length})\n`);
    await sleep(800);
  }
  return all;
}

async function download(url, file) {
  if (fs.existsSync(file) && fs.statSync(file).size > 0) return true;
  try {
    const buf = await get(url, true);
    fs.writeFileSync(file, buf);
    return true;
  } catch (e) {
    console.warn(`  FAIL ${url}: ${e.message}`);
    return false;
  }
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log('Fetching Rucci catalog…');
  const products = await fetchAll();
  console.log(`${products.length} products`);

  const wheels = [];
  let n = 0;
  for (const p of products) {
    n++;
    const slug = p.slug;
    const styles = p.categories.map(c => c.name).filter(s => !NOT_STYLES.has(s));
    const attr = name => (p.attributes || []).find(a => a.name === name)?.terms?.map(t => t.name) || [];
    const finishes = attr('Finish');
    const caps = attr('Center Cap');
    const isNew = p.categories.some(c => c.name === 'New');

    const localImages = [];
    for (let i = 0; i < p.images.length; i++) {
      const src = p.images[i].src.split('?')[0];
      const ext = (path.extname(src) || '.webp').toLowerCase();
      const file = path.join(OUT_DIR, `${slug}-${i + 1}${ext}`);
      if (await download(src, file)) localImages.push(`/wheels/${slug}-${i + 1}${ext}`);
      await sleep(150);
    }
    if (!localImages.length) { console.warn(`  no image for ${p.name}, skipped`); continue; }

    wheels.push({
      name: p.name,
      series: pickSeries(p.categories),
      imageUrl: localImages[0],
      slug,
      detail: {
        images: localImages.slice(1),
        specs: {
          construction: 'Custom forged, built to order',
          finish: finishes.length ? finishes.join(', ') : undefined,
          centerCap: caps.length ? caps.join(' or ') : undefined,
          styles: styles.length ? styles.join(', ') : undefined,
          boltPattern: 'Custom to vehicle',
          madeIn: 'USA',
        },
        description: stripHtml(p.description) || undefined,
        gallery: [],
        isNew,
        sourceUrl: p.permalink,
      },
    });
    if (n % 25 === 0 || n === products.length) {
      process.stdout.write(`  ${n}/${products.length} wheels, ${fs.readdirSync(OUT_DIR).length} images\n`);
      fs.writeFileSync(DATA_FILE, JSON.stringify(wheels, null, 2));
    }
  }
  wheels.sort((a, b) => a.name.localeCompare(b.name));
  fs.writeFileSync(DATA_FILE, JSON.stringify(wheels, null, 2));
  console.log(`✓ ${wheels.length} wheels → src/data/wheels.json`);
}

main().catch(e => { console.error(e); process.exit(1); });
