'use client';

import Link from 'next/link';
import Card from '../../components/ui/Card';
import { IconCheck, IconX } from '../../components/icons';
import { usePaymentTrigger } from '../../lib/payments';

export default function PricingClient() {
  const { startPayment, loadingTariff, error } = usePaymentTrigger();

  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-10 py-10">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-ink-900 mb-3">Выберите тариф</h1>
        <p className="text-ink-500">
          Первая проверка — всегда полный отчёт бесплатно. Дальше — платно, по вашему сценарию использования
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* БЕСПЛАТНЫЙ ТАРИФ */}
        <Card className="p-6 flex flex-col">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-ink-900">Бесплатный</h2>
            <p className="text-2xl font-bold text-ink-900 mt-2">0 ₽</p>
            <p className="text-xs text-ink-500">3 проверки навсегда, не в сутки</p>
          </div>

          <ul className="space-y-2.5 flex-1">
            <li className="flex items-start gap-2 text-sm text-ink-700">
              <IconCheck className="w-4 h-4 text-risk-low shrink-0 mt-0.5" /> 1-я проверка — полный отчёт с готовыми формулировками
            </li>
            <li className="flex items-start gap-2 text-sm text-ink-700">
              <IconCheck className="w-4 h-4 text-risk-low shrink-0 mt-0.5" /> 2-я и 3-я — превью: score и список рисков
            </li>
            <li className="flex items-start gap-2 text-sm text-ink-300">
              <IconX className="w-4 h-4 shrink-0 mt-0.5" /> Детали и формулировки во 2-й/3-й проверке
            </li>
            <li className="flex items-start gap-2 text-sm text-ink-300">
              <IconX className="w-4 h-4 shrink-0 mt-0.5" /> Проверки сверх лимита
            </li>
          </ul>

          <button
            disabled
            className="mt-6 w-full py-2.5 rounded-lg text-sm font-semibold bg-ink-100 text-ink-500 cursor-not-allowed"
          >
            Текущий тариф
          </button>
        </Card>

        {/* РАЗОВАЯ ПОКУПКА */}
        <Card className="p-6 flex flex-col">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-ink-900">Разовый отчёт</h2>
            <p className="text-2xl font-bold text-ink-900 mt-2">1 500 ₽</p>
            <p className="text-xs text-ink-500">за один документ, без подписки</p>
          </div>

          <ul className="space-y-2.5 flex-1">
            <li className="flex items-start gap-2 text-sm text-ink-700">
              <IconCheck className="w-4 h-4 text-risk-low shrink-0 mt-0.5" /> Полный отчёт по одному документу
            </li>
            <li className="flex items-start gap-2 text-sm text-ink-700">
              <IconCheck className="w-4 h-4 text-risk-low shrink-0 mt-0.5" /> Все статьи закона и рекомендации
            </li>
            <li className="flex items-start gap-2 text-sm text-ink-700">
              <IconCheck className="w-4 h-4 text-risk-low shrink-0 mt-0.5" /> Готовые формулировки для вставки
            </li>
            <li className="flex items-start gap-2 text-sm text-ink-300">
              <IconX className="w-4 h-4 shrink-0 mt-0.5" /> Без ежемесячного лимита проверок
            </li>
          </ul>

          <button
            onClick={() => startPayment('one_time')}
            disabled={loadingTariff !== null}
            className="mt-6 w-full py-2.5 rounded-lg text-sm font-semibold bg-ink-900 text-white hover:bg-ink-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingTariff === 'one_time' ? 'Открываем оплату...' : 'Купить отчёт'}
          </button>
        </Card>

        {/* ПОДПИСКА BASIC */}
        <Card className="p-6 flex flex-col">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-ink-900">Базовая подписка</h2>
            <p className="text-2xl font-bold text-ink-900 mt-2">2 500 ₽<span className="text-sm font-medium text-ink-500">/мес</span></p>
            <p className="text-xs text-ink-500">5 проверок в месяц</p>
          </div>

          <ul className="space-y-2.5 flex-1">
            <li className="flex items-start gap-2 text-sm text-ink-700">
              <IconCheck className="w-4 h-4 text-risk-low shrink-0 mt-0.5" /> 5 полных отчётов в месяц
            </li>
            <li className="flex items-start gap-2 text-sm text-ink-700">
              <IconCheck className="w-4 h-4 text-risk-low shrink-0 mt-0.5" /> Сохранение истории
            </li>
            <li className="flex items-start gap-2 text-sm text-ink-700">
              <IconCheck className="w-4 h-4 text-risk-low shrink-0 mt-0.5" /> Без автопродления — платите только когда нужно
            </li>
          </ul>

          <button
            onClick={() => startPayment('basic')}
            disabled={loadingTariff !== null}
            className="mt-6 w-full py-2.5 rounded-lg text-sm font-semibold bg-ink-900 text-white hover:bg-ink-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingTariff === 'basic' ? 'Открываем оплату...' : 'Оформить подписку'}
          </button>
        </Card>

        {/* ПОДПИСКА PRO */}
        <Card className="p-6 flex flex-col relative border-2 border-brand">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand text-white text-xs font-bold px-4 py-1 rounded-pill">
            ПОПУЛЯРНОЕ
          </div>

          <div className="mb-5">
            <h2 className="text-lg font-semibold text-ink-900">Pro подписка</h2>
            <p className="text-2xl font-bold text-ink-900 mt-2">5 000 ₽<span className="text-sm font-medium text-ink-500">/мес</span></p>
            <p className="text-xs text-ink-500">15 проверок в месяц</p>
          </div>

          <ul className="space-y-2.5 flex-1">
            <li className="flex items-start gap-2 text-sm text-ink-700">
              <IconCheck className="w-4 h-4 text-risk-low shrink-0 mt-0.5" /> 15 полных отчётов в месяц
            </li>
            <li className="flex items-start gap-2 text-sm text-ink-700">
              <IconCheck className="w-4 h-4 text-risk-low shrink-0 mt-0.5" /> Сохранение истории
            </li>
            <li className="flex items-start gap-2 text-sm text-ink-700">
              <IconCheck className="w-4 h-4 text-risk-low shrink-0 mt-0.5" /> Приоритетная поддержка
            </li>
            <li className="flex items-start gap-2 text-sm text-ink-700">
              <IconCheck className="w-4 h-4 text-risk-low shrink-0 mt-0.5" /> Без автопродления — платите только когда нужно
            </li>
          </ul>

          <button
            onClick={() => startPayment('pro')}
            disabled={loadingTariff !== null}
            className="mt-6 w-full py-2.5 rounded-lg text-sm font-semibold bg-brand text-white hover:bg-brand-hover transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingTariff === 'pro' ? 'Открываем оплату...' : 'Оформить подписку'}
          </button>
        </Card>
      </div>

      {error && (
        <p className="text-center mt-6 text-sm text-risk-high">{error}</p>
      )}

      <div className="text-center mt-10 text-sm text-ink-500">
        Оплата через ЮKassa. Ни разовая покупка, ни подписка не продлеваются автоматически — подписка действует 30 дней, для продолжения нужна повторная оплата.
        <br />
        <Link href="/offer" className="text-brand hover:text-brand-hover">
          Публичная оферта
        </Link>
      </div>
    </div>
  );
}
