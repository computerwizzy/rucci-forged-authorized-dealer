import Image from 'next/image';

const SITE = 'https://www.wheelsbelowretail.com';

const menus = [
  {
    heading: 'Customer Service',
    links: [
      { label: 'My Account', href: `${SITE}/account` },
      { label: 'Track My Order', href: `${SITE}/pages/track-my-order` },
      { label: 'Financing & Leasing', href: `${SITE}/pages/financing` },
      { label: 'Contact Us', href: `${SITE}/pages/contact` },
    ],
  },
  {
    heading: 'Information',
    links: [
      { label: 'Privacy Policy', href: `${SITE}/policies/privacy-policy` },
      { label: 'Refund Policy', href: `${SITE}/policies/refund-policy` },
      { label: 'Shipping Policy', href: `${SITE}/policies/shipping-policy` },
      { label: 'Terms and Conditions', href: `${SITE}/pages/terms-and-conditions` },
      { label: 'Terms of Service', href: `${SITE}/pages/terms-of-service` },
    ],
  },
  {
    heading: 'Wheel Guide',
    links: [
      { label: 'Wheel Visualizer', href: `${SITE}/pages/wheels-tires-fitment` },
      { label: 'Wheel Size Guide', href: `${SITE}/pages/find-wheel-size` },
      { label: 'Wheel Size Calculator', href: `${SITE}/pages/wheel-size-calculator` },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="bg-black text-gray-300 border-t border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

        {/* Brand info */}
        <div>
          <a href={SITE} target="_top" className="inline-block">
            <Image
              src={`${SITE}/cdn/shop/files/logo-white.png?v=1613769872&width=300`}
              alt="Wheels Below Retail"
              width={150}
              height={77}
              className="object-contain w-[150px] h-auto"
            />
          </a>
          <a href={SITE} target="_top" className="block mt-4 text-white font-bold tracking-wide uppercase hover:text-red-500 transition-colors">
            Wheels Below Retail
          </a>
          <address className="not-italic text-sm mt-2 leading-relaxed">
            <span className="font-semibold text-white">3025 Pelham Pkwy, Pelham, AL 35124</span><br />
            <a href="tel:2056441082" className="hover:text-white transition-colors">205-644-1082</a><br />
            <a href="mailto:sales@wheelsbelowretail.com" className="hover:text-white transition-colors">sales@wheelsbelowretail.com</a>
          </address>
          <div className="flex gap-4 mt-4">
            <a href="https://www.facebook.com/wheelsbelowretail" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-white transition-colors">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
                <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z" />
              </svg>
            </a>
            <a href="https://www.instagram.com/wheelsbelowretail/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-white transition-colors">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
                <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 0 1-1.38-.9 3.72 3.72 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16ZM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63a5.88 5.88 0 0 0-2.13 1.38A5.88 5.88 0 0 0 .63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.79.72 1.46 1.38 2.13a5.88 5.88 0 0 0 2.13 1.38c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.88 5.88 0 0 0 2.13-1.38 5.88 5.88 0 0 0 1.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.88 5.88 0 0 0-1.38-2.13A5.88 5.88 0 0 0 19.86.63C19.1.33 18.22.13 16.95.07 15.67.01 15.26 0 12 0Zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.4-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88Z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Menus */}
        {menus.map((menu) => (
          <div key={menu.heading}>
            <h2 className="text-white font-bold tracking-wide uppercase text-sm mb-4">{menu.heading}</h2>
            <ul className="space-y-2 text-sm">
              {menu.links.map((link) => (
                <li key={link.label}>
                  <a href={link.href} target="_top" className="hover:text-white transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Copyright */}
      <div className="border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 text-xs text-gray-500 text-center">
          &copy; {new Date().getFullYear()},{' '}
          <a href={SITE} target="_top" className="hover:text-white transition-colors">Wheels Below Retail</a>
        </div>
      </div>
    </footer>
  );
}
