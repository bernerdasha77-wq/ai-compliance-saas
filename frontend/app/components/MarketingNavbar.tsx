'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import {
  IconShield,
  IconChevronDown,
  IconFileText,
  IconSmartphone,
  IconLock,
} from './icons';

const PRODUCT_ITEMS = [
  { href: '/analyze', label: 'Договор с контрагентом', icon: IconFileText },
  { href: '/analyze', label: 'EULA / Terms', icon: IconSmartphone },
  { href: '/analyze', label: 'Политика конфиденциальности', icon: IconLock },
];

const ANCHOR_LINKS = [
  { anchor: 'how-it-works', label: 'Как это работает' },
  { anchor: 'security', label: 'Безопасность' },
];

const NAV_LINK_CLASS =
  'px-3 py-2 rounded-lg hover:bg-ink-100 hover:text-ink-900 transition whitespace-nowrap';

export default function MarketingNavbar() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const { openAuth } = useAuth();

  const handleLogoClick = () => {
    if (isHome) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-ink-100">
      <div className="max-w-6xl mx-auto px-6 sm:px-10 h-16 flex items-center justify-between gap-6">
        <Link href="/" onClick={handleLogoClick} className="flex items-center gap-2.5 shrink-0">
          <IconShield className="w-6 h-6 text-brand" />
          <span className="font-semibold text-[15px] text-ink-900">AI Compliance Checker</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-ink-700">
          <div className="relative group">
            <button className={`flex items-center gap-1 ${NAV_LINK_CLASS}`}>
              Продукт
              <IconChevronDown className="w-4 h-4" />
            </button>
            <div className="absolute left-0 top-full pt-2 hidden group-hover:block">
              <div className="w-72 bg-white border border-ink-100 rounded-card shadow-card-hover p-2">
                {PRODUCT_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-ink-100 transition"
                    >
                      <Icon className="w-[18px] h-[18px] text-brand shrink-0" />
                      <span className="text-ink-900">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {ANCHOR_LINKS.map((link) =>
            isHome ? (
              <a key={link.anchor} href={`#${link.anchor}`} className={NAV_LINK_CLASS}>
                {link.label}
              </a>
            ) : (
              <Link key={link.anchor} href={`/#${link.anchor}`} className={NAV_LINK_CLASS}>
                {link.label}
              </Link>
            )
          )}

          <Link href="/standards" className={NAV_LINK_CLASS}>
            Стандарты
          </Link>
          <Link href="/pricing" className={NAV_LINK_CLASS}>
            Тарифы
          </Link>
          <Link href="/about" className={NAV_LINK_CLASS}>
            О нас
          </Link>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={openAuth}
            className="text-sm font-medium text-ink-700 hover:text-ink-900 transition"
          >
            Войти
          </button>
          <Link
            href="/analyze"
            className="px-4 py-2.5 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-brand-hover transition"
          >
            Проверить документ
          </Link>
        </div>
      </div>
    </header>
  );
}
