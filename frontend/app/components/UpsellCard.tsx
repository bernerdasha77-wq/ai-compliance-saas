'use client';

import Link from 'next/link';
import Card from './ui/Card';
import { usePaymentTrigger } from '../lib/payments';
import { ANALYZE_SUSPENDED, SUSPENSION_MESSAGE } from '../lib/maintenance';

export default function UpsellCard({
  variant = 'teaser',
  checksRemaining,
}: {
  variant?: 'teaser' | 'limit';
  checksRemaining?: number;
}) {
  const { startPayment, loadingTariff, error } = usePaymentTrigger();
  const title =
    variant === 'limit'
      ? 'Бесплатные проверки закончились'
      : 'Получите полный отчёт с готовыми правками';

  const subtitle =
    variant === 'limit'
      ? 'Вы использовали все 3 бесплатные проверки. Чтобы продолжить — выберите тариф.'
      : typeof checksRemaining === 'number'
        ? `Это упрощённый результат без деталей. Осталось бесплатных проверок: ${checksRemaining}.`
        : 'Это упрощённый результат без деталей — статья закона, объяснение и готовая формулировка доступны в полном отчёте.';

  return (
    <Card className="p-6 sm:p-8 border-brand/20 bg-brand-light">
      <h3 className="text-lg font-semibold text-ink-900 mb-1.5">{title}</h3>
      <p className="text-sm text-ink-700 mb-6">{subtitle}</p>

      <div className="grid sm:grid-cols-3 gap-3">
        <button
          onClick={() => startPayment('one_time')}
          disabled={loadingTariff !== null || ANALYZE_SUSPENDED}
          className="text-left p-4 rounded-card bg-white border border-ink-100 hover:border-brand/40 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <p className="text-lg font-bold text-ink-900">1 500 ₽</p>
          <p className="text-xs text-ink-500 mb-2">разовая покупка</p>
          <p className="text-sm font-medium text-brand">
            {ANALYZE_SUSPENDED ? 'Временно недоступно' : loadingTariff === 'one_time' ? 'Открываем оплату...' : 'Купить этот отчёт'}
          </p>
        </button>

        <button
          onClick={() => startPayment('basic')}
          disabled={loadingTariff !== null || ANALYZE_SUSPENDED}
          className="text-left p-4 rounded-card bg-white border border-ink-100 hover:border-brand/40 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <p className="text-lg font-bold text-ink-900">2 500 ₽<span className="text-sm font-medium text-ink-500">/мес</span></p>
          <p className="text-xs text-ink-500 mb-2">5 проверок в месяц</p>
          <p className="text-sm font-medium text-brand">
            {ANALYZE_SUSPENDED ? 'Временно недоступно' : loadingTariff === 'basic' ? 'Открываем оплату...' : 'Оформить подписку'}
          </p>
        </button>

        <button
          onClick={() => startPayment('pro')}
          disabled={loadingTariff !== null || ANALYZE_SUSPENDED}
          className="text-left p-4 rounded-card bg-white border border-ink-100 hover:border-brand/40 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <p className="text-lg font-bold text-ink-900">5 000 ₽<span className="text-sm font-medium text-ink-500">/мес</span></p>
          <p className="text-xs text-ink-500 mb-2">15 проверок в месяц</p>
          <p className="text-sm font-medium text-brand">
            {ANALYZE_SUSPENDED ? 'Временно недоступно' : loadingTariff === 'pro' ? 'Открываем оплату...' : 'Оформить подписку'}
          </p>
        </button>
      </div>

      {ANALYZE_SUSPENDED && <p className="mt-4 text-sm text-risk-medium">{SUSPENSION_MESSAGE}</p>}
      {!ANALYZE_SUSPENDED && error && <p className="mt-4 text-sm text-risk-high">{error}</p>}

      <Link href="/pricing" className="inline-block mt-4 text-sm text-brand hover:text-brand-hover transition">
        Все тарифы →
      </Link>
    </Card>
  );
}
