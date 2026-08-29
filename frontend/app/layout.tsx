import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Script from 'next/script';
import { AuthProvider } from './lib/auth-context';
import AuthModal from './components/AuthModal';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

const DESCRIPTION = 'AI-проверка документов на риски и соответствие 152-ФЗ, GDPR, ISO 27001 и NIS2 за минуты';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.ai-compliance.online'),
  title: 'AI Compliance Checker',
  description: DESCRIPTION,
  openGraph: {
    title: 'AI Compliance Checker',
    description: DESCRIPTION,
    url: 'https://www.ai-compliance.online',
    siteName: 'AI Compliance Checker',
    locale: 'ru_RU',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={inter.className}>
      <body className="bg-white text-ink-900">
        <AuthProvider>
          {children}
          <AuthModal />
        </AuthProvider>

        {/* ===== GOOGLE ANALYTICS ===== */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-L5XSROKW7H"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-L5XSROKW7H');
          `}
        </Script>
      </body>
    </html>
  );
}
