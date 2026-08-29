import type { Metadata } from 'next';
import PricingClient from './PricingClient';

const TITLE = 'Тарифы — AI Compliance Checker';
const DESCRIPTION =
  'Бесплатная проверка документа или подписка от 2500 ₽/мес на проверку договоров, EULA и политик конфиденциальности на соответствие законам.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: '/pricing',
    type: 'website',
    locale: 'ru_RU',
  },
};

export default function PricingPage() {
  return <PricingClient />;
}
