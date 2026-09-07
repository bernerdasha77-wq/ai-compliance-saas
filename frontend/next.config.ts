import type { NextConfig } from "next";

// Google Analytics (googletagmanager.com) грузится условно, только после
// cookie-согласия (см. CookieConsent.tsx) — через next/script с инлайн-кодом
// инициализации, поэтому 'unsafe-inline' в script-src пока нужен (сам GA-тег
// и часть бутстрап-кода Next.js — тоже инлайн). Полный переход на nonce
// потребовал бы отдельного middleware — не делаем сейчас, чтобы не рисковать
// регрессией ради этой правки.
// В dev фронтенд обычно ходит на локальный бэкенд (localhost:8000), а не на
// прод-домен API — без этого локальный fetch блокировался бы самим же CSP.
const connectSrc =
  process.env.NODE_ENV === 'production'
    ? "connect-src 'self' https://ai-compliance-online-api.fly.dev https://www.google-analytics.com https://www.googletagmanager.com https://*.google-analytics.com"
    : "connect-src 'self' http://localhost:8000 https://www.google-analytics.com https://www.googletagmanager.com https://*.google-analytics.com";

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://www.google-analytics.com https://www.googletagmanager.com",
  "font-src 'self' data:",
  connectSrc,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const nextConfig: NextConfig = {
  //output: 'export',  // ← ВКЛЮЧАЕМ СТАТИЧЕСКИЙ ЭКСПОРТ
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: CSP },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;