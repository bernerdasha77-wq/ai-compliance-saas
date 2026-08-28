import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Script from 'next/script';
import { AuthProvider } from './lib/auth-context';
import AuthModal from './components/AuthModal';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  title: 'AI Compliance Checker',
  description: 'Проверка договоров на соответствие требованиям кибербезопасности',
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
