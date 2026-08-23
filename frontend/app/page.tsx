'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AuthModal from './components/AuthModal';
import ThemeToggle from './components/ThemeToggle';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);

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

    const formData = new FormData();
    formData.append('file', file);
    formData.append('company_name', 'Тестовая компания');

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
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Шапка */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛡️</span>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
              AI Compliance Checker
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {isAuthenticated ? (
              <>
                <span className="text-sm text-gray-600 dark:text-gray-300 hidden sm:inline">
                  {user?.full_name || user?.email}
                </span>
                <Link
                  href="/history"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Мои отчёты
                </Link>
                <button
                onClick={handleLogout}
                  className="px-3 py-1.5 text-sm bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-500/20 transition"
                >
                  Выйти
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
              >
                Войти
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12 animate-fadeInUp">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
            Проверьте договор на <br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              безопасность
            </span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Загрузите файл и получите AI-анализ по 5 ключевым пунктам кибербезопасности
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 animate-fadeInUp">
          <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-10 text-center hover:border-blue-500 dark:hover:border-blue-400 transition bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center gap-3"
            >
              <span className="text-5xl">📄</span>
              <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
                {file ? file.name : 'Нажмите, чтобы выбрать файл (PDF или DOCX)'}
              </span>
              {file && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Размер: {(file.size / 1024).toFixed(2)} KB
                </span>
              )}
            </label>
          </div>

          <button
            type="submit"
            disabled={!file || loading}
            className="w-full py-4 px-6 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Анализирую...
              </span>
            ) : (
              '🔍 Проверить договор'
            )}
          </button>
        </form>

        {error && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 animate-fadeInUp">
            ❌ {error}
          </div>
        )}

        {result && (
          <div className="mt-10 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700 animate-fadeInUp">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">📋 Результат анализа</h3>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="font-medium text-gray-700 dark:text-gray-300">Статус:</span>
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
                  {result.status || 'Готово'}
                </span>
              </div>

              {result.analysis && (
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                  <p className="font-medium text-gray-700 dark:text-gray-300">Общий статус:</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                    {result.analysis.overall_status || 'Анализ завершён'}
                  </p>
                </div>
              )}

              {result.analysis?.rules && (
                <div className="space-y-2">
                  <p className="font-medium text-gray-700 dark:text-gray-300">📌 Проверка пунктов:</p>
                  {result.analysis.rules.map((rule: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-600"
                    >
                      <span className="text-gray-800 dark:text-gray-200 font-medium">{rule.name}</span>
                      <span className="text-lg font-bold">{rule.status}</span>
                    </div>
                  ))}
                </div>
              )}

              {result.analysis?.recommendations?.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                  <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">💡 Рекомендации:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    {result.analysis.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="text-gray-700 dark:text-gray-300 text-sm">{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.checklist && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  {Object.entries(result.checklist).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-600"
                    >
                      <span className="text-gray-700 dark:text-gray-300 font-medium">{key}</span>
                      <span className="text-xl font-bold">{value ? '✅' : '❌'}</span>
                    </div>
                  ))}
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



