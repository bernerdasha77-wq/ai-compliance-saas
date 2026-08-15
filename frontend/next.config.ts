import type { NextConfig } from "next";

const nextConfig: NextConfig = {
 // output: 'export',  // ← РЕЖИМ ЭКСПОРТА
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
};

//export default nextConfig;