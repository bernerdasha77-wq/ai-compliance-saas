'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AuthModal from './components/AuthModal';
import ThemeToggle from './components/ThemeToggle';

const docTypes = [
  {
    id: 'contract',
    title: 'Договор с контрагентом',
    icon: '📄'
  },
  {
    id: 'eula',
    title: 'EULA / Terms (Лицензия и условия)',
    icon: '📱'
  },
  {
    id: 'privacy',
    title: 'Политика конфиденциальности',
    icon: '🔒'
  }
];

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [docType, setDocType] = useState('contract');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogin = (token: string) => {
    setIsAuthenticated(true);
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    setResult(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setResult(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError('Пожалуйста, выберите файл');
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      setIsAuthOpen(true);
      setError('Пожалуйста, войдите в систему');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);  // ← СБРАСЫВАЕМ СТАРЫЙ РЕЗУЛЬТАТ

    const formData = new FormData();
    formData.append('file', file);
    formData.append('company_name', 'Тестовая компания');
    formData.append('doc_type', docType);
    console.log('📋 Отправляем doc_type:', docType);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ai-compliance-saas-6nz5.onrender.com';
      const response = await fetch(`${apiUrl}/api/analyze`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setError('Сессия истекла. Войдите снова.');
        setIsAuthOpen(true);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Ошибка при анализе');
      }

      const data = await response.json();
      console.log('📦 Данные получены:', data);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Шапка */}
      <header className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 dark:from-blue-800 dark:via-indigo-800 dark:to-purple-800 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛡️</span>
            <h1 className="text-2xl font-bold tracking-tight">AI Compliance Checker</h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {isAuthenticated ? (
              <>
                <span className="text-sm text-blue-100">
                  👤 {user?.full_name || user?.email}
                </span>
                <Link
                  href="/history"
                  className="text-sm text-white/80 hover:text-white hover:underline transition"
                >
                  Мои отчёты
                </Link>
                {isAuthenticated && user?.email === 'bernerdasha@yandex.ru' && (
                  <Link
                    href="/admin"
                    className="text-sm text-white/80 hover:text-white hover:underline transition"
                  >
                    ⚙️ Админка
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition"
                >
                  Выйти
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="px-5 py-2 bg-white text-blue-700 rounded-lg font-semibold hover:bg-blue-50 transition shadow-md"
              >
                Войти / Регистрация
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold text-gray-800 dark:text-white mb-3">
            Проверьте документ на соответствие <span className="text-blue-600 dark:text-blue-400">законам и стандартам</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto">
            AI оценит риски, найдёт нарушения и предложит готовые формулировки
          </p>
        </div>

        {/* Карточки выбора типа документа */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Выберите тип документа
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {docTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setDocType(type.id)}
                className={`p-4 rounded-xl border-2 text-center transition ${
                  docType === type.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                }`}
              >
                <div className="text-3xl">{type.icon}</div>
                <div className="font-semibold text-gray-800 dark:text-white text-sm mt-1">
                  {type.title}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Динамическое описание выбранного типа */}
        {docType && (
          <div className="text-center mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">Вы выбрали:</span>{' '}
              {docTypes.find(t => t.id === docType)?.title}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {docType === 'contract' && 'Проверим утечки данных, контроль доступа, шифрование и ответственность за инциденты'}
              {docType === 'eula' && 'Оценим лицензионные ограничения, авторские права и условия использования'}
              {docType === 'privacy' && 'Проверим сбор данных, согласия пользователей и передачу информации третьим лицам'}
            </p>
          </div>
        )}

        {/* Форма загрузки файла */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border-3 border-dashed border-blue-300 dark:border-blue-600 rounded-2xl p-10 text-center hover:border-blue-500 dark:hover:border-blue-400 transition bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm shadow-sm hover:shadow-md">
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium text-lg flex flex-col items-center gap-2"
            >
              <span className="text-5xl">📄</span>
              {file ? file.name : 'Нажмите, чтобы выбрать файл (PDF или DOCX)'}
            </label>
            {file && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Размер: {(file.size / 1024).toFixed(2)} KB
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!file || loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md hover:shadow-lg"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Анализирую...
              </span>
            ) : (
              '🔍 Проверить документ'
            )}
          </button>
        </form>

        {error && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl text-red-700 dark:text-red-300">
            ❌ {error}
          </div>
        )}

        {result && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">📋 Результат анализа</h3>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-700 dark:text-gray-300">Статус:</span>
                <span className="px-4 py-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-full text-sm font-bold">
                  {result.status || 'Готово'}
                </span>
              </div>

              {result.analysis?.overall_status && (
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                  <p className="text-gray-700 dark:text-gray-300 font-semibold">Общий статус:</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-block w-3 h-3 rounded-full ${
                      result.analysis.overall_status.includes('низкий') ? 'bg-green-500' :
                      result.analysis.overall_status.includes('средний') ? 'bg-yellow-500' :
                      result.analysis.overall_status.includes('высокий') ? 'bg-red-500' :
                      'bg-gray-400'
                    }`}></span>
                    <p className="text-gray-900 dark:text-white text-lg font-bold">
                      {result.analysis.overall_status}
                    </p>
                  </div>
                </div>
              )}

              {result.analysis?.rules && result.analysis.rules.length > 0 && (
                <div className="space-y-4">
                  <p className="font-semibold text-gray-700 dark:text-gray-300">📌 Детальный разбор:</p>
                  {result.analysis.rules.map((rule: any, index: number) => (
                    <div
                      key={index}
                      className="p-4 bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-gray-800 dark:text-gray-200 font-medium">{rule.name}</span>
                        <span className="text-lg font-bold">{rule.status}</span>
                      </div>

                      {rule.quote && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded border-l-4 border-yellow-400">
                          <p className="text-xs text-gray-500 dark:text-gray-400">📎 Цитата из документа:</p>
                          <p className="text-sm text-gray-800 dark:text-gray-200 italic">«{rule.quote}»</p>
                        </div>
                      )}

                      {rule.law && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded border-l-4 border-blue-400">
                          <p className="text-xs text-gray-500 dark:text-gray-400">⚖️ Статья закона:</p>
                          <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{rule.law}</p>
                        </div>
                      )}

                      {rule.risk && rule.risk !== "Нарушений не обнаружено" && (
                        <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded border-l-4 border-red-400">
                          <p className="text-xs text-gray-500 dark:text-gray-400">⚠️ Риск для бизнеса:</p>
                          <p className="text-sm text-gray-800 dark:text-gray-200">{rule.risk}</p>
                        </div>
                      )}

                      {rule.recommendation && (
                        <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded border-l-4 border-green-400">
                          <p className="text-xs text-gray-500 dark:text-gray-400">💡 Рекомендация:</p>
                          <p className="text-sm text-gray-800 dark:text-gray-200">{rule.recommendation}</p>
                        </div>
                      )}

                      {rule.formulation && (
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded border border-purple-300 dark:border-purple-700">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">📝 Готовая формулировка для документа:</p>
                          <p className="text-sm text-gray-800 dark:text-gray-200 font-mono bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600">
                            {rule.formulation}
                          </p>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(rule.formulation);
                              alert('✅ Формулировка скопирована в буфер обмена!');
                            }}
                            className="mt-2 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition"
                          >
                            📋 Копировать
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {result.analysis?.recommendations && result.analysis.recommendations.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-xl">
                  <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">💡 Чек-лист действий:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    {result.analysis.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="text-gray-700 dark:text-gray-300 text-sm">{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLogin={handleLogin}
      />
    </main>
  );
}