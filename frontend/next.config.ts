import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',  // ← ВКЛЮЧАЕМ СТАТИЧЕСКИЙ ЭКСПОРТ
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;