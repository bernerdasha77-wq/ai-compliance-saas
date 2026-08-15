'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface ReportDetail {
  id: number;
  file_name: string;
  risk_level: string;
  analysis: any;
  checklist: Record<string, boolean>;
  created_at: string;
}

export default function ReportPage() {
  const params = useParams();
  const reportId = params.id;

  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReport = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Пожалуйста, войдите в систему');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:8000/api/reports/${reportId}`, {
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
          throw new Error('Отчёт не найден');
        }

        const data = await response.json();
        setReport(data);
      } catch (err: any) {
        setError(err.message || 'Произошла ошибка');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [reportId]);

  if (loading) {
    return (
      <main className="min-h-screen p-8 max-w-4xl mx-auto bg-white text-gray-900">
        <div className="text-center py-12 text-gray-600">Загрузка...</div>
      </main>
    );
  }

  if (error || !report) {
    return (
      <main className="min-h-screen p-8 max-w-4xl mx-auto bg-white text-gray-900">
        <div className="p-4 bg-red-50 border border-red-400 rounded-lg text-red-800">
          {error || 'Отчёт не найден'}
        </div>
        <Link href="/history" className="mt-4 inline-block text-blue-600 hover:underline">
          ← Вернуться к истории
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto bg-white text-gray-900">
      <div className="mb-6">
        <Link href="/history" className="text-blue-600 hover:underline">
          ← Назад к истории
        </Link>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 border border-gray-300 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{report.file_name}</h1>
            <p className="text-sm text-gray-600 mt-1">
              {new Date(report.created_at).toLocaleString('ru-RU')}
            </p>
          </div>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            {report.risk_level === 'low' && '🟢 Низкий риск'}
            {report.risk_level === 'medium' && '🟡 Средний риск'}
            {report.risk_level === 'high' && '🔴 Высокий риск'}
          </span>
        </div>

        {report.analysis && (
          <div className="space-y-4 mt-4">
            <div className="bg-white p-4 rounded border border-gray-300">
              <p className="text-gray-800 font-semibold mb-2">Общий статус:</p>
              <p className="text-gray-900 text-lg font-bold">
                {report.analysis.overall_status || 'Анализ завершён'}
              </p>
              {report.analysis.full_analysis && (
                <p className="text-gray-700 mt-2 text-sm">
                  {report.analysis.full_analysis}
                </p>
              )}
            </div>

            {report.analysis.rules && (
              <div className="space-y-2">
                <p className="font-semibold text-gray-800">Проверка пунктов:</p>
                {report.analysis.rules.map((rule: any, index: number) => (
                  <div
                    key={index}


className="flex items-center justify-between p-3 bg-white rounded border border-gray-300 shadow-sm"
                  >
                    <span className="text-gray-800 font-medium">{rule.name}</span>
                    <span className="text-lg font-bold">{rule.status}</span>
                  </div>
                ))}
              </div>
            )}

            {report.analysis.recommendations && report.analysis.recommendations.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-300 rounded-lg">
                <p className="font-semibold text-gray-800 mb-2">Рекомендации:</p>
                <ul className="list-disc pl-5 space-y-1">
                  {report.analysis.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="text-gray-800 text-sm">
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {report.checklist && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                {Object.entries(report.checklist).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-3 bg-white rounded border border-gray-300 shadow-sm"
                  >
                    <span className="text-gray-800 font-medium">{key}</span>
                    <span className="text-xl font-bold">
                      {value ? '✅' : '❌'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}