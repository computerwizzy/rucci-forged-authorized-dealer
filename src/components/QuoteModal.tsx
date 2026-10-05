'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Wheel } from '@/types';

interface Props { wheel: Wheel; onClose: () => void; }

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 30 }, (_, i) => String(CURRENT_YEAR - i));

// Rucci builds every wheel to order - these are the options their own order form offers.
export const SIZES = ['19"', '20"', '22"', '24"', '26"', '28"', '30"', '32"', '34"', 'Not sure'];
// Exact finish names from Rucci's catalog attributes, plus a color-match option.
export const FINISHES = [
  'Chrome', 'Brushed', 'Black', '18K Liquid', '18K Brushed Gold', '24K Liquid', '24K Brushed Gold',
  'Color match / custom',
];
export const CENTER_CAPS = ['Large cap', 'Small cap', 'Not sure'];
export const YES_NO = ['Yes', 'No', 'Not sure'];
export const TIRE_OPTIONS = ['Yes, I need tires too', 'No, just the wheels', "I'd like a recommendation"];

function isValidPhone(phone: string) {
  return /^\+?[\d\s\-().]{10,}$/.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

function isValidName(name: string) {
  const trimmed = name.trim();
  return trimmed.length >= 5 &&
    /^[a-zA-ZÀ-ÖØ-öø-ÿ'\-]+(\s+[a-zA-ZÀ-ÖØ-öø-ÿ'\-]+)+$/.test(trimmed);
}

const inputCls = 'w-full bg-zinc-800 border border-zinc-600 rounded px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors';
const inputErrCls = 'w-full bg-zinc-800 border border-red-500 rounded px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-red-400 transition-colors';
const labelCls = 'block text-zinc-300 text-sm mb-1';

export default function QuoteModal({ wheel, onClose }: Props) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    vehicleYear: '',
    vehicleMake: '',
    vehicleModel: '',
    sizePreference: '',
    finishPreference: '',
    colorCode: '',
    centerCap: '',
    staggered: '',
    bigBrakes: '',
    needTires: '',
    message: '',
    honeypot: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const setLettersOnly = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^a-zA-ZÀ-ÖØ-öø-ÿ\s'\-]/g, '');
    setForm(f => ({ ...f, [field]: val }));
  };

  const setPhoneOnly = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^\d\s\-().+]/g, '');
    setForm(f => ({ ...f, [field]: val }));
  };

  function validate() {
    const errs: Record<string, string> = {};
    if (!isValidName(form.name)) errs.name = 'Enter your first and last name';
    if (!isValidPhone(form.phone)) errs.phone = 'Enter a valid 10-digit phone number';
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Honeypot — silently drop bot submissions
    if (form.honeypot) { setSubmitted(true); return; }
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    const { honeypot: _, ...payload } = form;
    await fetch('/api/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wheelName: wheel.name, wheelImageUrl: wheel.imageUrl, ...payload }),
    });
    setLoading(false);
    setSubmitted(true);
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <button
            aria-label="Close"
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-400 hover:text-white text-xl transition-colors"
          >
            ✕
          </button>

          {/* Wheel header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative w-16 h-16 flex-shrink-0 bg-zinc-800 rounded-lg overflow-hidden">
              <Image src={wheel.imageUrl} alt={wheel.name} fill className="object-contain p-1" />
            </div>
            <div>
              <p className="text-red-500 text-xs font-bold uppercase tracking-widest">{wheel.series}</p>
              <h2 className="text-white font-bold text-xl uppercase">{wheel.name}</h2>
            </div>
          </div>

          {submitted ? (
            <div className="text-center py-10">
              <p className="text-green-400 font-semibold text-lg mb-2">Request Sent!</p>
              <p className="text-zinc-400 text-sm">We&apos;ll reach out shortly with pricing and build time for your {wheel.name}.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Honeypot — hidden from humans, bots fill it */}
              <input
                type="text"
                value={form.honeypot}
                onChange={set('honeypot')}
                style={{ display: 'none' }}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />

              {/* ── Contact ── */}
              <fieldset>
                <legend className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Your Information</legend>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="q-name" className={labelCls}>Full Name <span className="text-zinc-500">*</span></label>
                    <input id="q-name" type="text" required value={form.name} onChange={setLettersOnly('name')} className={errors.name ? inputErrCls : inputCls} placeholder="John Smith" />
                    {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="q-email" className={labelCls}>Email <span className="text-zinc-500">*</span></label>
                      <input id="q-email" type="email" required value={form.email} onChange={set('email')} className={inputCls} placeholder="john@example.com" />
                    </div>
                    <div>
                      <label htmlFor="q-phone" className={labelCls}>Phone <span className="text-zinc-500">*</span></label>
                      <input id="q-phone" type="tel" required value={form.phone} onChange={setPhoneOnly('phone')} className={errors.phone ? inputErrCls : inputCls} placeholder="(555) 000-0000" />
                      {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
                    </div>
                  </div>
                </div>
              </fieldset>

              {/* ── Vehicle ── */}
              <fieldset>
                <legend className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Your Vehicle</legend>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label htmlFor="q-year" className={labelCls}>Year <span className="text-zinc-500">*</span></label>
                      <select id="q-year" required value={form.vehicleYear} onChange={set('vehicleYear')} className={inputCls}>
                        <option value="">Year</option>
                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="q-make" className={labelCls}>Make <span className="text-zinc-500">*</span></label>
                      <input id="q-make" type="text" required value={form.vehicleMake} onChange={set('vehicleMake')} className={inputCls} placeholder="BMW" />
                    </div>
                    <div>
                      <label htmlFor="q-model" className={labelCls}>Model <span className="text-zinc-500">*</span></label>
                      <input id="q-model" type="text" required value={form.vehicleModel} onChange={set('vehicleModel')} className={inputCls} placeholder="M5" />
                    </div>
                  </div>
                </div>
              </fieldset>

              {/* ── Build options ── */}
              <fieldset>
                <legend className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Your Build</legend>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="q-size" className={labelCls}>Size <span className="text-zinc-500">*</span></label>
                      <select id="q-size" required value={form.sizePreference} onChange={set('sizePreference')} className={inputCls}>
                        <option value="">Select size</option>
                        {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="q-staggered" className={labelCls}>Staggered?</label>
                      <select id="q-staggered" value={form.staggered} onChange={set('staggered')} className={inputCls}>
                        <option value="">Select</option>
                        {YES_NO.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="q-finish" className={labelCls}>Finish <span className="text-zinc-500">*</span></label>
                      <select id="q-finish" required value={form.finishPreference} onChange={set('finishPreference')} className={inputCls}>
                        <option value="">Select finish</option>
                        {FINISHES.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="q-cap" className={labelCls}>Center Cap</label>
                      <select id="q-cap" value={form.centerCap} onChange={set('centerCap')} className={inputCls}>
                        <option value="">Select</option>
                        {CENTER_CAPS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  {form.finishPreference === 'Color match / custom' && (
                    <div>
                      <label htmlFor="q-color" className={labelCls}>Color / paint code</label>
                      <input id="q-color" type="text" value={form.colorCode} onChange={set('colorCode')} className={inputCls} placeholder="e.g. Candy Red, or your vehicle paint code" />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="q-brakes" className={labelCls}>Big brakes (Brembo / Wilwood)?</label>
                      <select id="q-brakes" value={form.bigBrakes} onChange={set('bigBrakes')} className={inputCls}>
                        <option value="">Select</option>
                        {YES_NO.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="q-tires" className={labelCls}>Need tires?</label>
                      <select id="q-tires" value={form.needTires} onChange={set('needTires')} className={inputCls}>
                        <option value="">Select</option>
                        {TIRE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="q-message" className={labelCls}>Additional Notes</label>
                    <textarea
                      id="q-message"
                      value={form.message}
                      onChange={set('message')}
                      rows={3}
                      className={`${inputCls} resize-none`}
                      placeholder="Lift, suspension mods, skirts, steering wheel to match, or anything else we should know..."
                    />
                  </div>
                </div>
              </fieldset>

              <p className="text-zinc-500 text-xs leading-relaxed">
                By providing your phone number you consent to receive texts from us regarding your inquiry. Msg &amp; data rates may apply.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 text-base"
              >
                {loading ? 'Sending...' : 'Send Request'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
