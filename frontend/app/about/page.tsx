'use client';

import Link from 'next/link';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
          ← На главную
        </Link>

        <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">🔒 О проекте</h1>

          <div className="space-y-6 text-gray-700 dark:text-gray-300 text-base leading-relaxed">
            <p>
              <strong>AI Compliance Checker</strong> — это сервис для быстрой проверки договоров и политик безопасности на соответствие ключевым требованиям кибербезопасности (152-ФЗ, GDPR, ISO 27001).
            </p>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <p className="font-semibold text-blue-700 dark:text-blue-300">✅ Ваши документы НЕ сохраняются</p>
              <p className="text-sm mt-1">
                Мы анализируем только текст загруженного файла. Сам файл не хранится ни в базе данных, ни на сервере. После завершения анализа вся информация удаляется.
              </p>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-6">Как мы защищаем ваши данные</h2>

            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>🔐 Шифрование AES-256</strong> — все результаты анализов хранятся в зашифрованном виде.
              </li>
              <li>
                <strong>🔑 JWT-авторизация</strong> — доступ к личному кабинету и истории только после входа.
              </li>
              <li>
                <strong>🧂 Хеширование паролей</strong> — пароли не хранятся в открытом виде (SHA256).
              </li>
              <li>
                <strong>🔒 HTTPS</strong> — все данные передаются по защищённому каналу.
              </li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-6">Что мы проверяем</h2>

            <ul className="list-disc pl-6 space-y-2">
              <li>Утечка данных (152-ФЗ / GDPR)</li>
              <li>Контроль доступа и управление ролями</li>
              <li>Ответственность сторон и штрафы</li>
              <li>Шифрование данных (AES-256 / TLS)</li>
              <li>Уведомление регулятора в течение 24 часов</li>
            </ul>

            <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm">
              <p className="font-medium">📧 По всем вопросам:</p>
              <a href="mailto:bernerdasha@yandex.ru" className="text-blue-600 dark:text-blue-400 hover:underline">
                aicompl26@gmail.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}