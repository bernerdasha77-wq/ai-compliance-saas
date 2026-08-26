'use client';

import Link from 'next/link';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <Link
          href="/"
          className="inline-block mb-8 text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
        >
          ← На главную
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 md:p-12 shadow-xl border border-gray-200 dark:border-gray-700">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
            О проекте
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            AI Compliance Checker — это сервис для быстрой проверки договоров на соответствие{' '}
            <span className="font-semibold text-blue-600 dark:text-blue-400">законам и стандартам кибербезопасности</span> (
            <span className="text-blue-600 dark:text-blue-400 font-medium">152-ФЗ</span>,{' '}
            <span className="text-blue-600 dark:text-blue-400 font-medium">GDPR</span>,{' '}
            <span className="text-blue-600 dark:text-blue-400 font-medium">ISO 27001</span>).
          </p>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-5 mb-8">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-semibold text-blue-700 dark:text-blue-400">✅ Ваши документы НЕ сохраняются</span>
              <br />
              Мы анализируем только текст загруженного файла. Сам файл не хранится ни в базе данных, ни на сервере. После завершения анализа вся информация удаляется.
            </p>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-10 mb-5">
            Что мы проверяем
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            <div className="bg-gray-50 dark:bg-gray-700/50 p-5 rounded-2xl border border-gray-200 dark:border-gray-600">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">Договор с контрагентом</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc list-inside mt-2 space-y-1">
                <li>Утечка данных (152-ФЗ / GDPR)</li>
                <li>Контроль доступа к данным</li>
                <li>Ответственность сторон</li>
                <li>Шифрование (AES-256 / TLS)</li>
                <li>Уведомление регулятора (24 часа)</li>
              </ul>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 p-5 rounded-2xl border border-gray-200 dark:border-gray-600">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">EULA / Terms</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc list-inside mt-2 space-y-1">
                <li>Защита данных пользователя</li>
                <li>Лицензионные ограничения</li>
                <li>Права на интеллектуальную собственность</li>
                <li>Ответственность за убытки</li>
                <li>Условия прекращения действия</li>
              </ul>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 p-5 rounded-2xl border border-gray-200 dark:border-gray-600">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">Политика конфиденциальности</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc list-inside mt-2 space-y-1">
                <li>Сбор и обработка данных</li>
                <li>Передача данных третьим лицам</li>
                <li>Согласие пользователя</li>
                <li>Сроки хранения данных</li>
                <li>Права субъекта данных</li>
              </ul>
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-10 mb-5">
            🛡️ Как мы защищаем ваши данные
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
              <p className="font-semibold text-gray-900 dark:text-white">Шифрование AES-256</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Все результаты анализов хранятся в зашифрованном виде.</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
              <p className="font-semibold text-gray-900 dark:text-white">JWT-авторизация</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Доступ к личному кабинету и истории только после входа.</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
              <p className="font-semibold text-gray-900 dark:text-white">Хеширование паролей</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Пароли не хранятся в открытом виде (SHA256).</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
              <p className="font-semibold text-gray-900 dark:text-white">HTTPS</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Все данные передаются по защищённому каналу.</p>
            </div>
          </div>

          <div className="bg-gray-100 dark:bg-gray-700/30 p-6 rounded-2xl border border-gray-200 dark:border-gray-600">
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              <span className="font-semibold">Остались вопросы?</span>
              <br />
              Напишите нам:{' '}
              <a
                href="mailto:aicompl26@gmail.com"
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                aicompl26@gmail.com
              </a>
              <br />
              <span className="text-xs text-gray-500 dark:text-gray-400">Ответим в течение 12 часов.</span>
            </p>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition shadow-md"
            >
              Вернуться к проверке документа
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}