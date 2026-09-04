'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import { IconShield, IconHome, IconHistory, IconTag, IconInfo, IconSettings, IconLogout, IconMenu, IconX } from './icons';

const NAV_ITEMS = [
  { href: '/analyze', label: 'Проверка документа', icon: IconHome },
  { href: '/history', label: 'Мои отчёты', icon: IconHistory },
  { href: '/pricing', label: 'Тарифы', icon: IconTag },
  { href: '/faq', label: 'Помощь', icon: IconInfo },
];

const ADMIN_EMAIL = 'bernerdasha@yandex.ru';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, openAuth, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const close = () => setIsOpen(false);

  const handleLogout = () => {
    logout();
    close();
    router.push('/');
  };

  const navBody = (
    <>
      <Link href="/" onClick={close} className="flex items-center gap-2.5 px-5 h-16 border-b border-navy-700 shrink-0">
        <IconShield className="w-6 h-6 text-brand" />
        <span className="font-semibold text-[15px] leading-tight">AI Compliance<br />Checker</span>
      </Link>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={close}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                active
                  ? 'bg-brand text-white'
                  : 'text-navy-300 hover:bg-navy-700 hover:text-white'
              }`}
            >
              <Icon className="w-[18px] h-[18px]" />
              {label}
            </Link>
          );
        })}

        {isAuthenticated && user?.email === ADMIN_EMAIL && (
          <Link
            href="/admin"
            onClick={close}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
              pathname === '/admin'
                ? 'bg-brand text-white'
                : 'text-navy-300 hover:bg-navy-700 hover:text-white'
            }`}
          >
            <IconSettings className="w-[18px] h-[18px]" />
            Админка
          </Link>
        )}
      </nav>

      <div className="px-3 py-4 border-t border-navy-700 shrink-0">
        {isAuthenticated ? (
          <div className="space-y-2">
            <div className="px-3 py-2 rounded-lg bg-navy-700/60">
              <p className="text-xs text-navy-300">Вы вошли как</p>
              <p className="text-sm font-medium text-white truncate">
                {user?.full_name || user?.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-navy-300 hover:bg-navy-700 hover:text-white transition"
            >
              <IconLogout className="w-[18px] h-[18px]" />
              Выйти
            </button>
          </div>
        ) : (
          <button
            onClick={() => { close(); openAuth(); }}
            className="w-full px-3 py-2.5 bg-brand hover:bg-brand-hover rounded-lg text-sm font-semibold transition"
          >
            Войти / Регистрация
          </button>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Мобильный верхний бар — заменяет постоянный сайдбар на узких экранах */}
      <header className="md:hidden flex items-center justify-between h-14 px-4 bg-navy text-white shrink-0 sticky top-0 z-30">
        <Link href="/" className="flex items-center gap-2">
          <IconShield className="w-5 h-5 text-brand" />
          <span className="font-semibold text-sm">AI Compliance Checker</span>
        </Link>
        <button onClick={() => setIsOpen(true)} aria-label="Открыть меню" className="p-2 -mr-2 text-navy-300 hover:text-white">
          <IconMenu className="w-6 h-6" />
        </button>
      </header>

      {/* Мобильная выезжающая панель */}
      <div
        className={`md:hidden fixed inset-0 z-50 transition-opacity duration-200 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="fixed inset-0 bg-black/50" onClick={close} />
        <aside
          className={`absolute left-0 top-0 h-full w-64 max-w-[80vw] bg-navy text-white flex flex-col overflow-y-auto transition-transform duration-200 ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <button onClick={close} aria-label="Закрыть меню" className="absolute top-5 right-4 p-1 text-navy-300 hover:text-white">
            <IconX className="w-5 h-5" />
          </button>
          {navBody}
        </aside>
      </div>

      {/* Постоянный сайдбар на широких экранах */}
      <aside className="hidden md:flex w-64 shrink-0 bg-navy text-white flex-col h-screen sticky top-0 sidebar-scroll overflow-y-auto">
        {navBody}
      </aside>
    </>
  );
}
