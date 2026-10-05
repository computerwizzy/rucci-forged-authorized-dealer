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
 * Phase 2 reads Rucci's public media library (wp/v2/media). The product records carry
 * ONE photo each, but the library holds finish renders named like
 * "ace20big20cap2024k20gold20brush20_web.png" (a lost "%20" between words) or
 * "Trapstar-Copper-Red-ChromeBarrel.png", plus car photos named
 * "CHEVROLET_IMPALA_RUCCI_HASHASH_1.jpg". Those become detail.variants (finish / cap
 * renders) and detail.vehicles (on-car photos).
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


// ─── Phase 2: finish renders + car photos from the media library ───────────────
const MEDIA_API = 'https://www.rucciwheels.com/wp-json/wp/v2/media';
const VAR_DIR = path.join(OUT_DIR, 'variants');
const VEH_DIR = path.join(OUT_DIR, 'vehicles');
// Library filenames spell some wheels differently from the product slugs.
const ALIAS = { sizzor: 'scizzor', affiliato: 'affilato', '9elbowz': '9-elbowz', '7elbowz': '7-elbowz',
  fusions: 'fusion', buff: 'buffs', rolling: 'rollin', scarlett: 'scarlette', block: 'blocko' };
const COLOR = new Set(('chrome brush brushed black gold liquid blue red white bronze copper silver rose rosegold teal ' +
  'burgundy green yellow chocolate brown purple orange candy twotone two tone polish polished lip accents metallic ' +
  'gunmetal grey gray pink matte satin 18k 24k').split(' '));
const NOISE = /^(web|scaled|copy|copyright\d*|beauty|st2|\d{3,4}x\d{3,4}|\d+|large\d*|new|img|rucci|wheels|sw|rd|v2)$/i;
const KNOWN = [
  ['24k gold brush', '24K Brushed Gold'], ['18k gold brush', '18K Brushed Gold'],
  ['24k brushed gold', '24K Brushed Gold'], ['18k brushed gold', '18K Brushed Gold'],
  ['24k gold', '24K Liquid'], ['18k gold', '18K Liquid'],
  ['liquid rose gold', 'Liquid Rose Gold'], ['liquid rosegold', 'Liquid Rose Gold'], ['rosegold', 'Rose Gold'],
  ['liquidgold', 'Liquid Gold'], ['liquid gold', 'Liquid Gold'], ['brushed gold', 'Brushed Gold'], ['brush gold', 'Brushed Gold'],
  ['chrome', 'Chrome'], ['brush', 'Brushed'], ['brushed', 'Brushed'], ['black', 'Black'],
  ['gunmetalgrey', 'Gunmetal Grey'], ['gunmetal', 'Gunmetal'], ['browngold', 'Brown Gold'], ['rosegold', 'Rose Gold'],
];
const compact = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');

function wordsOf(fn) {
  fn = fn.replace(/\.(png|webp|jpe?g)$/i, '');
  fn = fn.replace(/([a-z])20(?=[a-z0-9])/g, '$1-');      // lost %20 between words
  fn = fn.replace(/([0-9])20(?=[a-z])/g, '$1-');          // "42020small" -> "420-small"
  fn = fn.replace(/(k)20(?=[a-z])/g, '$1-');
  fn = fn.replace(/([a-z])20(?=[_\-.]|$)/g, '$1');        // trailing lost %20 before "_web"
  fn = fn.replace(/([a-z])(?=[A-Z])/g, '$1-');            // ChromeBarrel -> Chrome-Barrel
  fn = fn.replace(/([a-z])barrel\b/gi, '$1-barrel');      // chromebarrel -> chrome-barrel
  return fn.split(/[-_ .]+/).filter(Boolean);
}
function stripBarrel(words) {
  const out = []; let barrel = null, cap = null;
  for (let i = 0; i < words.length; i++) {
    const w = words[i].toLowerCase();
    if (w === 'barrel' && out.length) { barrel = out.pop(); continue; }
    if (w === 'bigcap' || w === 'smallcap') { cap = w === 'bigcap' ? 'Large cap' : 'Small cap'; continue; }
    if ((w === 'big' || w === 'small') && (words[i + 1] || '').toLowerCase() === 'cap') { cap = w === 'big' ? 'Large cap' : 'Small cap'; i++; continue; }
    out.push(w);
  }
  return { rest: out, barrel, cap };
}
function finishLabel(words) {
  const s = words.join(' ');
  for (const [k, v] of KNOWN) if (s === k) return v;
  if (!words.some(w => COLOR.has(w))) return null;
  return words.map(w => (w === '18k' || w === '24k') ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)).join(' ');
}

async function fetchMedia() {
  const all = [];
  for (let page = 1; page < 40; page++) {
    let list;
    try {
      list = JSON.parse(await get(`${MEDIA_API}?per_page=100&page=${page}&_fields=id,source_url,media_type,mime_type`));
    } catch (e) { if (/HTTP 400/.test(e.message)) break; throw e; }
    if (!Array.isArray(list) || !list.length) break;
    all.push(...list);
    await sleep(700);
  }
  return all.filter(m => m.media_type === 'image' && m.mime_type !== 'image/svg+xml');
}

async function attachMedia(wheels) {
  console.log('Fetching Rucci media library…');
  const media = await fetchMedia();
  console.log(`  ${media.length} images in the library`);
  const bySlugKey = new Map(wheels.map(w => [compact(w.slug), w]));
  for (const [a, b] of Object.entries(ALIAS)) if (bySlugKey.has(compact(b))) bySlugKey.set(compact(a), bySlugKey.get(compact(b)));
  fs.mkdirSync(VAR_DIR, { recursive: true }); fs.mkdirSync(VEH_DIR, { recursive: true });
  for (const w of wheels) { w.detail.variants = []; w.detail.vehicles = []; }

  let nVar = 0, nVeh = 0;
  for (const m of media) {
    const fn = m.source_url.split('/').pop();
    const ext = (path.extname(fn) || '.png').toLowerCase();
    const veh = fn.match(/^([A-Z]+)_([A-Z0-9-]+)_RUCCI_([A-Z0-9-]+)_(\d+)\./);
    if (veh) {
      const w = bySlugKey.get(compact(veh[3]));
      if (!w) continue;
      const file = path.join(VEH_DIR, `${w.slug}-${veh[1].toLowerCase()}-${veh[2].toLowerCase()}-${veh[4]}${ext}`);
      if (await download(m.source_url, file)) {
        const vehicle = `${veh[1]} ${veh[2].replace(/-/g, ' ')}`.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
        w.detail.vehicles.push({ url: `/wheels/vehicles/${path.basename(file)}`, vehicle });
        nVeh++;
      }
      await sleep(120);
      continue;
    }
    let words = wordsOf(fn);
    if (words[0] && words[0].toLowerCase() === 'rucci') words = words.slice(1);
    if (words[0] && words[0].toLowerCase() === 'wheels') words = words.slice(1);
    let w = null, rest = [];
    for (let n = Math.min(3, words.length); n > 0; n--) {
      const hit = bySlugKey.get(compact(words.slice(0, n).join('')));
      if (hit) { w = hit; rest = words.slice(n); break; }
    }
    if (!w) continue;
    rest = rest.filter(x => !NOISE.test(x));
    const sb = stripBarrel(rest);
    if (!sb.rest.length) continue;                       // plain alternate shot, product images cover it
    let label = finishLabel(sb.rest.map(x => x.toLowerCase()));
    if (!label) continue;
    if (sb.barrel && sb.barrel.toLowerCase() !== 'chrome') label += ` / ${sb.barrel[0].toUpperCase() + sb.barrel.slice(1)} barrel`;
    const key = compact(label + (sb.cap || ''));
    const file = path.join(VAR_DIR, `${w.slug}-${key}${ext}`);
    if (await download(m.source_url, file)) {
      w.detail.variants.push({ finish: label, cap: sb.cap || undefined, url: `/wheels/variants/${path.basename(file)}` });
      nVar++;
    }
    await sleep(120);
  }
  for (const w of wheels) {
    // stable order: catalog finishes first (Chrome, Brushed, Black, golds), large cap before small
    const rank = f => { const i = ['Chrome', 'Brushed', 'Black', '18K Liquid', '18K Brushed Gold', '24K Liquid', '24K Brushed Gold'].indexOf(f); return i < 0 ? 99 : i; };
    const seen = new Set();
    w.detail.variants = w.detail.variants.filter(v => !seen.has(v.url) && seen.add(v.url));
    w.detail.variants.sort((a, b) => rank(a.finish) - rank(b.finish) || a.finish.localeCompare(b.finish) || String(a.cap).localeCompare(String(b.cap)));
    if (!w.detail.variants.length) delete w.detail.variants;
    if (!w.detail.vehicles.length) delete w.detail.vehicles;
  }
  const multi = wheels.filter(w => w.detail.variants && new Set(w.detail.variants.map(v => v.finish)).size > 1).length;
  console.log(`  ${nVar} finish renders on ${wheels.filter(w => w.detail.variants).length} wheels (${multi} with 2+ finishes), ${nVeh} car photos`);
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
  await attachMedia(wheels);
  fs.writeFileSync(DATA_FILE, JSON.stringify(wheels, null, 2));
  console.log(`✓ ${wheels.length} wheels → src/data/wheels.json`);
}

main().catch(e => { console.error(e); process.exit(1); });
