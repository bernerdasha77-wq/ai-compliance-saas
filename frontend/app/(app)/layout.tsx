'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';

function Footer() {
  return (
    <footer className="border-t border-ink-100 py-4 px-6 sm:px-10 text-center text-sm text-ink-500">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4">
        <Link href="/offer" className="hover:text-ink-900 transition">
          Публичная оферта
        </Link>
        <span className="hidden sm:inline text-ink-300">|</span>
        <Link href="/about" className="hover:text-ink-900 transition">
          О нас
        </Link>
        <span className="hidden sm:inline text-ink-300">|</span>
        <a href="mailto:aicompl26@gmail.com" className="hover:text-ink-900 transition">
          Поддержка
        </a>
      </div>
      <div className="mt-1 text-xs text-ink-300">© 2026 AI Compliance Checker</div>
    </footer>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
