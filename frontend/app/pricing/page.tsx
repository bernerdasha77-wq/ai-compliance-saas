'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function PricingPage() {
const [isAuthenticated, setIsAuthenticated] = useState(false);

useEffect(() => {
const token = localStorage.getItem('access_token');
setIsAuthenticated(!!token);
}, []);

return (
<main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-12">
<div className="max-w-6xl mx-auto px-4">
<Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
← На главную
</Link>

<div className="text-center mt-8 mb-12">
<h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
Выберите тариф
</h1>
<p className="text-lg text-gray-600 dark:text-gray-300">
Начните с бесплатного тарифа или перейдите на Pro для глубокого AI-анализа
</p>
</div>

<div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
{/* БЕСПЛАТНЫЙ ТАРИФ */}
<div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col">
<div className="mb-6">
<h2 className="text-2xl font-bold text-gray-900 dark:text-white">Бесплатный</h2>
<p className="text-4xl font-bold text-gray-900 dark:text-white mt-2">0 ₽</p>
<p className="text-sm text-gray-500 dark:text-gray-400">всегда бесплатно</p>
</div>

<ul className="space-y-3 flex-1">
<li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
<span className="text-green-500">✅</span> 3 проверки в сутки
</li>
<li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
<span className="text-green-500">✅</span> Базовый анализ (5 пунктов)
</li>
<li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
<span className="text-green-500">✅</span> Без сохранения истории
</li>
<li className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
<span className="text-gray-400">❌</span> Глубокий AI-анализ
</li>
<li className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
<span className="text-gray-400">❌</span> Приоритетная поддержка
</li>
</ul>

<button
disabled
className="mt-6 w-full py-3 px-4 rounded-xl font-semibold bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
>
Текущий тариф
</button>
</div>

{/* ПЛАТНЫЙ ТАРИФ PRO */}
<div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border-2 border-blue-500 dark:border-blue-400 flex flex-col relative">
<div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full">
ПОПУЛЯРНОЕ
</div>

<div className="mb-6">
<h2 className="text-2xl font-bold text-gray-900 dark:text-white">Pro</h2>
<p className="text-4xl font-bold text-gray-900 dark:text-white mt-2">990 ₽</p>
<p className="text-sm text-gray-500 dark:text-gray-400">в месяц</p>
</div>

<ul className="space-y-3 flex-1">
<li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
<span className="text-green-500">✅</span> 20 проверок в сутки
</li>
<li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
<span className="text-green-500">✅</span> Глубокий AI-анализ (GDPR / 152-ФЗ)
</li>
<li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
<span className="text-green-500">✅</span> Сохранение истории
</li>
<li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
<span className="text-green-500">✅</span> Приоритетная поддержка
</li>
<li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
<span className="text-green-500">✅</span> Отмена в любой момент
</li>
</ul>

{isAuthenticated ? (
<button
onClick={() => alert('Оплата через ЮKassa будет подключена позже')}
className="mt-6 w-full py-3 px-4 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition shadow-md"
>
🚀 Подключить Pro
</button>
) : (
<Link
href="/"
className="mt-6 w-full py-3 px-4 rounded-xl font-semibold bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-center hover:bg-gray-300 dark:hover:bg-gray-600 transition"
>
Войдите, чтобы оплатить
</Link>
)}
</div>
</div>

<div className="text-center mt-12 text-sm text-gray-500 dark:text-gray-400">
Все тарифы включают базовый анализ. Оплата через ЮKassa.
<br />
<Link href="/offer" className="text-blue-600 dark:text-blue-400 hover:underline">
Публичная оферта
</Link>
</div>
</div>
</main>
);
}