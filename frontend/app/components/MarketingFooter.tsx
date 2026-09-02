import Link from 'next/link';
import { IconShield } from './icons';

export default function MarketingFooter() {
  return (
    <footer className="border-t border-ink-100 mt-20">
      <div className="max-w-6xl mx-auto px-6 sm:px-10 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <IconShield className="w-5 h-5 text-brand" />
            <span className="font-semibold text-sm text-ink-900">AI Compliance Checker</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-ink-500">
            <Link href="/blog" className="hover:text-ink-900 transition">
              Блог
            </Link>
            <Link href="/faq" className="hover:text-ink-900 transition">
              FAQ
            </Link>
            <Link href="/privacy" className="hover:text-ink-900 transition">
              Политика конфиденциальности
            </Link>
            <Link href="/terms" className="hover:text-ink-900 transition">
              Пользовательское соглашение
            </Link>
            <Link href="/offer" className="hover:text-ink-900 transition">
              Публичная оферта
            </Link>
            <Link href="/about" className="hover:text-ink-900 transition">
              О нас
            </Link>
            <a href="mailto:aicompl26@gmail.com" className="hover:text-ink-900 transition">
              aicompl26@gmail.com
            </a>
          </div>
        </div>

        <div className="border-t border-ink-100 mt-6 pt-6">
          <p className="text-xs text-ink-500 max-w-2xl">
            Автоматизированная проверка документов, а не юридическая консультация. Результаты —
            ориентир для дальнейшей работы с юристом.
          </p>
          <p className="text-xs text-ink-500 mt-2">Реквизиты — в публичной оферте</p>
          <p className="text-xs text-ink-300 mt-2">© 2026 AI Compliance Checker</p>
        </div>
      </div>
    </footer>
  );
}
