'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import {
  IconShield,
  IconChevronDown,
  IconFileText,
  IconSmartphone,
  IconLock,
  IconMenu,
  IconX,
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
  const { isAuthenticated, user, openAuth, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const close = () => setIsOpen(false);

  const handleLogoClick = () => {
    if (isHome) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    close();
  };

  return (
    <>
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

        <div className="hidden md:flex items-center gap-3 shrink-0">
          {isAuthenticated ? (
            <>
              <span className="text-sm font-medium text-ink-700 truncate max-w-[160px]">
                {user?.full_name || user?.email}
              </span>
              <button
                onClick={logout}
                className="text-sm font-medium text-ink-700 hover:text-ink-900 transition"
              >
                Выйти
              </button>
            </>
          ) : (
            <button
              onClick={openAuth}
              className="text-sm font-medium text-ink-700 hover:text-ink-900 transition"
            >
              Войти
            </button>
          )}
          <Link
            href="/analyze"
            className="px-4 py-2.5 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-brand-hover transition"
          >
            Проверить документ
          </Link>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          aria-label="Открыть меню"
          className="md:hidden p-2 -mr-2 text-ink-700 shrink-0"
        >
          <IconMenu className="w-6 h-6" />
        </button>
      </div>
    </header>

      {/* Мобильное меню — вне <header>, т.к. backdrop-blur создаёт containing
          block для position:fixed и схлопывает панель до высоты хедера. */}
      <div
        className={`md:hidden fixed inset-0 z-50 transition-opacity duration-200 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="fixed inset-0 bg-black/40" onClick={close} />
        <div
          className={`absolute right-0 top-0 h-full w-72 max-w-[85vw] bg-white shadow-card-hover flex flex-col overflow-y-auto transition-transform duration-200 ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between h-16 px-5 border-b border-ink-100 shrink-0">
            <span className="font-semibold text-ink-900">Меню</span>
            <button onClick={close} aria-label="Закрыть меню" className="p-1 text-ink-500 hover:text-ink-900">
              <IconX className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 px-3 py-4 space-y-1 text-sm font-medium text-ink-700">
            <p className="px-3 pt-1 pb-1 text-xs font-semibold text-ink-400 uppercase tracking-wide">Продукт</p>
            {PRODUCT_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={close}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-ink-100 transition"
                >
                  <Icon className="w-[18px] h-[18px] text-brand shrink-0" />
                  <span className="text-ink-900">{item.label}</span>
                </Link>
              );
            })}

            <div className="h-px bg-ink-100 my-2" />

            {ANCHOR_LINKS.map((link) =>
              isHome ? (
                <a key={link.anchor} href={`#${link.anchor}`} onClick={close} className="block px-3 py-2.5 rounded-lg hover:bg-ink-100 transition">
                  {link.label}
                </a>
              ) : (
                <Link key={link.anchor} href={`/#${link.anchor}`} onClick={close} className="block px-3 py-2.5 rounded-lg hover:bg-ink-100 transition">
                  {link.label}
                </Link>
              )
            )}
            <Link href="/standards" onClick={close} className="block px-3 py-2.5 rounded-lg hover:bg-ink-100 transition">
              Стандарты
            </Link>
            <Link href="/pricing" onClick={close} className="block px-3 py-2.5 rounded-lg hover:bg-ink-100 transition">
              Тарифы
            </Link>
            <Link href="/about" onClick={close} className="block px-3 py-2.5 rounded-lg hover:bg-ink-100 transition">
              О нас
            </Link>
          </div>

          <div className="p-4 border-t border-ink-100 space-y-2 shrink-0">
            {isAuthenticated ? (
              <>
                <p className="px-1 text-sm text-ink-500 truncate">
                  Вы вошли как <span className="font-medium text-ink-900">{user?.full_name || user?.email}</span>
                </p>
                <button
                  onClick={() => { close(); logout(); }}
                  className="w-full px-4 py-2.5 text-sm font-medium text-ink-700 border border-ink-200 rounded-lg hover:bg-ink-100 transition"
                >
                  Выйти
                </button>
              </>
            ) : (
              <button
                onClick={() => { close(); openAuth(); }}
                className="w-full px-4 py-2.5 text-sm font-medium text-ink-700 border border-ink-200 rounded-lg hover:bg-ink-100 transition"
              >
                Войти
              </button>
            )}
            <Link
              href="/analyze"
              onClick={close}
              className="block w-full text-center px-4 py-2.5 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-brand-hover transition"
            >
              Проверить документ
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
