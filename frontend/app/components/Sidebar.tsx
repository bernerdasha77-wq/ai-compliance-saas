'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import { IconShield, IconHome, IconHistory, IconTag, IconInfo, IconSettings, IconLogout } from './icons';

const NAV_ITEMS = [
  { href: '/analyze', label: 'Проверка документа', icon: IconHome },
  { href: '/history', label: 'Мои отчёты', icon: IconHistory },
  { href: '/pricing', label: 'Тарифы', icon: IconTag },
  { href: '/about', label: 'О проекте', icon: IconInfo },
];

const ADMIN_EMAIL = 'bernerdasha@yandex.ru';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, openAuth, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <aside className="w-64 shrink-0 bg-navy text-white flex flex-col h-screen sticky top-0 sidebar-scroll overflow-y-auto">
      <Link href="/" className="flex items-center gap-2.5 px-5 h-16 border-b border-navy-700 shrink-0">
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
            onClick={openAuth}
            className="w-full px-3 py-2.5 bg-brand hover:bg-brand-hover rounded-lg text-sm font-semibold transition"
          >
            Войти / Регистрация
          </button>
        )}
      </div>
    </aside>
  );
}
