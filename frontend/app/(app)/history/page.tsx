'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Card from '../../components/ui/Card';
import RiskBadge from '../../components/ui/RiskBadge';
import { useAuth } from '../../lib/auth-context';
import { RiskLevel } from '../../lib/types';

interface Report {
  id: number;
  file_name: string;
  risk_level: RiskLevel;
  created_at: string;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function HistoryPage() {
  const { token, user, authReady } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // authReady=false — ещё не проверили localStorage, token/user=null здесь
    // ничего не значит (см. auth-context.tsx). Ждём, не показывая ошибку.
    if (!authReady) return;

    if (!token || !user) {
      setError('Пожалуйста, войдите в систему');
      setLoading(false);
      return;
    }

    const fetchReports = async () => {
      setError('');
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ai-compliance-saas-6nz5.onrender.com';
        const response = await fetch(`${apiUrl}/api/reports/user/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 401) {
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
  }, [token, user, authReady]);

  return (
    <div className="max-w-4xl mx-auto px-6 sm:px-10 py-10">
      <h1 className="text-2xl font-bold text-ink-900 mb-8">Мои отчёты</h1>

      {loading && <p className="text-ink-500 text-center py-12">Загрузка...</p>}

      {!loading && error && (
        <Card className="p-4 border-risk-high-border bg-risk-high-bg">
          <p className="text-sm text-risk-high">{error}</p>
        </Card>
      )}

      {!loading && !error && reports.length === 0 && (
        <Card className="text-center py-12">
          <p className="text-ink-500">У вас пока нет анализов</p>
          <Link
            href="/analyze"
            className="mt-4 inline-block px-5 py-2.5 bg-brand text-white rounded-lg text-sm font-semibold hover:bg-brand-hover transition"
          >
            Проверить первый документ
          </Link>
        </Card>
      )}

      {!loading && !error && reports.length > 0 && (
        <div className="space-y-3">
          {reports.map((report) => (
            <Link key={report.id} href={`/report/${report.id}`}>
              <Card className="p-4 hover:shadow-card-hover hover:border-brand/30 transition cursor-pointer">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-ink-900 truncate">{report.file_name}</p>
                    <p className="text-sm text-ink-500">{formatDate(report.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <RiskBadge level={report.risk_level} />
                    <span className="text-brand text-sm font-medium">Подробнее →</span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
