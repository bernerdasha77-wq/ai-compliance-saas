import type { Metadata } from 'next';
import Link from 'next/link';
import Card from '../components/ui/Card';
import ProgressBar from '../components/ui/ProgressBar';
import {
  IconShield,
  IconLock,
  IconUpload,
  IconSearch,
  IconFileText,
  IconGlobe,
  IconInfo,
  IconKey,
} from '../components/icons';

const TITLE = 'AI Compliance Checker — проверка договоров на соответствие 152-ФЗ, GDPR, ISO 27001';
const DESCRIPTION =
  'AI-анализ договоров, EULA и политик конфиденциальности на соответствие 152-ФЗ, GDPR, ISO 27001 и NIS2. Найдите риски и получите готовые формулировки для исправления за пару минут.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: '/',
    type: 'website',
    locale: 'ru_RU',
  },
};

const steps = [
  { icon: IconUpload, title: 'Загрузите документ', text: 'PDF или DOCX — договор, EULA или политику конфиденциальности' },
  { icon: IconSearch, title: 'AI анализирует', text: 'Проверка по 152-ФЗ, GDPR, ISO 27001 и другим применимым стандартам' },
  { icon: IconFileText, title: 'Получите отчёт', text: 'Score, найденные риски и готовые формулировки для исправления' },
];

const security = [
  { icon: IconLock, title: 'Документ не хранится', text: 'Анализируется в оперативной памяти и удаляется сразу после обработки — не остаётся ни на сервере, ни в базе данных.' },
  { icon: IconGlobe, title: 'Передача защищена', text: 'Все данные передаются по HTTPS — защищённому каналу связи.' },
  { icon: IconInfo, title: 'Как обрабатывается документ', text: 'Для анализа документ временно обрабатывается AI-моделью. Подробности о том, как обрабатываются ваши данные — в политике конфиденциальности.' },
  { icon: IconKey, title: 'Пароли защищены', text: 'Хранятся в виде необратимого хеша (bcrypt) — даже мы не можем увидеть ваш пароль.' },
];

function HeroScoreRing() {
  const score = 82;
  const size = 88;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#F1F5F9" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#D97706"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-bold text-risk-medium">{score}</span>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div>
      {/* HERO */}
      <section className="max-w-6xl mx-auto px-6 sm:px-10 pt-16 pb-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-xs font-semibold tracking-widest text-brand uppercase mb-4">
            AI-анализ документов
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-ink-900 leading-tight mb-5">
            Найдите риски до того, как они станут проблемой.
          </h1>
          <p className="text-lg text-ink-700 leading-relaxed mb-8 max-w-lg">
            Загрузите договор, EULA или политику конфиденциальности — AI проверит соответствие
            152-ФЗ, GDPR, ISO 27001 и NIS2 за минуты, а не часы работы юриста.
          </p>
          <Link
            href="/analyze"
            className="inline-block px-6 py-3.5 bg-brand text-white font-semibold rounded-lg hover:bg-brand-hover transition mb-6"
          >
            Проверить документ →
          </Link>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-500">
            <span className="flex items-center gap-1.5">
              <IconLock className="w-4 h-4 text-risk-low" />
              Безопасная обработка
            </span>
            <span className="flex items-center gap-1.5">
              <IconShield className="w-4 h-4 text-risk-low" />
              Конфиденциальность
            </span>
          </div>
        </div>

        <Card className="p-6 sm:p-7">
          <div className="flex items-center gap-4 mb-6">
            <HeroScoreRing />
            <div>
              <p className="text-xs text-ink-500 font-medium uppercase tracking-wide">Общий риск</p>
              <p className="text-lg font-semibold text-risk-medium">Умеренный риск</p>
            </div>
          </div>
          <div className="space-y-4">
            <ProgressBar label="GDPR" value={91} />
            <ProgressBar label="ISO 27001" value={86} />
            <ProgressBar label="NIS2" value={73} />
          </div>
          <Link
            href="/example-report"
            className="inline-block mt-6 text-sm font-medium text-brand hover:text-brand-hover transition"
          >
            Посмотреть пример отчёта →
          </Link>
        </Card>
      </section>

      {/* КАК ЭТО РАБОТАЕТ */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-6 sm:px-10 py-16 scroll-mt-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-ink-900 mb-10 text-center">
          Как это работает
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <Card key={step.title} className="p-6 relative">
                <span className="absolute top-4 right-4 text-xs font-semibold text-ink-300">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-brand-light mb-4">
                  <Icon className="w-5 h-5 text-brand" />
                </div>
                <h3 className="font-semibold text-ink-900 mb-1.5">{step.title}</h3>
                <p className="text-sm text-ink-500 leading-relaxed">{step.text}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* БЕЗОПАСНОСТЬ */}
      <section id="security" className="max-w-6xl mx-auto px-6 sm:px-10 py-16 scroll-mt-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-ink-900 mb-6 text-center">
          Безопасность
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {security.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="p-5 flex items-start gap-4">
                <div className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-ink-100">
                  <Icon className="w-5 h-5 text-ink-700" />
                </div>
                <div>
                  <p className="font-medium text-ink-900">{item.title}</p>
                  <p className="text-sm text-ink-500">{item.text}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ТИЗЕР СТАНДАРТОВ */}
      <section className="max-w-6xl mx-auto px-6 sm:px-10 py-16">
        <Card className="p-8 sm:p-12 text-center bg-brand-light border-brand/15">
          <h2 className="text-2xl font-bold text-ink-900 mb-3">
            Проверяем по официальным текстам законов
          </h2>
          <p className="text-ink-700 max-w-xl mx-auto mb-6">
            152-ФЗ, GDPR и NIS2 — по официальным текстам нормативных актов. ISO 27001 — по общим
            публично известным требованиям стандарта, без доступа к платному оригиналу.
          </p>
          <Link
            href="/standards"
            className="inline-block px-6 py-3 bg-brand text-white font-semibold rounded-lg hover:bg-brand-hover transition"
          >
            Посмотреть стандарты →
          </Link>
        </Card>
      </section>
    </div>
  );
}
