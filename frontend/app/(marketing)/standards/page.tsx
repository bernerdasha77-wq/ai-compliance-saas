import Card from '../../components/ui/Card';
import { IconAlertTriangle } from '../../components/icons';

function StandardBadge({ variant }: { variant: 'official' | 'approximate' }) {
  const isOfficial = variant === 'official';
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-xs font-semibold border shrink-0 ${
        isOfficial
          ? 'bg-risk-low-bg text-risk-low border-risk-low-border'
          : 'bg-risk-medium-bg text-risk-medium border-risk-medium-border'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isOfficial ? 'bg-risk-low' : 'bg-risk-medium'}`} />
      {isOfficial ? 'Официальный текст закона' : 'Приблизительная оценка'}
    </span>
  );
}

const STANDARDS = [
  {
    id: '152-fz',
    title: '152-ФЗ «О персональных данных»',
    badge: 'official' as const,
    description:
      'Регулирует обработку персональных данных в России. С декабря 2024 года (ФЗ №420) штрафы за утечки резко выросли и зависят от масштаба:',
    fines: [
      'Утечка 1 000–10 000 записей — 3–5 млн ₽ для юрлиц',
      'Утечка до 100 000 записей — 5–10 млн ₽',
      'Утечка свыше 100 000 записей — 15 млн ₽',
      'Повторная утечка (в течение года) — оборотный штраф 1–3% годовой выручки, максимум 500 млн ₽',
    ],
    checks:
      'законность обработки данных, наличие согласий, сроки хранения, уведомление Роскомнадзора об инцидентах, меры защиты.',
  },
  {
    id: 'gdpr',
    title: 'GDPR',
    badge: 'official' as const,
    description:
      'Регламент ЕС о защите данных — действует экстерриториально: применяется к любой компании, обрабатывающей данные пользователей из ЕС, включая российские. Максимальный штраф: €20 млн или 4% годового глобального оборота — в зависимости от того, что больше.',
    checks:
      'правовые основания обработки, права субъектов данных (доступ, удаление, перенос), передачу данных третьим лицам, сроки хранения, наличие DPA с подрядчиками.',
  },
  {
    id: 'nis2',
    title: 'NIS2 (Directive (EU) 2022/2555)',
    badge: 'official' as const,
    description:
      'Директива ЕС о кибербезопасности для критической инфраструктуры и цифровых сервисов. Делит компании на «существенные» и «важные» организации в 11+ секторах. Существенные организации — до €10 млн / 2% оборота. Важные организации — до €7 млн / 1,4% оборота.',
    checks:
      'управление рисками кибербезопасности, план реагирования на инциденты, защиту цепочки поставщиков, шифрование, многофакторную аутентификацию.',
  },
  {
    id: 'iso27001',
    title: 'ISO 27001:2022',
    badge: 'approximate' as const,
    description:
      'Международный добровольный стандарт (не закон) для системы менеджмента информационной безопасности — 93 контроля в 4 категориях: организационные, кадровые, физические, технологические.',
    disclaimer:
      'У нас нет доступа к официальному платному тексту стандарта — оценка даётся по общим публично известным требованиям, а не по цитированию оригинала. Точные номера разделов уточняйте по официальному изданию ISO.',
    checks:
      'общее наличие ключевых контролов — управление доступом, шифрование, реагирование на инциденты, непрерывность бизнеса.',
  },
];

export default function StandardsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 sm:px-10 py-14">
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-ink-900 mb-4">Стандарты и законы</h1>
        <p className="text-lg text-ink-700 max-w-2xl mx-auto">
          На соответствие каким требованиям мы проверяем документы, и что грозит за нарушения.
        </p>
      </div>

      <div className="space-y-6">
        {STANDARDS.map((std) => (
          <Card key={std.id} className="p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h2 className="text-xl font-bold text-ink-900">{std.title}</h2>
              <StandardBadge variant={std.badge} />
            </div>

            <p className="text-ink-700 leading-relaxed mb-4">{std.description}</p>

            {std.fines && (
              <ul className="space-y-1.5 mb-4 text-sm text-ink-700">
                {std.fines.map((fine) => (
                  <li key={fine} className="flex gap-2">
                    <span className="text-brand shrink-0">•</span>
                    {fine}
                  </li>
                ))}
              </ul>
            )}

            {std.disclaimer && (
              <div className="flex items-start gap-3 p-4 rounded-card bg-risk-medium-bg border border-risk-medium-border mb-4">
                <IconAlertTriangle className="w-5 h-5 text-risk-medium shrink-0 mt-0.5" />
                <p className="text-sm text-ink-700">{std.disclaimer}</p>
              </div>
            )}

            <p className="text-sm">
              <span className="font-medium text-ink-900">Проверяем: </span>
              <span className="text-ink-500">{std.checks}</span>
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
