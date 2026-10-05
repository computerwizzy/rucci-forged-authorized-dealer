import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'www.rucciwheels.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'www.wheelsbelowretail.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://rines-and-wheels.myshopify.com https://*.myshopify.com https://www.wheelsbelowretail.com https://wheelsbelowretail.com",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
