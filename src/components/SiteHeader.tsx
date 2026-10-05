import Image from 'next/image';

export default function SiteHeader() {
  return (
    <>
      {/* Red top bar */}
      <div className="bg-red-700 text-white py-2 px-4 text-center leading-relaxed">
        <span className="text-xs sm:text-sm font-semibold uppercase tracking-wide">For Custom Quote and Availability Call </span>
        <a
          href="tel:2056441082"
          className="text-xs sm:text-sm font-bold tracking-widest uppercase underline hover:text-red-200 transition-colors"
        >
          205-644-1082
        </a>
      </div>

      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">

          {/* Logo */}
          <a href="https://www.wheelsbelowretail.com" target="_top" className="flex-shrink-0">
            <Image
              src="https://www.wheelsbelowretail.com/cdn/shop/files/logo_ab2d699e-4150-4a03-8027-2c7d6dc1f653.png?v=1650604568&width=150"
              alt="Wheels Below Retail"
              width={120}
              height={48}
              className="object-contain w-24 sm:w-[120px] h-auto"
              priority
            />
          </a>

          {/* Marquee - center (desktop only) */}
          <div className="hidden sm:block border-2 border-red-600 bg-red-50 rounded-lg py-3 shadow-sm shadow-red-200 overflow-hidden flex-1 mx-6">
            <div className="flex whitespace-nowrap" style={{ animation: 'marquee 18s linear infinite', WebkitAnimation: 'marquee 18s linear infinite', willChange: 'transform' }}>
              <span className="text-gray-700 text-sm font-semibold px-4">
                Built to Order &nbsp;•&nbsp; 20&quot; to 34&quot; &nbsp;•&nbsp; Chrome, Gold, Brushed &amp; Color Match &nbsp;•&nbsp; Finance Available &nbsp;•&nbsp; Personalized Quotes &nbsp;•&nbsp; $55 Down if Qualified &nbsp;•&nbsp;
              </span>
              <span className="text-gray-700 text-sm font-semibold px-4" aria-hidden="true">
                Built to Order &nbsp;•&nbsp; 20&quot; to 34&quot; &nbsp;•&nbsp; Chrome, Gold, Brushed &amp; Color Match &nbsp;•&nbsp; Finance Available &nbsp;•&nbsp; Personalized Quotes &nbsp;•&nbsp; $55 Down if Qualified &nbsp;•&nbsp;
              </span>
            </div>
          </div>
          <style>{`@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } } @-webkit-keyframes marquee { from { -webkit-transform: translateX(0) } to { -webkit-transform: translateX(-50%) } }`}</style>

          {/* Rucci badge */}
          <div className="flex-shrink-0 border-l border-gray-200 pl-4 sm:pl-6">
            <div className="text-gray-400 text-[9px] sm:text-[10px] tracking-[0.25em] uppercase font-medium">Authorized Dealer</div>
            <div className="text-black font-black text-base sm:text-lg tracking-widest uppercase">RUCCI FORGED</div>
          </div>

        </div>

        {/* Build time - mobile only, full width below logo row */}
        <div className="sm:hidden px-4 pb-3">
          <div className="border-2 border-red-600 bg-red-50 rounded-lg py-2 overflow-hidden">
            <div className="flex whitespace-nowrap" style={{ animation: 'marquee 18s linear infinite', WebkitAnimation: 'marquee 18s linear infinite', willChange: 'transform' }}>
              <span className="text-gray-700 text-xs font-semibold px-4">
                Built to Order &nbsp;•&nbsp; 20&quot; to 34&quot; &nbsp;•&nbsp; Chrome, Gold, Brushed &amp; Color Match &nbsp;•&nbsp; Finance Available &nbsp;•&nbsp; Personalized Quotes &nbsp;•&nbsp; $55 Down if Qualified &nbsp;•&nbsp;
              </span>
              <span className="text-gray-700 text-xs font-semibold px-4" aria-hidden="true">
                Built to Order &nbsp;•&nbsp; 20&quot; to 34&quot; &nbsp;•&nbsp; Chrome, Gold, Brushed &amp; Color Match &nbsp;•&nbsp; Finance Available &nbsp;•&nbsp; Personalized Quotes &nbsp;•&nbsp; $55 Down if Qualified &nbsp;•&nbsp;
              </span>
            </div>
          </div>
        </div>

      </header>


    </>
  );
}
