'use client';
import Image from 'next/image';
import { Wheel } from '@/types';

interface Props {
  wheel: Wheel;
  onDetailClick: (wheel: Wheel) => void;
}

export default function WheelCard({ wheel, onDetailClick }: Props) {
  return (
    <div
      onClick={() => onDetailClick(wheel)}
      className="bg-zinc-900 border border-zinc-700 rounded-lg overflow-hidden hover:scale-[1.02] hover:border-zinc-500 transition-all duration-200 cursor-pointer"
    >
      <div className="relative aspect-square">
        <Image
          src={wheel.imageUrl}
          alt={wheel.name}
          fill
          className="object-contain p-4"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        />
      </div>
      <div className="p-3 sm:p-4">
        <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-red-500">
          {wheel.series}
        </span>
        <h3 className="text-white font-black text-base sm:text-lg mt-0.5 sm:mt-1 leading-tight uppercase tracking-wide">{wheel.name}</h3>
        <div className="mt-3 w-full bg-red-700 hover:bg-red-800 text-white font-semibold py-2 px-3 rounded text-center text-xs sm:text-sm transition-colors">
          View Details
        </div>
      </div>
    </div>
  );
}
