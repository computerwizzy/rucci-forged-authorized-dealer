#!/usr/bin/env node
/**
 * Upload all local wheel images to Cloudinary and update wheels.json with CDN URLs.
 * Usage: node scripts/upload-to-cloudinary.js
 * Resumable: already-uploaded images (Cloudinary URLs) are skipped.
 */

require('dotenv').config({ path: '.env.local' });
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const DATA_FILE  = path.join(__dirname, '../src/data/wheels.json');
const PUBLIC_DIR = path.join(__dirname, '../public');
const CONCURRENCY = 4;

function localToPublicId(localPath) {
  // /wheels/foo.webp     → rucci/wheels/foo
  // /wheels/gallery/x.jpg → rucci/gallery/x
  const stripped = localPath.replace(/^\//, '').replace(/\.[^/.]+$/, '');
  return `rucci/${stripped}`;
}

function isCloudinaryUrl(url) {
  return url.startsWith('https://res.cloudinary.com');
}

async function uploadOne(localPath) {
  const fsPath = path.join(PUBLIC_DIR, localPath);
  if (!fs.existsSync(fsPath)) return null;

  const publicId = localToPublicId(localPath);
  try {
    const res = await cloudinary.uploader.upload(fsPath, {
      public_id: publicId,
      overwrite: false,
      resource_type: 'image',
    });
    return res.secure_url;
  } catch (err) {
    // 400 "already exists" means it's on Cloudinary — build the URL
    const msg = err?.error?.message || err?.message || '';
    if (msg.toLowerCase().includes('already exists')) {
      const ext = path.extname(localPath).slice(1) || 'png';
      return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${publicId}.${ext}`;
    }
    console.warn(`  FAIL ${localPath}: ${msg}`);
    return null;
  }
}

async function runWithConcurrency(tasks, fn, concurrency) {
  const results = new Array(tasks.length);
  let i = 0;
  async function worker() {
    while (i < tasks.length) {
      const idx = i++;
      results[idx] = await fn(tasks[idx]);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

function applyMap(wheels, map) {
  return wheels.map(w => {
    const out = { ...w };
    if (map.has(out.imageUrl)) out.imageUrl = map.get(out.imageUrl);
    if (out.detail) {
      out.detail = { ...out.detail };
      if (out.detail.images)  out.detail.images  = out.detail.images.map(u => map.get(u) ?? u);
      if (out.detail.gallery) out.detail.gallery = out.detail.gallery.map(u => map.get(u) ?? u);
      if (out.detail.variants) out.detail.variants = out.detail.variants.map(v => ({ ...v, url: map.get(v.url) ?? v.url }));
      if (out.detail.vehicles) out.detail.vehicles = out.detail.vehicles.map(v => ({ ...v, url: map.get(v.url) ?? v.url }));
    }
    return out;
  });
}

async function main() {
  const wheels = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

  // Collect all unique local paths that haven't been uploaded yet
  const needed = new Set();
  for (const w of wheels) {
    if (!isCloudinaryUrl(w.imageUrl)) needed.add(w.imageUrl);
    if (w.detail) {
      for (const u of w.detail.images  ?? []) if (!isCloudinaryUrl(u)) needed.add(u);
      for (const u of w.detail.gallery ?? []) if (!isCloudinaryUrl(u)) needed.add(u);
      for (const v of w.detail.variants ?? []) if (!isCloudinaryUrl(v.url)) needed.add(v.url);
      for (const v of w.detail.vehicles ?? []) if (!isCloudinaryUrl(v.url)) needed.add(v.url);
    }
  }

  const localPaths = [...needed];
  console.log(`Images to upload: ${localPaths.length} (skipping already-done)`);
  if (localPaths.length === 0) { console.log('Nothing to do.'); return; }

  const urlMap = new Map(); // localPath → CDN URL
  let done = 0;

  const uploadAndTrack = async (localPath) => {
    const url = await uploadOne(localPath);
    if (url) urlMap.set(localPath, url);
    done++;
    if (done % 100 === 0 || done === localPaths.length) {
      process.stdout.write(`  ${done}/${localPaths.length} (${urlMap.size} ok)\n`);
      fs.writeFileSync(DATA_FILE, JSON.stringify(applyMap(wheels, urlMap), null, 2));
    }
  };

  await runWithConcurrency(localPaths, uploadAndTrack, CONCURRENCY);

  fs.writeFileSync(DATA_FILE, JSON.stringify(applyMap(wheels, urlMap), null, 2));
  console.log(`\n✓ Done — wheels.json updated with Cloudinary URLs.`);
}

main().catch(err => { console.error(err); process.exit(1); });
