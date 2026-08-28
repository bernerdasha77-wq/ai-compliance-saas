'use client';

import { useState } from 'react';
import { useAuth } from '../lib/auth-context';

export default function AuthModal() {
  const { isAuthOpen, closeAuth, login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ai-compliance-saas-6nz5.onrender.com';
    const endpoint = isLogin ? '/api/login' : '/api/register';
    const payload = isLogin
      ? { email, password }
      : { email, password, full_name: fullName };

    try {
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Ошибка авторизации');
      }

      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      login(data.access_token);
      closeAuth();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthOpen) return null;

  return (
    <div className="fixed inset-0 bg-ink-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-card p-6 sm:p-8 max-w-md w-full shadow-card-hover border border-ink-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-ink-900">
            {isLogin ? 'Вход' : 'Регистрация'}
          </h2>
          <button
            onClick={closeAuth}
            className="text-ink-500 hover:text-ink-900 text-2xl leading-none transition"
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">
                Полное имя
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 border border-ink-100 rounded-lg bg-white text-ink-900 placeholder-ink-300 focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none transition"
                placeholder="Иван Иванов"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-ink-100 rounded-lg bg-white text-ink-900 placeholder-ink-300 focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none transition"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-ink-100 rounded-lg bg-white text-ink-900 placeholder-ink-300 focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none transition"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-risk-high-bg border border-risk-high-border rounded-lg text-risk-high text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-white bg-brand rounded-lg font-semibold hover:bg-brand-hover disabled:opacity-50 transition"
          >
            {loading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Зарегистрироваться')}
          </button>
        </form>

        <div className="mt-5 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-brand hover:text-brand-hover transition"
          >
            {isLogin ? 'Нет аккаунта? Зарегистрируйтесь' : 'Уже есть аккаунт? Войдите'}
          </button>
        </div>
      </div>
    </div>
  );
}
