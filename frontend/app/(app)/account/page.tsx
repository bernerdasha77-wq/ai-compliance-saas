'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '../../components/ui/Card';
import { AccountStatus, AccountStatusCard } from '../../components/AccountStatusCard';
import { useAuth } from '../../lib/auth-context';

export default function AccountPage() {
  const { token, user, authReady, logout } = useAuth();
  const router = useRouter();
  const [account, setAccount] = useState<AccountStatus | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ai-compliance-saas-6nz5.onrender.com';
    fetch(`${apiUrl}/api/usage`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setAccount(data))
      .catch(() => {});
  }, [token]);

  const handleDeleteAccount = async () => {
    if (!token) return;
    setDeleting(true);
    setError('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ai-compliance-saas-6nz5.onrender.com';
      const response = await fetch(`${apiUrl}/api/account`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.detail || 'Не удалось удалить аккаунт');
      }
      logout();
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка');
      setDeleting(false);
    }
  };

  if (!authReady) return null;

  if (!token || !user) {
    return (
      <div className="max-w-2xl mx-auto px-6 sm:px-10 py-10">
        <Card className="p-6 text-center text-ink-500">Пожалуйста, войдите в систему</Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 sm:px-10 py-10">
      <h1 className="text-2xl font-bold text-ink-900 mb-8">Личный кабинет</h1>

      <Card className="p-5 mb-6">
        <p className="text-sm text-ink-500">Email</p>
        <p className="text-sm font-medium text-ink-900 mb-3">{user.email}</p>
        {user.full_name && (
          <>
            <p className="text-sm text-ink-500">Имя</p>
            <p className="text-sm font-medium text-ink-900">{user.full_name}</p>
          </>
        )}
      </Card>

      {account && <AccountStatusCard account={account} />}

      <Card className="p-5 border-risk-high-border">
        <p className="text-sm font-medium text-ink-900 mb-1">Удалить аккаунт</p>
        <p className="text-xs text-ink-500 mb-3">
          Удаляются учётная запись, все отчёты и история платежей. Действие необратимо.
        </p>

        {error && <p className="text-sm text-risk-high mb-3">{error}</p>}

        {!confirmingDelete ? (
          <button
            onClick={() => setConfirmingDelete(true)}
            className="text-sm font-medium text-risk-high hover:underline"
          >
            Удалить аккаунт
          </button>
        ) : (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-ink-700">Вы уверены? Это нельзя отменить.</span>
            <button
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="text-sm font-semibold text-white bg-risk-high px-3 py-1.5 rounded-lg hover:opacity-90 transition disabled:opacity-50"
            >
              {deleting ? 'Удаление...' : 'Да, удалить'}
            </button>
            <button
              onClick={() => setConfirmingDelete(false)}
              disabled={deleting}
              className="text-sm font-medium text-ink-500 hover:text-ink-900 transition"
            >
              Отмена
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}
