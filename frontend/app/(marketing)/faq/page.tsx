import type { Metadata } from 'next';
import Link from 'next/link';
import Card from '../../components/ui/Card';

const TITLE = 'Частые вопросы — AI Compliance Checker';
const DESCRIPTION =
  'Кто стоит за сервисом, откуда AI берёт статьи закона, сохраняются ли документы, и сколько стоит проверка — прямые ответы на главные вопросы о AI Compliance Checker.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: '/faq',
    type: 'website',
    locale: 'ru_RU',
  },
};

interface FAQItem {
  question: string;
  answer: React.ReactNode;
  /** Plain-text версия ответа для JSON-LD — без JSX-ссылок. */
  answerText: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'Это не мошенничество? Кто стоит за сервисом?',
    answer: (
      <>
        Нет, сервис работает как официально зарегистрированная самозанятая деятельность на
        основании 422-ФЗ. Юридические реквизиты (ИНН, статус) указаны в{' '}
        <Link href="/offer" className="text-brand hover:text-brand-hover transition">
          публичной оферте
        </Link>
        .
      </>
    ),
    answerText:
      'Нет, сервис работает как официально зарегистрированная самозанятая деятельность на основании 422-ФЗ. Юридические реквизиты (ИНН, статус) указаны в публичной оферте (/offer).',
  },
  {
    question: 'Как именно работает анализ — ИИ просто выдумывает ответы?',
    answer: (
      <>
        Нет: для 152-ФЗ, GDPR и NIS2 модель цитирует реальный текст нормативных актов из
        проиндексированной базы, а не полагается на память. Для ISO 27001 у нас нет доступа к
        официальному платному тексту стандарта — оценка даётся по общим публично известным
        требованиям, а не по цитированию оригинала. Подробности — на странице{' '}
        <Link href="/standards" className="text-brand hover:text-brand-hover transition">
          Стандарты
        </Link>
        .
      </>
    ),
    answerText:
      'Нет: для 152-ФЗ, GDPR и NIS2 модель цитирует реальный текст нормативных актов из проиндексированной базы, а не полагается на память. Для ISO 27001 у нас нет доступа к официальному платному тексту стандарта — оценка даётся по общим публично известным требованиям, а не по цитированию оригинала. Подробности — на странице Стандарты (/standards).',
  },
  {
    question: 'Мои документы сохраняются на сервере?',
    answer:
      'Нет. Файл анализируется в оперативной памяти и удаляется сразу после обработки — не сохраняется ни на сервере, ни в базе данных.',
    answerText:
      'Нет. Файл анализируется в оперативной памяти и удаляется сразу после обработки — не сохраняется ни на сервере, ни в базе данных.',
  },
  {
    question: 'Сервис заменяет юриста?',
    answer:
      'Нет. Это автоматизированная проверка документов, а не юридическая консультация. Результаты — ориентир для дальнейшей работы с юристом.',
    answerText:
      'Нет. Это автоматизированная проверка документов, а не юридическая консультация. Результаты — ориентир для дальнейшей работы с юристом.',
  },
  {
    question: 'Можно посмотреть пример отчёта перед тем как загружать свой документ?',
    answer: (
      <>
        Да —{' '}
        <Link href="/example-report" className="text-brand hover:text-brand-hover transition">
          пример полного отчёта
        </Link>{' '}
        доступен без регистрации.
      </>
    ),
    answerText: 'Да — пример полного отчёта доступен без регистрации (/example-report).',
  },
  {
    question: 'Какие законы и стандарты проверяются?',
    answer: (
      <>
        152-ФЗ, GDPR, ISO 27001 и NIS2. Подробности и грозящие штрафы — на странице{' '}
        <Link href="/standards" className="text-brand hover:text-brand-hover transition">
          Стандарты
        </Link>
        .
      </>
    ),
    answerText:
      '152-ФЗ, GDPR, ISO 27001 и NIS2. Подробности и грозящие штрафы — на странице Стандарты (/standards).',
  },
  {
    question: 'Сколько это стоит?',
    answer: (
      <>
        Первая проверка — всегда полный отчёт бесплатно. Дальше — разовая покупка отчёта или
        подписка. Точные тарифы — на странице{' '}
        <Link href="/pricing" className="text-brand hover:text-brand-hover transition">
          Тарифы
        </Link>
        .
      </>
    ),
    answerText:
      'Первая проверка — всегда полный отчёт бесплатно. Дальше — разовая покупка отчёта или подписка. Точные тарифы — на странице Тарифы (/pricing).',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ITEMS.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answerText,
    },
  })),
};

export default function FaqPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 sm:px-10 py-14">
      {/* eslint-disable-next-line react/no-danger */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-ink-900 mb-4">Частые вопросы</h1>
        <p className="text-lg text-ink-700 max-w-2xl mx-auto">
          Прямые ответы на главные вопросы о том, как устроен сервис и можно ли ему доверять.
        </p>
      </div>

      <div className="space-y-5">
        {FAQ_ITEMS.map((item) => (
          <Card key={item.question} className="p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-ink-900 mb-2">{item.question}</h2>
            <p className="text-ink-700 leading-relaxed">{item.answer}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
