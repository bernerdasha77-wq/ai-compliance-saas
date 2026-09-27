import type { Metadata } from 'next';
import Link from 'next/link';
import Card from '../../components/ui/Card';
import FAQAccordion, { FAQAccordionItem } from '../../components/FAQAccordion';
import { IconUpload, IconSearch, IconFileText, IconLock, IconGlobe } from '../../components/icons';

const TITLE = 'Проверка документов по 152-ФЗ и GDPR одновременно — AI Compliance Checker';
const DESCRIPTION =
  'У вас пользователи в России и в ЕС? AI проверит политику конфиденциальности и Terms на соответствие 152-ФЗ и GDPR сразу и покажет, где требования расходятся.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/152-fz-i-gdpr' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: '/152-fz-i-gdpr',
    type: 'website',
    locale: 'ru_RU',
  },
};

const audience = [
  { title: 'Стартапы и SaaS-сервисы', text: 'у которых пользователи и в России, и в Европе.' },
  {
    title: 'Команды, переехавшие за рубеж',
    text: 'в Армению, Грузию, Сербию, ОАЭ, на Кипр, — но продолжающие работать с российскими клиентами.',
  },
  { title: 'Веб-студии и аутсорс-разработка', text: 'с заказчиками из разных юрисдикций.' },
  { title: 'Мобильные приложения', text: 'опубликованные в сторах для нескольких стран.' },
];

const differences = [
  {
    title: 'Правовые основания',
    text: 'GDPR допускает несколько равноправных оснований, включая «законный интерес». В 152-ФЗ такого основания в той же форме нет, и во многих случаях нужно именно согласие.',
  },
  {
    title: 'Локализация данных',
    text: '152-ФЗ требует, чтобы первичная запись данных граждан РФ велась в базах на территории России. GDPR такого требования не имеет, но ограничивает передачу данных за пределы ЕС.',
  },
  {
    title: 'Трансграничная передача',
    text: 'По 152-ФЗ о передаче данных за рубеж нужно уведомлять Роскомнадзор. По GDPR передача в страны без решения о достаточности защиты требует отдельных механизмов, например стандартных договорных условий.',
  },
  {
    title: 'Утечки данных',
    text: 'Сроки и порядок уведомления регулятора об инцидентах в двух законах разные, и политика должна это учитывать.',
  },
  {
    title: 'Права пользователей',
    text: 'GDPR даёт права, которых нет в 152-ФЗ (например, право на переносимость данных), а сроки ответа на запросы пользователей отличаются.',
  },
  {
    title: 'Ответственные лица',
    text: 'GDPR в ряде случаев требует назначить DPO или представителя в ЕС, 152-ФЗ — ответственного за организацию обработки персональных данных.',
  },
];

const whatWeCheck = [
  'Политику конфиденциальности (Privacy Policy)',
  'Пользовательское соглашение (Terms of Service, EULA)',
  'Договоры с подрядчиками, которым передаются персональные данные',
];

const results = [
  { title: 'Отдельную оценку по каждому закону', text: 'видно, где документ сильнее, а где слабее.' },
  { title: 'Список рисков', text: 'с указанием статьи 152-ФЗ или GDPR.' },
  { title: 'Готовые формулировки', text: 'в том числе такие, которые закрывают требования обоих законов сразу.' },
];

const steps = [
  { icon: IconUpload, title: 'Загрузите документ', text: 'PDF или DOCX.' },
  { icon: IconSearch, title: 'AI анализирует', text: 'сверяет текст сразу с 152-ФЗ и GDPR.' },
  { icon: IconFileText, title: 'Получите отчёт', text: 'оценка по каждому закону и готовые формулировки.' },
];

const faqItems: FAQAccordionItem[] = [
  {
    question: 'Нам нужна одна политика или две — отдельно для России и ЕС?',
    answer:
      'Возможны оба варианта. Одна политика с разделами под каждую юрисдикцию проще в поддержке, две отдельные — проще читаются. Проверка подойдёт в любом случае: загрузите тот документ, который у вас есть.',
    answerText:
      'Возможны оба варианта. Одна политика с разделами под каждую юрисдикцию проще в поддержке, две отдельные — проще читаются. Проверка подойдёт в любом случае: загрузите тот документ, который у вас есть.',
  },
  {
    question: 'Наша компания зарегистрирована не в России. Нас касается 152-ФЗ?',
    answer:
      'Если вы собираете данные граждан России — например, у вас есть российские пользователи или клиенты, — требования 152-ФЗ могут на вас распространяться. Точную оценку вашей ситуации даст юрист, а проверка покажет, насколько документ готов к таким требованиям.',
    answerText:
      'Если вы собираете данные граждан России — например, у вас есть российские пользователи или клиенты, — требования 152-ФЗ могут на вас распространяться. Точную оценку вашей ситуации даст юрист, а проверка покажет, насколько документ готов к таким требованиям.',
  },
  {
    question: 'Можно ли проверить документ на английском?',
    answer: 'Да, сервис анализирует документы на русском и английском языках.',
    answerText: 'Да, сервис анализирует документы на русском и английском языках.',
  },
  {
    question: 'Сколько стоит?',
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
      'Нет. Это автоматизированный анализ, а не юридическая консультация. Он помогает быстро найти пробелы и прийти к юристу с конкретными вопросами.',
    answerText:
      'Нет. Это автоматизированный анализ, а не юридическая консультация. Он помогает быстро найти пробелы и прийти к юристу с конкретными вопросами.',
  },
];

export default function FzGdprPage() {
  return (
    <div>
      {/* HERO */}
      <section className="max-w-3xl mx-auto px-6 sm:px-10 pt-16 pb-14 text-center">
        <p className="text-xs font-semibold tracking-widest text-brand uppercase mb-4">
          Для IT-компаний с пользователями в России и ЕС
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold text-ink-900 leading-tight mb-5">
          Проверка документов по 152-ФЗ и GDPR одновременно
        </h1>
        <p className="text-lg text-ink-700 leading-relaxed mb-8 max-w-xl mx-auto">
          Если ваш продукт работает и на российскую, и на европейскую аудиторию, одной политики
          «по одному закону» недостаточно. Загрузите документ — AI проверит его сразу по обоим
          законам и покажет, где требования расходятся.
        </p>
        <Link
          href="/analyze"
          className="inline-block px-6 py-3.5 bg-brand text-white font-semibold rounded-lg hover:bg-brand-hover transition mb-3"
        >
          Проверить бесплатно →
        </Link>
        <p className="text-sm text-ink-500">Первая проверка — полный отчёт без оплаты. PDF или DOCX.</p>
      </section>

      {/* ДЛЯ КОГО */}
      <section className="max-w-4xl mx-auto px-6 sm:px-10 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-ink-900 mb-5">Для кого</h2>
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

      {/* В ЧЁМ СЛОЖНОСТЬ */}
      <section className="max-w-4xl mx-auto px-6 sm:px-10 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-ink-900 mb-5">В чём сложность</h2>
        <p className="text-ink-700 leading-relaxed">
          152-ФЗ и GDPR решают одну задачу — защиту персональных данных, — но решают её
          по-разному. Документ, написанный под один закон, почти всегда что-то упускает с точки
          зрения другого. Российские сервисы проверки обычно не учитывают GDPR, западные — не
          знают 152-ФЗ. Мы проверяем оба закона в одном отчёте.
        </p>
      </section>

      {/* ГДЕ РАСХОДЯТСЯ */}
      <section className="max-w-4xl mx-auto px-6 sm:px-10 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-ink-900 mb-5">Где 152-ФЗ и GDPR расходятся</h2>
        <ul className="space-y-3">
          {differences.map((item) => (
            <li key={item.title} className="flex gap-2.5 text-ink-700">
              <span className="text-brand shrink-0">•</span>
              <span>
                <strong className="text-ink-900">{item.title}.</strong> {item.text}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* ЧТО ПРОВЕРЯЕМ */}
      <section className="max-w-4xl mx-auto px-6 sm:px-10 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-ink-900 mb-5">Что проверяем</h2>
        <ul className="space-y-2 mb-4">
          {whatWeCheck.map((text) => (
            <li key={text} className="flex gap-2.5 text-ink-700">
              <span className="text-brand shrink-0">•</span>
              <span>{text}</span>
            </li>
          ))}
        </ul>
        <p className="text-ink-700 leading-relaxed">
          Дополнительно документ можно проверить по требованиям NIS2 и общим требованиям ISO
          27001 — если это актуально для вашей компании.
        </p>
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
          Подробный разбор —{' '}
          <Link href="/blog/152-fz-i-gdpr-odnovremenno" className="text-brand hover:text-brand-hover transition">
            152-ФЗ и GDPR одновременно: что делать бизнесу с клиентами из России и ЕС
          </Link>
          .
        </p>
      </section>

      {/* ФИНАЛЬНЫЙ БЛОК */}
      <section className="max-w-6xl mx-auto px-6 sm:px-10 py-16">
        <Card className="p-8 sm:p-12 text-center bg-brand-light border-brand/15">
          <h2 className="text-2xl font-bold text-ink-900 mb-3">Проверьте документ по двум законам за пару минут</h2>
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
