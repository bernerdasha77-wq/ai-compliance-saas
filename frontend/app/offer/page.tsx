'use client';

import Link from 'next/link';

export default function OfferPage() {
return (
<main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-12">
<div className="max-w-4xl mx-auto px-4">
{/* Кнопка назад */}
<Link
href="/"
className="inline-block mb-6 text-blue-600 dark:text-blue-400 hover:underline text-sm"
>
← На главную
</Link>

{/* Карточка с офертой */}
<div className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-10 shadow-xl border border-gray-200 dark:border-gray-700">
<h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
Публичная оферта
</h1>
<p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
на предоставление доступа к сервису «AI Compliance Checker»
</p>

<div className="space-y-6 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">

{/* Раздел 1 */}
<section>
<h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
1. Общие положения
</h2>
<p>
1.1. Настоящий документ является публичной офертой (предложением) <strong>Самозанятого лица Аветисян Дарья Андреевна</strong>, ИНН 632147371878, действующего на основании законодательства РФ, в том числе Федерального закона от 27.11.2018 № 422-ФЗ «О проведении эксперимента по установлению специального налогового режима «Налог на профессиональный доход» (далее – «Исполнитель»), любому физическому или юридическому лицу (далее – «Заказчик») заключить договор на предоставление доступа к онлайн-сервису «AI Compliance Checker» (далее – «Сервис») на условиях, изложенных ниже.
</p>
<p className="mt-2">
1.2. Оферта вступает в силу с момента размещения на сайте <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-xs">https://ai-compliance.online/offer</code> и действует до момента её отзыва.
</p>
<p className="mt-2">
1.3. Акцептом (принятием) оферты считается совершение Заказчиком оплаты доступа к Сервису в порядке, установленном разделом 4 настоящей оферты.
</p>
</section>

{/* Раздел 2 */}
<section>
<h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
2. Предмет оферты
</h2>
<p>
2.1. Исполнитель предоставляет Заказчику доступ к Сервису, который позволяет загружать текстовые документы (договоры, политики безопасности) и получать автоматизированный анализ их соответствия ключевым требованиям кибербезопасности (включая, но не ограничиваясь: 152-ФЗ, GDPR, ISO 27001).
</p>
<p className="mt-2">
2.2. Доступ к Сервису предоставляется в виде:
</p>
<ul className="list-disc pl-6 mt-1 space-y-1">
<li><strong>Бесплатного тарифа</strong> — ограниченный функционал (условия описаны на странице <Link href="/pricing" className="text-blue-600 dark:text-blue-400 hover:underline">ai-compliance.online/pricing</Link>);</li>
<li><strong>Платного тарифа «Pro»</strong> — полный функционал (условия описаны на странице <Link href="/pricing" className="text-blue-600 dark:text-blue-400 hover:underline">ai-compliance.online/pricing</Link>).</li>
</ul>
</section>

{/* Раздел 3 */}
<section>
<h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
3. Порядок оказания услуг
</h2>
<p>
3.1. Сервис работает в автоматическом режиме 24/7, за исключением случаев проведения технических работ (о чём Исполнитель уведомляет на сайте заранее).
</p>
<p className="mt-2">
3.2. Заказчик обязуется использовать Сервис только для законных целей, не загружать вредоносные или запрещённые материалы.
</p>
<p className="mt-2">
3.3. Исполнитель не несёт ответственности за юридические последствия решений, принятых на основе результатов анализа. Результаты носят рекомендательный характер и не являются юридическим заключением.
</p>
</section>

{/* Раздел 4 */}
<section>
<h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
4. Стоимость и порядок оплаты
</h2>
<p>
4.1. Стоимость доступа к платному тарифу «Pro» указана на странице <Link href="/pricing" className="text-blue-600 dark:text-blue-400 hover:underline">ai-compliance.online/pricing</Link> и может быть изменена Исполнителем в одностороннем порядке без предварительного уведомления.
</p>
<p className="mt-2">
4.2. Оплата производится через платёжную систему <strong>ЮKassa</strong> с использованием банковских карт, электронных кошельков и других доступных способов.
</p>
<p className="mt-2">
4.3. Оплата считается произведённой в момент поступления денежных средств на счёт Исполнителя.
</p>
<p className="mt-2">
4.4. Подписка продлевается автоматически каждый месяц до тех пор, пока Заказчик не откажется от неё (отмена подписки происходит в личном кабинете Сервиса).
</p>
</section>

{/* Раздел 5 */}
<section>
<h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
5. Права и обязанности сторон
</h2>
<p className="font-medium mt-2">5.1. Исполнитель обязуется:</p>
<ul className="list-disc pl-6 mt-1 space-y-1">
<li>предоставить доступ к Сервису в течение 5 минут после оплаты;</li>
<li>обеспечивать работоспособность Сервиса (за исключением плановых работ);</li>
<li>сохранять конфиденциальность загруженных документов (документы не сохраняются на сервере, анализ проводится в оперативной памяти).</li>
</ul>
<p className="font-medium mt-2">5.2. Заказчик обязуется:</p>
<ul className="list-disc pl-6 mt-1 space-y-1">
<li>предоставлять достоверные данные при регистрации;</li>
<li>не передавать учётные данные третьим лицам;</li>
<li>использовать Сервис исключительно в личных или корпоративных целях.</li>
</ul>
</section>

{/* Раздел 6 */}
<section>
<h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
6. Ответственность сторон
</h2>
<p className="font-medium mt-2">6.1. Исполнитель не несёт ответственности за:</p>
<ul className="list-disc pl-6 mt-1 space-y-1">
<li>прямой или косвенный ущерб, возникший в результате использования результатов анализа;</li>
<li>недоступность Сервиса по независящим от Исполнителя причинам (проблемы у провайдеров, действия третьих лиц).</li>
</ul>
<p className="mt-2">
6.2. Заказчик несёт ответственность за достоверность загружаемых документов и законность их использования.
</p>
</section>

{/* Раздел 7 */}
<section>
<h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
7. Порядок расторжения и возврата
</h2>
<p>
7.1. Заказчик вправе отказаться от подписки в любое время через личный кабинет. В этом случае доступ к платному тарифу сохраняется до окончания оплаченного периода.
</p>
<p className="mt-2">
7.2. Возврат денежных средств за неиспользованный период подписки производится только в случае технической ошибки (двойное списание) или по решению Исполнителя.
</p>
</section>

{/* Раздел 8 */}
<section>
<h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
8. Срок действия и изменения
</h2>
<p>
8.1. Оферта действует бессрочно, но может быть изменена Исполнителем в одностороннем порядке с обязательной публикацией новой версии на сайте.
</p>
<p className="mt-2">
8.2. Изменения вступают в силу с момента публикации. Продолжение использования Сервиса после изменений означает согласие с ними.
</p>
</section>

{/* Раздел 9 */}
<section className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
<h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
9. Реквизиты Исполнителя
</h2>
<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
<div><span className="font-medium">ФИО:</span> Аветисян Дарья Андреевна</div>
<div><span className="font-medium">ИНН:</span> 632147371878</div>
<div><span className="font-medium">Телефон:</span> +7 (939) 707-71-14</div>
<div><span className="font-medium">Email:</span> aicompl26@gmail.com</div>
<div className="sm:col-span-2"><span className="font-medium">Статус:</span> Самозанятое лицо (Налог на профессиональный доход)</div>
<div className="sm:col-span-2"><span className="font-medium">Адрес:</span> [445032, Самарская обл., г. Тольятти,  б-р Кулибина 9 - 139]</div>
</div>
</section>

{/* Подвал страницы */}
<div className="text-xs text-gray-400 dark:text-gray-500 border-t border-gray-200 dark:border-gray-700 pt-4 mt-6">
Оферта действует с 25 августа 2026 года.
</div>
</div>
</div>
</div>
</main>
);
}