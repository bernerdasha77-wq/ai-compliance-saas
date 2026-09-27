import type { Metadata } from 'next';
import Link from 'next/link';
import Card from '../../components/ui/Card';
import FAQAccordion, { FAQAccordionItem } from '../../components/FAQAccordion';
import { IconUpload, IconSearch, IconFileText, IconLock, IconGlobe } from '../../components/icons';

const TITLE = 'Проверка политики конфиденциальности по 152-ФЗ онлайн — AI Compliance Checker';
const DESCRIPTION =
  'Загрузите политику конфиденциальности сайта — AI проверит её на соответствие 152-ФЗ, найдёт ошибки и предложит готовые формулировки. Первая проверка бесплатно.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/proverka-politiki-konfidencialnosti' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: '/proverka-politiki-konfidencialnosti',
    type: 'website',
    locale: 'ru_RU',
  },
};

const audience = [
  { title: 'Интернет-магазины', text: 'собирают адреса доставки, телефоны, историю заказов.' },
  { title: 'Онлайн-школы и курсы', text: 'хранят данные учеников, иногда данные детей.' },
  { title: 'Приложения и SaaS-сервисы', text: 'регистрация, аккаунты, аналитика.' },
  { title: 'Эксперты и специалисты с лендингом', text: 'даже одна форма заявки уже означает обработку данных.' },
];

const checks = [
  { title: 'Цели обработки', text: 'указаны ли конкретные цели, а не общее «для улучшения сервиса».' },
  { title: 'Состав данных', text: 'перечислены ли все категории данных, которые вы собираете.' },
  { title: 'Правовые основания', text: 'на каком основании вы обрабатываете данные.' },
  { title: 'Сроки хранения', text: 'указано ли, сколько хранятся данные и что происходит после.' },
  { title: 'Права пользователя', text: 'как человек может узнать о своих данных, изменить их или отозвать согласие.' },
  { title: 'Передача третьим лицам', text: 'упомянуты ли подрядчики и сервисы, которым передаются данные.' },
  { title: 'Трансграничная передача', text: 'если данные уходят в зарубежные сервисы.' },
  { title: 'Меры защиты', text: 'описаны ли меры по обеспечению безопасности данных.' },
];

const results = [
  { title: 'Общую оценку', text: 'документа по шкале от 0 до 100.' },
  { title: 'Список найденных рисков', text: 'с указанием статьи закона и уровня важности.' },
  { title: 'Готовые формулировки', text: 'текст, который можно вставить в политику, чтобы закрыть каждый риск.' },
];

const steps = [
  { icon: IconUpload, title: 'Загрузите документ', text: 'PDF или DOCX.' },
  { icon: IconSearch, title: 'AI анализирует', text: 'сверяет текст с требованиями закона.' },
  { icon: IconFileText, title: 'Получите отчёт', text: 'оценка, риски и готовые формулировки за пару минут.' },
];

const faqItems: FAQAccordionItem[] = [
  {
    question: 'Нужна ли политика конфиденциальности, если на сайте только форма заявки?',
    answer:
      'Да. Имя и телефон в форме заявки — это персональные данные. Если сайт их собирает, политика обработки персональных данных должна быть опубликована и доступна пользователям.',
    answerText:
      'Да. Имя и телефон в форме заявки — это персональные данные. Если сайт их собирает, политика обработки персональных данных должна быть опубликована и доступна пользователям.',
  },
  {
    question: 'Подойдёт ли политика, скачанная из шаблона?',
    answer:
      'Как отправная точка — да, но в таком виде она часто не соответствует тому, как на самом деле работает ваш сайт. Проверка покажет, каких разделов не хватает и что нужно дописать.',
    answerText:
      'Как отправная точка — да, но в таком виде она часто не соответствует тому, как на самом деле работает ваш сайт. Проверка покажет, каких разделов не хватает и что нужно дописать.',
  },
  {
    question: 'Сколько стоит проверка?',
    answer: (
      <>
        Первая проверка — полный отчёт бесплатно. Дальше — разовый отчёт за 1 500 ₽ или подписка
        от 2 500 ₽ в месяц. Автопродления нет. Точные тарифы — на странице{' '}
        <Link href="/pricing" className="text-brand hover:text-brand-hover transition">
          Тарифы
        </Link>
        .
      </>
    ),
    answerText:
      'Первая проверка — полный отчёт бесплатно. Дальше — разовый отчёт за 1 500 ₽ или подписка от 2 500 ₽ в месяц. Автопродления нет.',
  },
  {
    question: 'Заменяет ли проверка юриста?',
    answer:
      'Нет. Это автоматизированный анализ, а не юридическая консультация. Он помогает быстро найти очевидные пробелы и прийти к юристу с конкретными вопросами — или закрыть типовые проблемы самостоятельно.',
    answerText:
      'Нет. Это автоматизированный анализ, а не юридическая консультация. Он помогает быстро найти очевидные пробелы и прийти к юристу с конкретными вопросами — или закрыть типовые проблемы самостоятельно.',
  },
  {
    question: 'Можно ли проверить пользовательское соглашение или договор?',
    answer: 'Да, сервис проверяет также договоры с контрагентами и пользовательские соглашения (EULA, Terms).',
    answerText: 'Да, сервис проверяет также договоры с контрагентами и пользовательские соглашения (EULA, Terms).',
  },
];

export default function ProverkaPolitikiPage() {
  return (
    <div>
      {/* HERO */}
      <section className="max-w-3xl mx-auto px-6 sm:px-10 pt-16 pb-14 text-center">
        <p className="text-xs font-semibold tracking-widest text-brand uppercase mb-4">
          Для владельцев сайтов, интернет-магазинов и приложений
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold text-ink-900 leading-tight mb-5">
          Проверка политики конфиденциальности по 152-ФЗ онлайн
        </h1>
        <p className="text-lg text-ink-700 leading-relaxed mb-8 max-w-xl mx-auto">
          Загрузите политику вашего сайта — за пару минут AI покажет, чего в ней не хватает с
          точки зрения закона, и предложит готовые формулировки, которые можно сразу вставить в
          текст.
        </p>
        <Link
          href="/analyze"
          className="inline-block px-6 py-3.5 bg-brand text-white font-semibold rounded-lg hover:bg-brand-hover transition mb-3"
        >
          Проверить бесплатно →
        </Link>
        <p className="text-sm text-ink-500">Первая проверка — полный отчёт без оплаты. PDF или DOCX.</p>
      </section>

      {/* КОМУ ЭТО НУЖНО */}
      <section className="max-w-4xl mx-auto px-6 sm:px-10 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-ink-900 mb-5">Кому это нужно</h2>
        <p className="text-ink-700 leading-relaxed mb-6">
          Если на вашем сайте есть хотя бы одна форма, где человек оставляет имя, телефон или
          email, вы обрабатываете персональные данные. Закон требует, чтобы у сайта была
          опубликованная политика обработки персональных данных, и чтобы она описывала вашу
          реальную обработку, а не чужую.
        </p>
        <ul className="space-y-3">
          {audience.map((item) => (
            <li key={item.title} className="flex gap-2.5 text-ink-700">
              <span className="text-brand shrink-0">•</span>
              <span>
                <strong className="text-ink-900">{item.title}</strong> — {item.text}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* ПОЧЕМУ ШАБЛОН НЕ ЛУЧШИЙ ВАРИАНТ */}
      <section className="max-w-4xl mx-auto px-6 sm:px-10 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-ink-900 mb-5">
          Почему шаблон из интернета — не лучший вариант
        </h2>
        <p className="text-ink-700 leading-relaxed mb-4">
          Большинство политик на сайтах скачаны из шаблонов или написаны «по образцу». Проблема в
          том, что шаблон описывает абстрактный сайт, а не ваш: в нём могут не упоминаться сервисы,
          которые вы реально используете (аналитика, CRM, рассылки, платёжные системы), могут быть
          устаревшие формулировки или не хватать разделов, которые стали обязательными после
          изменений в законе.
        </p>
        <p className="text-ink-700 leading-relaxed">
          Последние годы требования 152-ФЗ и ответственность за их нарушение заметно ужесточились.
          Ошибки в политике — это риск претензий от Роскомнадзора, жалоб пользователей и проблем с
          модерацией в рекламных кабинетах.
        </p>
      </section>

      {/* ЧТО МЫ ПРОВЕРЯЕМ */}
      <section className="max-w-4xl mx-auto px-6 sm:px-10 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-ink-900 mb-5">Что мы проверяем</h2>
        <p className="text-ink-700 leading-relaxed mb-6">
          AI сверяет вашу политику с требованиями 152-ФЗ по официальному тексту закона:
        </p>
        <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
          {checks.map((item) => (
            <li key={item.title} className="flex gap-2.5 text-ink-700">
              <span className="text-brand shrink-0">•</span>
              <span>
                <strong className="text-ink-900">{item.title}</strong> — {item.text}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* ЧТО ВЫ ПОЛУЧИТЕ */}
      <section className="max-w-4xl mx-auto px-6 sm:px-10 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-ink-900 mb-5">Что вы получите</h2>
        <ul className="space-y-3 mb-6">
          {results.map((item) => (
            <li key={item.title} className="flex gap-2.5 text-ink-700">
              <span className="text-brand shrink-0">•</span>
              <span>
                <strong className="text-ink-900">{item.title}</strong> — {item.text}
              </span>
            </li>
          ))}
        </ul>
        <Link href="/example-report" className="text-brand hover:text-brand-hover transition font-medium">
          Посмотреть пример отчёта →
        </Link>
      </section>

      {/* КАК ЭТО РАБОТАЕТ */}
      <section className="max-w-4xl mx-auto px-6 sm:px-10 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-ink-900 mb-8 text-center">Как это работает</h2>
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
      <section className="max-w-4xl mx-auto px-6 sm:px-10 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-ink-900 mb-6 text-center">Безопасность</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="p-5 flex items-start gap-4">
            <div className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-ink-100">
              <IconLock className="w-5 h-5 text-ink-700" />
            </div>
            <div>
              <p className="font-medium text-ink-900">Файл не покидает браузер</p>
              <p className="text-sm text-ink-500">
                Документ разбирается прямо в браузере. На анализ уходит только текст — уже
                частично обезличенный — а не сам файл, и он удаляется сразу после обработки.
              </p>
            </div>
          </Card>
          <Card className="p-5 flex items-start gap-4">
            <div className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-ink-100">
              <IconGlobe className="w-5 h-5 text-ink-700" />
            </div>
            <div>
              <p className="font-medium text-ink-900">Передача защищена</p>
              <p className="text-sm text-ink-500">Все данные передаются по HTTPS — защищённому каналу связи.</p>
            </div>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 sm:px-10 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-ink-900 mb-8 text-center">Частые вопросы</h2>
        <FAQAccordion items={faqItems} />
      </section>

      {/* ПОХОЖАЯ СТАТЬЯ */}
      <section className="max-w-3xl mx-auto px-6 sm:px-10 pb-4">
        <p className="text-sm text-ink-500">
          Подробный разбор обязательных пунктов —{' '}
          <Link href="/blog/politika-konfidencialnosti-152-fz" className="text-brand hover:text-brand-hover transition">
            Политика конфиденциальности по 152-ФЗ: что должно быть обязательно
          </Link>
          .
        </p>
      </section>

      {/* ФИНАЛЬНЫЙ БЛОК */}
      <section className="max-w-6xl mx-auto px-6 sm:px-10 py-16">
        <Card className="p-8 sm:p-12 text-center bg-brand-light border-brand/15">
          <h2 className="text-2xl font-bold text-ink-900 mb-3">
            Узнайте, что не так с вашей политикой, за пару минут
          </h2>
          <p className="text-ink-700 max-w-xl mx-auto mb-6">Первая проверка — полный отчёт бесплатно.</p>
          <Link
            href="/analyze"
            className="inline-block px-6 py-3 bg-brand text-white font-semibold rounded-lg hover:bg-brand-hover transition mb-4"
          >
            Проверить документ
          </Link>
          <p className="text-xs text-ink-500 max-w-lg mx-auto">
            Автоматизированная проверка документов, а не юридическая консультация. Результаты —
            ориентир для дальнейшей работы с юристом.
          </p>
        </Card>
      </section>
    </div>
  );
}
