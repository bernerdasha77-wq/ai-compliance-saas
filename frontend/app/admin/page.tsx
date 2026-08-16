'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const userData = localStorage.getItem('user');
      if (!userData) {
        setError('Вы не авторизованы');
        setLoading(false);
        return;
      }

      const user = JSON.parse(userData);
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ai-compliance-saas-6nz5.onrender.com';

      try {
        const [usersRes, reportsRes, statsRes] = await Promise.all([
          fetch(`${apiUrl}/api/admin/users`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'X-Admin-Email': user.email,
            }
          }),
          fetch(`${apiUrl}/api/admin/reports`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'X-Admin-Email': user.email,
            }
          }),
          fetch(`${apiUrl}/api/admin/stats`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'X-Admin-Email': user.email,
            }
          })
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
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="text-center text-gray-600">Загрузка данных...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="text-center text-red-600">Ошибка: {error}</div>
        <div className="text-center mt-4">
          <Link href="/" className="text-blue-600 hover:underline">← Вернуться на главную</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">⚙️ Админ-панель</h1>
          <Link href="/" className="text-blue-600 hover:underline">← На главную</Link>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-blue-100 p-4 rounded-lg shadow">
            <p className="text-sm text-blue-600">👥 Всего пользователей</p>
            <p className="text-2xl font-bold text-blue-800">{stats.total_users || 0}</p>
          </div>
          <div className="bg-green-100 p-4 rounded-lg shadow">
            <p className="text-sm text-green-600">📄 Всего анализов</p>
            <p className="text-2xl font-bold text-green-800">{stats.total_reports || 0}</p>
          </div>
          <div className="bg-purple-100 p-4 rounded-lg shadow">
            <p className="text-sm text-purple-600">🟢 Активных пользователей</p>
            <p className="text-2xl font-bold text-purple-800">{stats.active_users || 0}</p>
          </div>
        </div>

        {/* Таблицы */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Пользователи */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-700">👥 Пользователи</h2>
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 text-left">Email</th>
                    <th className="p-2 text-left">Имя</th>
                    <th className="p-2 text-center">Отчётов</th>
                    <th className="p-2 text-left">Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-gray-500">Нет пользователей</td>
                    </tr>
                  ) : (
                    users.map((user: any) => (
                      <tr key={user.id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="p-2">{user.email}</td>
                        <td className="p-2">{user.full_name}</td>
                        <td className="p-2 text-center">{user.reports_count}</td>
                        <td className="p-2 text-xs">{new Date(user.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Отчёты */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-700">📄 Последние отчёты</h2>
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 text-left">Файл</th>
                    <th className="p-2 text-left">Пользователь</th>
                    <th className="p-2 text-center">Риск</th>
                    <th className="p-2 text-left">Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-gray-500">Нет отчётов</td>
                    </tr>
                  ) : (
                    reports.map((report: any) => (
                      <tr key={report.id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="p-2 truncate max-w-[100px]">{report.file_name}</td>
                        <td className="p-2">{report.user_email}</td>
                        <td className="p-2 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            report.risk_level === 'high' ? 'bg-red-100 text-red-700' :
                            report.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {report.risk_level}
                          </span>
                        </td>
                        <td className="p-2 text-xs">{new Date(report.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}