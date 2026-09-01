'use client';

import { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import RiskBadge from '../../components/ui/RiskBadge';
import { useAuth } from '../../lib/auth-context';
import { RiskLevel } from '../../lib/types';

interface AdminStats {
  total_users: number;
  total_reports: number;
  active_users: number;
}

export default function AdminPage() {
  const { token, user, authReady } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [stats, setStats] = useState<AdminStats>({ total_users: 0, total_reports: 0, active_users: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // authReady=false — ещё не проверили localStorage, token/user=null здесь
    // ничего не значит (см. auth-context.tsx). Ждём, не показывая ошибку.
    if (!authReady) return;

    if (!token || !user) {
      setError('Вы не авторизованы');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setError('');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ai-compliance-saas-6nz5.onrender.com';
      const headers = { Authorization: `Bearer ${token}` };

      try {
        const [usersRes, reportsRes, statsRes] = await Promise.all([
          fetch(`${apiUrl}/api/admin/users`, { headers }),
          fetch(`${apiUrl}/api/admin/reports`, { headers }),
          fetch(`${apiUrl}/api/admin/stats`, { headers }),
        ]);

        if (!usersRes.ok || !reportsRes.ok || !statsRes.ok) {
          throw new Error('Ошибка загрузки данных. Проверьте права доступа.');
        }

        setUsers(await usersRes.json());
        setReports(await reportsRes.json());
        setStats(await statsRes.json());
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, user, authReady]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 sm:px-10 py-10">
        <p className="text-ink-500 text-center py-12">Загрузка данных...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-6 sm:px-10 py-10">
        <Card className="p-4 border-risk-high-border bg-risk-high-bg">
          <p className="text-sm text-risk-high">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-10 py-10">
      <h1 className="text-2xl font-bold text-ink-900 mb-8">Админ-панель</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <Card className="p-5">
          <p className="text-sm text-ink-500">Всего пользователей</p>
          <p className="text-2xl font-bold text-ink-900 mt-1">{stats.total_users || 0}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-ink-500">Всего анализов</p>
          <p className="text-2xl font-bold text-ink-900 mt-1">{stats.total_reports || 0}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-ink-500">Активных пользователей</p>
          <p className="text-2xl font-bold text-ink-900 mt-1">{stats.active_users || 0}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-base font-semibold text-ink-900 mb-3">Пользователи</h2>
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-100/60">
                <tr>
                  <th className="p-3 text-left font-medium text-ink-700">Email</th>
                  <th className="p-3 text-left font-medium text-ink-700">Имя</th>
                  <th className="p-3 text-center font-medium text-ink-700">Отчётов</th>
                  <th className="p-3 text-left font-medium text-ink-700">Дата</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-ink-500">Нет пользователей</td>
                  </tr>
                ) : (
                  users.map((u: any) => (
                    <tr key={u.id} className="border-t border-ink-100 hover:bg-ink-100/40">
                      <td className="p-3">{u.email}</td>
                      <td className="p-3">{u.full_name}</td>
                      <td className="p-3 text-center">{u.reports_count}</td>
                      <td className="p-3 text-xs text-ink-500">{new Date(u.created_at).toLocaleDateString('ru-RU')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        </div>

        <div>
          <h2 className="text-base font-semibold text-ink-900 mb-3">Последние отчёты</h2>
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-100/60">
                <tr>
                  <th className="p-3 text-left font-medium text-ink-700">Файл</th>
                  <th className="p-3 text-left font-medium text-ink-700">Пользователь</th>
                  <th className="p-3 text-center font-medium text-ink-700">Риск</th>
                  <th className="p-3 text-left font-medium text-ink-700">Дата</th>
                </tr>
              </thead>
              <tbody>
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-ink-500">Нет отчётов</td>
                  </tr>
                ) : (
                  reports.map((report: any) => (
                    <tr key={report.id} className="border-t border-ink-100 hover:bg-ink-100/40">
                      <td className="p-3 truncate max-w-[120px]">{report.file_name}</td>
                      <td className="p-3">{report.user_email}</td>
                      <td className="p-3 text-center">
                        <RiskBadge level={(report.risk_level as RiskLevel) || 'medium'} />
                      </td>
                      <td className="p-3 text-xs text-ink-500">{new Date(report.created_at).toLocaleDateString('ru-RU')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </div>
  );
}
