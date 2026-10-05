'use client';
import { Wheel } from '@/types';

interface Props {
  series: string[];
  activeSeries: string;
  onChange: (s: string) => void;
  wheels: Wheel[];
}

export default function FilterBar({ series, activeSeries, onChange, wheels }: Props) {
  const countFor = (s: string) =>
    s === 'All' ? wheels.length : wheels.filter(w => w.series === s).length;

  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-3">
        <p className="text-zinc-400 text-sm font-semibold uppercase tracking-widest">
          {activeSeries === 'All'
            ? `All Styles · ${wheels.length} wheels`
            : `${activeSeries} · ${countFor(activeSeries)} wheels`}
        </p>
        <p className="text-zinc-500 text-sm">
          <span className="text-red-500 font-semibold">Authorized Dealer Catalog</span>
          {' '}— every set is built to order, tap a wheel to quote
        </p>
      </div>

      {/* Mobile: single scrollable row. Tablet+: wrap */}
      <div className="relative">
      <div className="flex flex-nowrap gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-x-visible sm:pb-0"
           style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        {['All', ...series].map(s => {
          const active = activeSeries === s;
          return (
            <button
              key={s}
              onClick={() => onChange(s)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-150 border-2 ${
                active
                  ? 'bg-red-700 border-red-700 text-white shadow-md shadow-red-900/40'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-red-700 hover:text-white'
              }`}
            >
              <span>{s === 'All' ? 'All' : s}</span>
              <span className={`text-xs font-bold rounded-full px-1.5 py-0.5 ${
                active ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-500'
              }`}>
                {countFor(s)}
              </span>
            </button>
          );
        })}
      </div>
      {/* Scroll fade hint — mobile only */}
      <div className="sm:hidden absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-zinc-950 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
