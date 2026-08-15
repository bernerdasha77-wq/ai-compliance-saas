'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Report {
  id: number;
  file_name: string;
  risk_level: string;
  created_at: string;
}

export default function HistoryPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReports = async () => {
      const token = localStorage.getItem('access_token');
      const userData = localStorage.getItem('user');

      if (!token || !userData) {
        setError('Пожалуйста, войдите в систему');
        setLoading(false);
        return;
      }

      try {
        const user = JSON.parse(userData);
        const response = await fetch(`http://localhost:8000/api/reports/user/${user.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          setError('Сессия истекла. Войдите снова.');
          setLoading(false);
          return;
        }

        if (!response.ok) {
          throw new Error('Ошибка загрузки истории');
        }

        const data = await response.json();
        setReports(data);
      } catch (err: any) {
        setError(err.message || 'Произошла ошибка');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const getRiskLabel = (level: string) => {
    const map: Record<string, { label: string; color: string }> = {
      low: { label: '🟢 Низкий', color: 'text-green-700 bg-green-100' },
      medium: { label: '🟡 Средний', color: 'text-yellow-700 bg-yellow-100' },
      high: { label: '🔴 Высокий', color: 'text-red-700 bg-red-100' },
    };
    return map[level] || { label: 'Неизвестно', color: 'text-gray-700 bg-gray-100' };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <main className="min-h-screen p-8 max-w-4xl mx-auto bg-white text-gray-900">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Мои отчёты</h1>
        <div className="text-center py-12 text-gray-600">Загрузка...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen p-8 max-w-4xl mx-auto bg-white text-gray-900">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Мои отчёты</h1>
        <div className="p-4 bg-red-50 border border-red-400 rounded-lg text-red-800">
          {error}
        </div>
        <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline">
          ← Вернуться на главную
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto bg-white text-gray-900">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Мои отчёты</h1>
        <Link
          href="/"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          ← На главную
        </Link>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-lg">У вас пока нет анализов</p>
          <Link
            href="/"
            className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Проверить первый договор
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const risk = getRiskLabel(report.risk_level);
            return (
              <Link
                key={report.id}
                href={`/report/${report.id}`}


className="block p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow transition"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      {report.file_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatDate(report.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${risk.color}`}>
                      {risk.label}
                    </span>
                    <span className="text-blue-600 text-sm font-medium">
                      Подробнее →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}