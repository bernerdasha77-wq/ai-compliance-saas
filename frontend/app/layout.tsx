import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { GoogleOAuthProvider } from '@react-oauth/google';

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
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <html lang="ru" className={inter.className}>
        <body className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
          {children}

          {/* ПОДВАЛ (footer) — виден на всех страницах */}
          <footer className="border-t border-gray-200 dark:border-gray-700 py-4 px-4 text-center text-sm text-gray-500 dark:text-gray-400">
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4">
              <Link href="/offer" className="hover:text-gray-700 dark:hover:text-gray-300 transition">
                Публичная оферта
              </Link>
              <span className="hidden sm:inline">|</span>
              <Link href="/about" className="hover:text-gray-700 dark:hover:text-gray-300 transition">
                О проекте
              </Link>
              <span className="hidden sm:inline">|</span>
              <a
                href="mailto:aicompl26@gmail.com"
                className="hover:text-gray-700 dark:hover:text-gray-300 transition"
              >
                📧 Поддержка
              </a>
            </div>
            <div className="mt-1 text-xs opacity-60">
              © 2026 AI Compliance Checker
            </div>
          </footer>
        </body>
      </html>
    </GoogleOAuthProvider>
  );
}