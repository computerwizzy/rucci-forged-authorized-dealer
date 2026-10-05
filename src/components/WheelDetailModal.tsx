'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Wheel } from '@/types';
import QuoteModal from './QuoteModal';
import { renderFinishPreview, hasApproximatePreview } from '@/lib/finishPreview';

interface Props {
  wheel: Wheel;
  onClose: () => void;
}

interface Lightbox { images: string[]; idx: number; }

// Rucci's standard finishes, in catalog order, with a swatch for the ones that have no render yet.
const STANDARD_FINISHES = ['Chrome', 'Brushed', 'Black', '18K Liquid', '18K Brushed Gold', '24K Liquid', '24K Brushed Gold'];
const SWATCH: Record<string, string> = {
  'Chrome': 'linear-gradient(135deg,#f4f4f4 0%,#9a9a9a 45%,#e8e8e8 60%,#7a7a7a 100%)',
  'Brushed': 'linear-gradient(90deg,#b9b9b9,#d6d6d6 30%,#a8a8a8 55%,#cfcfcf)',
  'Black': 'linear-gradient(135deg,#2a2a2a,#050505)',
  '18K Liquid': 'linear-gradient(135deg,#f6dc8a,#c9961f 55%,#f2d26b)',
  '18K Brushed Gold': 'linear-gradient(90deg,#c9a24a,#e3c472 35%,#b9923c 60%,#dcbb62)',
  '24K Liquid': 'linear-gradient(135deg,#ffe28a,#e0a800 55%,#ffd75e)',
  '24K Brushed Gold': 'linear-gradient(90deg,#d8ae2e,#f0cc63 35%,#c99f27 60%,#ebc659)',
};

export default function WheelDetailModal({ wheel, onClose }: Props) {
  const [activeIdx, setActiveIdx]   = useState(0);
  const [showQuote, setShowQuote]   = useState(false);
  const [lightbox, setLightbox]     = useState<Lightbox | null>(null);
  // Finish / cap picker (renders from Rucci's media library). null = the product photos.
  const [finish, setFinish]         = useState<string | null>(null);
  const [cap, setCap]               = useState<string | null>(null);
  // Approximate preview (catalog photo re-coloured) for finishes Rucci has not rendered.
  const [approx, setApprox]         = useState<{ finish: string; url: string } | null>(null);

  const detail    = wheel.detail;
  const variants  = detail?.variants ?? [];
  // Every wheel gets the standard finishes (Rucci builds any of them to order); renders add
  // custom colours on top. Finishes without a render keep the catalog photo and show a swatch.
  const rendered  = new Set(variants.map(v => v.finish));
  const finishes  = [...STANDARD_FINISHES, ...variants.map(v => v.finish).filter(f => !STANDARD_FINISHES.includes(f))]
    .filter((f, i, arr) => arr.indexOf(f) === i);
  const caps      = [...new Set(variants.filter(v => v.cap).map(v => v.cap as string))];
  const variant   = finish
    ? (variants.find(v => v.finish === finish && (!caps.length || !cap || v.cap === cap))
       ?? variants.find(v => v.finish === finish) ?? null)
    : null;
  const productImages = detail?.images?.length
    ? [wheel.imageUrl, ...detail.images]
    : [wheel.imageUrl];
  const approxUrl = finish && !variant && approx?.finish === finish ? approx.url : null;
  const allImages = variant ? [variant.url] : approxUrl ? [approxUrl] : productImages;
  const activeImage = allImages[activeIdx] ?? allImages[0];
  // The quote / SMS should carry a real photo, never a data URL.
  const quoteImage = variant ? variant.url : wheel.imageUrl;

  useEffect(() => {
    if (!finish || variant || !hasApproximatePreview(finish)) return;
    let live = true;
    renderFinishPreview(wheel.imageUrl, finish).then(url => { if (live && url) setApprox({ finish, url }); });
    return () => { live = false; };
  }, [finish, variant, wheel.imageUrl]);
  const pickFinish = (f: string | null) => {
    setFinish(f); setActiveIdx(0);
    if (f && caps.length && !cap) setCap(variants.find(v => v.finish === f && v.cap)?.cap ?? null);
  };

  // Gallery: exclude images already shown in the carousel (same filename)
  const carouselNames = new Set(allImages.map(s => s.split('/').pop()));
  const gallery = (detail?.gallery ?? []).filter(
    src => !carouselNames.has(src.split('/').pop())
  );

  // Keyboard: Escape closes lightbox first, then modal; arrows navigate lightbox or carousel
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lightbox) { setLightbox(null); return; }
        onClose();
      }
      if (lightbox) {
        if (e.key === 'ArrowLeft')
          setLightbox(lb => lb ? { ...lb, idx: Math.max(0, lb.idx - 1) } : null);
        if (e.key === 'ArrowRight')
          setLightbox(lb => lb ? { ...lb, idx: Math.min(lb.images.length - 1, lb.idx + 1) } : null);
        return;
      }
      if (e.key === 'ArrowLeft')  setActiveIdx(i => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setActiveIdx(i => Math.min(allImages.length - 1, i + 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, allImages.length, lightbox]);

  const handleBackdrop = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  const vehicles = detail?.vehicles ?? [];

  const specEntries = detail
    ? [
        { label: 'Construction',    value: detail.specs.construction },
        { label: 'Material',        value: detail.specs.material },
        { label: 'Available Sizes', value: detail.specs.sizes },
        { label: 'Bolt Pattern',    value: detail.specs.boltPattern },
        { label: 'Finishes',        value: detail.specs.finish },
        { label: 'Center Cap',      value: detail.specs.centerCap },
        { label: 'Style',           value: detail.specs.styles },
        { label: 'Made In',         value: detail.specs.madeIn },
      ].filter(e => e.value)
    : [];

  return (
    <>
      {/* ── Main modal backdrop ── */}
      <div
        className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={handleBackdrop}
      >
        <div className="relative bg-zinc-900 border-0 sm:border border-zinc-700 rounded-t-2xl sm:rounded-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto shadow-2xl">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 text-zinc-400 hover:text-white transition-colors text-2xl leading-none w-9 h-9 flex items-center justify-center bg-zinc-800 rounded-full"
            aria-label="Close"
          >✕</button>

          <div className="p-4 sm:p-6 md:p-8">
            {/* Header */}
            <div className="mb-4 sm:mb-6 pr-8">
              <span className="text-xs font-bold uppercase tracking-widest text-red-500">{wheel.series}{detail?.isNew && <span className="ml-2 bg-red-700 text-white px-1.5 py-0.5 rounded text-[10px]">New</span>}</span>
              <h2 className="text-white text-xl sm:text-2xl md:text-3xl font-bold mt-1 uppercase">{wheel.name}</h2>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
              {/* ── Carousel ── */}
              <div className="lg:w-1/2 flex-shrink-0">
                {/* Main image — click to zoom */}
                <button
                  className="relative w-full aspect-square bg-zinc-800 rounded-xl overflow-hidden mb-3 group cursor-zoom-in"
                  onClick={() => setLightbox({ images: allImages, idx: activeIdx })}
                  aria-label="Zoom image"
                >
                  <Image
                    src={activeImage}
                    alt={`${wheel.name} view ${activeIdx + 1}`}
                    fill
                    className="object-contain p-6"
                    sizes="(max-width: 1024px) 90vw, 45vw"
                  />
                  {finish && !variant && (
                    <span className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                      {approxUrl ? `${finish}: approximate preview` : `${finish}: built to order, preview coming`}
                    </span>
                  )}
                  {/* Zoom hint */}
                  <span className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to zoom
                  </span>
                  {/* Prev/Next inside carousel */}
                  {allImages.length > 1 && (
                    <>
                      <span
                        role="button"
                        onClick={e => { e.stopPropagation(); setActiveIdx(i => Math.max(0, i - 1)); }}
                        className={`absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white w-9 h-9 text-xl rounded-full flex items-center justify-center transition-opacity ${activeIdx === 0 ? 'opacity-20 pointer-events-none' : ''}`}
                        aria-label="Previous"
                      >‹</span>
                      <span
                        role="button"
                        onClick={e => { e.stopPropagation(); setActiveIdx(i => Math.min(allImages.length - 1, i + 1)); }}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white w-9 h-9 text-xl rounded-full flex items-center justify-center transition-opacity ${activeIdx === allImages.length - 1 ? 'opacity-20 pointer-events-none' : ''}`}
                        aria-label="Next"
                      >›</span>
                    </>
                  )}
                </button>

                {/* Finish / cap picker */}
                {finishes.length > 0 && (
                  <div className="mb-3" data-testid="finish-picker">
                    <p className="text-zinc-400 text-[11px] uppercase tracking-widest mb-2">
                      Finishes <span className="text-zinc-600">· {rendered.size ? `${rendered.size} with preview, ` : ''}any colour available</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => pickFinish(null)}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors ${finish === null ? 'bg-red-700 border-red-700 text-white' : 'bg-zinc-800 border-zinc-600 text-zinc-300 hover:border-red-500'}`}
                      >Catalog photo</button>
                      {finishes.map(f => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => pickFinish(f)}
                          aria-pressed={finish === f}
                          title={rendered.has(f) ? `${f} — preview available` : `${f} — built to order, no preview yet`}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors ${finish === f ? 'bg-red-700 border-red-700 text-white' : 'bg-zinc-800 border-zinc-600 text-zinc-300 hover:border-red-500'}`}
                        >
                          {SWATCH[f] && <span aria-hidden="true" className="inline-block w-3 h-3 rounded-full border border-black/40" style={{ background: SWATCH[f] }} />}
                          {f}
                          {!rendered.has(f) && <span className="sr-only"> (no preview)</span>}
                        </button>
                      ))}
                    </div>
                    {finish && caps.length > 1 && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-zinc-500 text-xs">Center cap:</span>
                        {caps.map(c => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => { setCap(c); setActiveIdx(0); }}
                            aria-pressed={cap === c}
                            className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors ${cap === c ? 'bg-zinc-200 border-zinc-200 text-black' : 'bg-zinc-800 border-zinc-600 text-zinc-300 hover:border-zinc-400'}`}
                          >{c}</button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Thumbnails */}
                {allImages.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {allImages.map((src, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveIdx(i)}
                        className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ${i === activeIdx ? 'border-red-500' : 'border-zinc-600 hover:border-red-400'}`}
                      >
                        <div className="relative w-full h-full bg-zinc-800">
                          <Image src={src} alt={`Thumbnail ${i + 1}`} fill className="object-contain p-1" sizes="56px" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Specs + Info ── */}
              <div className="lg:w-1/2 flex flex-col gap-6">
                {specEntries.length > 0 && (
                  <div>
                    <h3 className="text-white font-semibold text-sm uppercase tracking-widest mb-3">Specifications</h3>
                    <dl className="grid grid-cols-1 gap-y-3">
                      {specEntries.map(({ label, value }) => (
                        <div key={label} className="flex gap-4">
                          <dt className="text-zinc-400 text-sm w-28 sm:w-36 flex-shrink-0">{label}</dt>
                          <dd className="text-white text-sm font-medium">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}

                {detail?.description && (
                  <div>
                    <h3 className="text-white font-semibold text-sm uppercase tracking-widest mb-3">About</h3>
                    <p className="text-zinc-300 text-sm leading-relaxed">{detail.description}</p>
                  </div>
                )}

                {!detail && (
                  <p className="text-zinc-500 text-sm">Run <code className="text-zinc-300">npm run fetch</code> to download full specs.</p>
                )}

                <div className="mt-auto pt-4">
                  <button
                    onClick={() => setShowQuote(true)}
                    className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-3 px-6 rounded-lg transition-colors text-base"
                  >
                    Get a Quote
                  </button>
                </div>

              </div>
            </div>

            {/* ── Car Gallery ── */}
            {vehicles.length > 0 && (
              <div className="mt-8 pt-8 border-t border-zinc-700">
                <h3 className="text-white font-semibold text-sm uppercase tracking-widest mb-4">On Vehicles</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {vehicles.map((v, i) => (
                    <button
                      key={v.url}
                      onClick={() => setLightbox({ images: vehicles.map(x => x.url), idx: i })}
                      className="text-left group cursor-zoom-in"
                      aria-label={`${wheel.name} on ${v.vehicle}`}
                    >
                      <div className="relative aspect-video bg-zinc-800 rounded-lg overflow-hidden">
                        <Image src={v.url} alt={`${wheel.name} on ${v.vehicle}`} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 22vw" />
                      </div>
                      <p className="text-zinc-400 text-xs mt-1.5">{v.vehicle}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {vehicles.length === 0 && gallery.length > 0 && (
              <div className="mt-8 pt-8 border-t border-zinc-700">
                <h3 className="text-white font-semibold text-sm uppercase tracking-widest mb-4">
                  On Vehicles
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {gallery.map((src, i) => (
                    <button
                      key={i}
                      onClick={() => setLightbox({ images: gallery, idx: i })}
                      className="relative aspect-video bg-zinc-800 rounded-lg overflow-hidden group cursor-zoom-in"
                      aria-label={`View ${wheel.name} on vehicle ${i + 1}`}
                    >
                      <Image
                        src={src}
                        alt={`${wheel.name} on vehicle ${i + 1}`}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 22vw"
                      />
                      {/* Zoom overlay */}
                      <span className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <span className="text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity">⤢</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Lightbox ── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl leading-none z-10"
            aria-label="Close lightbox"
          >✕</button>

          {/* Counter */}
          <span className="absolute top-4 left-1/2 -translate-x-1/2 text-white/50 text-sm">
            {lightbox.idx + 1} / {lightbox.images.length}
          </span>

          {/* Image */}
          <div
            className="relative w-full h-full max-w-5xl max-h-[90vh] mx-auto px-16"
            onClick={e => e.stopPropagation()}
          >
            <Image
              src={lightbox.images[lightbox.idx]}
              alt={`${wheel.name} fullsize`}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>

          {/* Prev */}
          {lightbox.idx > 0 && (
            <button
              onClick={e => { e.stopPropagation(); setLightbox(lb => lb ? { ...lb, idx: lb.idx - 1 } : null); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 text-white w-12 h-12 text-2xl rounded-full flex items-center justify-center transition-colors"
              aria-label="Previous"
            >‹</button>
          )}

          {/* Next */}
          {lightbox.idx < lightbox.images.length - 1 && (
            <button
              onClick={e => { e.stopPropagation(); setLightbox(lb => lb ? { ...lb, idx: lb.idx + 1 } : null); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 text-white w-12 h-12 text-2xl rounded-full flex items-center justify-center transition-colors"
              aria-label="Next"
            >›</button>
          )}
        </div>
      )}

      {showQuote && (
        <QuoteModal
          key={`${wheel.slug}-${activeImage}`}
          wheel={{ ...wheel, imageUrl: quoteImage }}
          initialFinish={finish ?? undefined}
          initialCap={variant?.cap ?? cap ?? undefined}
          onClose={() => setShowQuote(false)}
        />
      )}
    </>
  );
}
