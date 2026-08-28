import Card from '../../components/ui/Card';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 sm:px-10 py-14">
      <h1 className="text-3xl sm:text-4xl font-bold text-ink-900 mb-8 text-center">О нас</h1>

      <div className="space-y-5 text-lg text-ink-700 leading-relaxed mb-10">
        <p>
          AI Compliance Checker — это инструмент, который экономит время на первичной проверке
          документов. Договоры, EULA и политики конфиденциальности часто занимают десятки страниц,
          а разобрать их вручную на предмет соответствия 152-ФЗ, GDPR, ISO 27001 и NIS2 — работа
          на часы даже для специалиста.
        </p>
        <p>
          Мы не заменяем юриста и не даём юридических заключений. Сервис находит потенциальные
          риски, показывает, на что стоит обратить внимание, и предлагает готовые формулировки для
          исправления — а решение и финальную проверку оставляем за вами или вашим юристом.
        </p>
      </div>

      <Card className="p-6 sm:p-8 text-center bg-ink-900 border-none">
        <p className="font-semibold text-white mb-1">Остались вопросы?</p>
        <p className="text-sm text-navy-300 mb-4">Отвечаем в течение 12 часов</p>
        <a
          href="mailto:aicompl26@gmail.com"
          className="inline-block px-5 py-2.5 bg-white text-ink-900 font-medium rounded-lg hover:bg-ink-100 transition text-sm"
        >
          aicompl26@gmail.com
        </a>
      </Card>
    </div>
  );
}
