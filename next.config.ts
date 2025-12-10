import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    tsconfigPath: './tsconfig.build.json'
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-76304578acde4439afba93b377f6b24c.r2.dev',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
