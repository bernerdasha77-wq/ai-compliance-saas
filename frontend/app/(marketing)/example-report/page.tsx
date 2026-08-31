import Link from 'next/link';
import Card from '../../components/ui/Card';
import ScoreSummary from '../../components/ScoreSummary';
import RiskList from '../../components/RiskList';
import { Violation, StandardScore } from '../../lib/types';

const STANDARDS: StandardScore[] = [
  { name: 'GDPR', score: 91 },
  { name: 'ISO 27001', score: 86 },
  { name: 'NIS2', score: 73 },
];

const VIOLATIONS: Violation[] = [
  {
    id: 1,
    risk_level: 'high',
    standard: '152-ФЗ',
    article: '152-ФЗ, ст. 21',
    title: 'Нет обязательства уведомить об утечке в течение 24 часов',
    description:
      'Договор не обязывает контрагента-обработчика сообщать вам об инциденте с персональными данными в установленный срок — а именно вы как оператор обязаны уведомить Роскомнадзор в течение 24 часов и рискуете штрафом, даже если утечка произошла на стороне подрядчика.',
    quote: 'Стороны обязуются соблюдать конфиденциальность информации, полученной в ходе исполнения договора.',
    recommendation: 'Добавьте явный срок уведомления оператора об инциденте и порядок совместных действий.',
    suggested_wording: [
      'Обработчик обязан уведомить Оператора о любом инциденте, повлёкшем утрату, неправомерный доступ или распространение персональных данных, не позднее 24 (двадцати четырёх) часов с момента обнаружения инцидента.',
    ],
  },
  {
    id: 2,
    risk_level: 'medium',
    standard: 'GDPR',
    article: 'GDPR, Art. 28',
    title: 'Не определён порядок передачи данных третьим лицам',
    description:
      'В договоре отсутствует условие о необходимости предварительного согласования привлечения субподрядчиков (sub-processors), обрабатывающих те же данные — это требование Art. 28 GDPR для любого processor agreement.',
    quote: 'Исполнитель вправе привлекать третьих лиц для исполнения своих обязательств по настоящему договору.',
    recommendation: 'Обяжите контрагента заранее согласовывать список субподрядчиков и их гарантии защиты данных.',
    suggested_wording: [
      'Исполнитель вправе привлекать субподрядчиков для обработки персональных данных только с предварительного письменного согласия Заказчика и при условии, что субподрядчик принимает на себя эквивалентные обязательства по защите данных.',
    ],
  },
  {
    id: 3,
    risk_level: 'medium',
    standard: 'ISO 27001',
    article: 'ISO 27001, A.10',
    title: 'Отсутствует условие о шифровании передаваемых данных',
    description:
      'Договор не фиксирует технические меры защиты канала передачи — при разбирательстве это осложнит доказывание должной осмотрительности с вашей стороны.',
    quote: null,
    recommendation: 'Зафиксируйте минимальные требования к шифрованию (например, TLS 1.2+ и AES-256 для хранения).',
    suggested_wording: [
      'Передача персональных данных осуществляется исключительно по защищённым каналам связи с использованием протокола TLS версии 1.2 или выше; хранение данных — с применением шифрования AES-256.',
    ],
  },
  {
    id: 4,
    risk_level: 'low',
    standard: '152-ФЗ',
    article: '152-ФЗ, ст. 19',
    title: 'Формулировка о конфиденциальности слишком общая',
    description:
      'Пункт о конфиденциальности сформулирован широко и не уточняет, какие именно категории данных считаются персональными в рамках договора — не критично, но стоит уточнить для однозначности при спорах.',
    quote: 'Стороны обязуются не разглашать конфиденциальную информацию третьим лицам.',
    recommendation: 'Явно перечислите категории обрабатываемых персональных данных в приложении к договору.',
    suggested_wording: [
      'Перечень категорий персональных данных, обрабатываемых в рамках настоящего договора, приведён в Приложении №1 и является неотъемлемой частью договора.',
    ],
  },
];

const ACTION_CHECKLIST = [
  'Добавить пункт об уведомлении об инциденте в течение 24 часов (152-ФЗ, ст. 21)',
  'Прописать порядок согласования субподрядчиков, обрабатывающих данные (GDPR, Art. 28)',
  'Зафиксировать требования к шифрованию при передаче и хранении данных (ISO 27001, A.10)',
  'Уточнить перечень категорий персональных данных в приложении к договору',
];

export default function ExampleReportPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 sm:px-10 py-14">
      <div className="text-center mb-10">
        <span className="inline-block text-xs font-semibold text-ink-500 bg-ink-100 px-3 py-1.5 rounded-pill mb-4">
          Пример отчёта
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold text-ink-900 mb-4">
          Договор с контрагентом — разбор рисков
        </h1>
        <p className="text-lg text-ink-700 max-w-2xl mx-auto">
          Так выглядит полный отчёт AI Compliance Checker: оценка по стандартам, найденные риски
          и готовые формулировки для исправления — на демонстрационном документе.
        </p>
      </div>

      <div className="space-y-6">
        <ScoreSummary score={82} riskLabel="Умеренный риск" standards={STANDARDS} />

        <div>
          <h3 className="text-lg font-semibold text-ink-900 mb-3">Найденные риски</h3>
          <RiskList violations={VIOLATIONS} />
        </div>

        <Card className="p-5">
          <p className="text-sm font-semibold text-ink-900 mb-2">Чек-лист действий</p>
          <ul className="space-y-1.5">
            {ACTION_CHECKLIST.map((item, i) => (
              <li key={i} className="text-sm text-ink-700 flex gap-2">
                <span className="text-brand">•</span>
                {item}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6 sm:p-8 text-center bg-navy text-white border-none">
          <p className="text-lg font-semibold mb-2">Хотите такой же разбор своего документа?</p>
          <p className="text-sm text-navy-300 mb-5">
            Первая проверка — бесплатно, с полным отчётом.
          </p>
          <Link
            href="/analyze"
            className="inline-block px-6 py-3 bg-brand text-white font-semibold rounded-lg hover:bg-brand-hover transition"
          >
            Проверить документ →
          </Link>
        </Card>
      </div>
    </div>
  );
}
