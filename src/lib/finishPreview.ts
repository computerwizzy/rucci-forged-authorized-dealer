/**
 * Approximate finish previews for wheels Rucci has not rendered in a given finish.
 *
 * The catalog photo is re-coloured by luminance: every non-background pixel keeps its
 * light/shadow structure and takes the tone of the chosen finish, with specular
 * highlights pushed back toward white so chrome still reads as chrome. It is a
 * colour impression, not a render - the UI labels it "approximate".
 *
 * Works on Cloudinary images because the CDN sends `Access-Control-Allow-Origin: *`;
 * without CORS the canvas would be tainted and we return null (caller falls back).
 */

type Tone = { rgb: [number, number, number]; contrast: number; gamma: number; specular: number };

const TONES: Record<string, Tone> = {
  'Chrome':           { rgb: [236, 238, 242], contrast: 1.35, gamma: 1.0,  specular: 1.0 },
  'Brushed':          { rgb: [214, 214, 210], contrast: 0.9,  gamma: 1.05, specular: 0.55 },
  'Black':            { rgb: [38, 38, 42],    contrast: 1.15, gamma: 1.25, specular: 0.45 },
  '18K Liquid':       { rgb: [238, 196, 84],  contrast: 1.2,  gamma: 1.0,  specular: 0.9 },
  '18K Brushed Gold': { rgb: [222, 182, 86],  contrast: 0.9,  gamma: 1.05, specular: 0.5 },
  '24K Liquid':       { rgb: [250, 206, 46],  contrast: 1.2,  gamma: 1.0,  specular: 0.9 },
  '24K Brushed Gold': { rgb: [236, 194, 56],  contrast: 0.9,  gamma: 1.05, specular: 0.5 },
};

export function hasApproximatePreview(finish: string): boolean {
  return finish in TONES;
}

const cache = new Map<string, Promise<string | null>>();

export function renderFinishPreview(src: string, finish: string): Promise<string | null> {
  const tone = TONES[finish];
  if (!tone || typeof document === 'undefined') return Promise.resolve(null);
  const key = `${finish}|${src}`;
  let p = cache.get(key);
  if (!p) {
    p = draw(src, tone).catch(() => null);
    cache.set(key, p);
  }
  return p;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`image failed: ${src}`));
    img.src = src;
  });
}

async function draw(src: string, tone: Tone): Promise<string | null> {
  const img = await loadImage(src);
  const max = 1000;
  const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * scale), h = Math.round(img.naturalHeight * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, w, h);
  let data: ImageData;
  try { data = ctx.getImageData(0, 0, w, h); } catch { return null; }   // tainted canvas
  const px = data.data;

  // Background: sample the four corners; a near-white (or transparent) corner means a
  // studio backdrop that must stay as it is.
  const corner = (x: number, y: number) => { const i = (y * w + x) * 4; return [px[i], px[i + 1], px[i + 2], px[i + 3]]; };
  const corners = [corner(0, 0), corner(w - 1, 0), corner(0, h - 1), corner(w - 1, h - 1)];
  const whiteBackdrop = corners.some(c => c[3] > 0 && c[0] > 235 && c[1] > 235 && c[2] > 235);

  const [tr, tg, tb] = tone.rgb;
  for (let i = 0; i < px.length; i += 4) {
    const a = px[i + 3];
    if (a === 0) continue;
    const r = px[i], g = px[i + 1], b = px[i + 2];
    const sat = Math.max(r, g, b) - Math.min(r, g, b);
    if (whiteBackdrop && r > 238 && g > 238 && b > 238 && sat < 10) continue;   // backdrop
    let l = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    l = Math.pow(l, tone.gamma);
    l = Math.min(1, Math.max(0, (l - 0.5) * tone.contrast + 0.5));
    // body colour follows luminance; the top end blends toward white for specular shine
    const spec = l > 0.8 ? ((l - 0.8) / 0.2) * tone.specular : 0;
    px[i]     = Math.round(tr * l + (255 - tr * l) * spec);
    px[i + 1] = Math.round(tg * l + (255 - tg * l) * spec);
    px[i + 2] = Math.round(tb * l + (255 - tb * l) * spec);
  }
  ctx.putImageData(data, 0, 0);
  // PNG keeps the transparent backdrop most catalog photos have (JPEG would flatten it to black)
  return canvas.toDataURL('image/png');
}
