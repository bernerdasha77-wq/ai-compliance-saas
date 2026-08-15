...have been deleted, the branch may not exis


import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // <- Указываем режим сборки для продакшена
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;