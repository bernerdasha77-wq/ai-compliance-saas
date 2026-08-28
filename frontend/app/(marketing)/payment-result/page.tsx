import Link from 'next/link';
import Card from '../../components/ui/Card';

export default function PaymentResultPage() {
  return (
    <div className="max-w-md mx-auto px-6 py-20 text-center">
      <Card className="p-8">
        <h1 className="text-xl font-bold text-ink-900 mb-3">Спасибо!</h1>
        <p className="text-ink-700 mb-6">
          Если оплата прошла успешно, изменения появятся в вашем аккаунте в течение минуты.
          Если что-то пошло не так — попробуйте ещё раз или напишите нам.
        </p>
        <Link
          href="/analyze"
          className="inline-block px-5 py-2.5 bg-brand text-white font-semibold rounded-lg hover:bg-brand-hover transition"
        >
          Перейти к проверке документа
        </Link>
      </Card>
    </div>
  );
}
