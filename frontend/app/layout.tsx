import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from './lib/auth-context';
import AuthModal from './components/AuthModal';
import CookieConsent from './components/CookieConsent';

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

        <CookieConsent />
      </body>
    </html>
  );
}
