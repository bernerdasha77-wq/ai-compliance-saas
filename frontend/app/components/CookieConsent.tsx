'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';

const STORAGE_KEY = 'cookie_consent';
const GA_ID = 'G-L5XSROKW7H';

type Consent = 'accepted' | 'declined' | null;

export default function CookieConsent() {
  const [consent, setConsent] = useState<Consent>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'accepted' || stored === 'declined') setConsent(stored);
    setChecked(true);
  }, []);

  const decide = (value: 'accepted' | 'declined') => {
    localStorage.setItem(STORAGE_KEY, value);
    setConsent(value);
  };

  return (
    <>
      {consent === 'accepted' && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}');
            `}
          </Script>
        </>
      )}

      {checked && consent === null && (
        <div className="fixed bottom-0 inset-x-0 z-40 border-t border-ink-100 bg-white shadow-card-hover">
          <div className="max-w-6xl mx-auto px-6 sm:px-10 py-4 flex flex-col sm:flex-row items-center gap-4">
            <p className="text-sm text-ink-700 flex-1">
              Мы используем cookie для аналитики. Подробнее —{' '}
              <Link href="/privacy" className="text-brand hover:text-brand-hover underline underline-offset-2">
                в политике конфиденциальности
              </Link>
              .
            </p>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => decide('declined')}
                className="px-4 py-2 text-sm font-medium text-ink-700 border border-ink-100 rounded-card hover:border-brand/40 transition"
              >
                Отклонить
              </button>
              <button
                onClick={() => decide('accepted')}
                className="px-4 py-2 text-sm font-semibold text-white bg-brand rounded-card hover:bg-brand-hover transition"
              >
                Принять
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
