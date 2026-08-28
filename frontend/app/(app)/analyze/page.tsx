'use client';

import { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import ScoreSummary from '../../components/ScoreSummary';
import RiskList from '../../components/RiskList';
import UpsellCard from '../../components/UpsellCard';
import { useAuth } from '../../lib/auth-context';
import { AnalysisResult } from '../../lib/types';
import { IconFileText, IconSmartphone, IconLock, IconUpload, IconAlertTriangle } from '../../components/icons';

const docTypes = [
  { id: 'contract', title: 'Договор с контрагентом', icon: IconFileText, hint: 'Проверим утечки данных, контроль доступа, шифрование и ответственность за инциденты' },
  { id: 'eula', title: 'EULA / Terms', icon: IconSmartphone, hint: 'Оценим лицензионные ограничения, авторские права и условия использования' },
  { id: 'privacy', title: 'Политика конфиденциальности', icon: IconLock, hint: 'Проверим сбор данных, согласия пользователей и передачу информации третьим лицам' },
];

interface AnalyzeResponse {
  status: string;
  report_id: number;
  analysis: AnalysisResult;
  is_full_report: boolean;
  checks_used: number;
  checks_remaining: number | null;
  checks_limit: number;
}

interface UsageInfo {
  plan: string;
  checks_used: number;
  checks_remaining: number | null;
  checks_limit: number;
}

export default function Home() {
  const { token, openAuth } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [docType, setDocType] = useState('contract');
  const [usage, setUsage] = useState<UsageInfo | null>(null);

  useEffect(() => {
    if (!token) {
      setUsage(null);
      return;
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ai-compliance-saas-6nz5.onrender.com';
    fetch(`${apiUrl}/api/usage`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setUsage(data))
      .catch(() => {});
  }, [token]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setResult(null);
      setLimitReached(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError('Пожалуйста, выберите файл');
      return;
    }

    if (!token) {
      openAuth();
      setError('Пожалуйста, войдите в систему');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setLimitReached(false);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('company_name', 'Тестовая компания');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ai-compliance-saas-6nz5.onrender.com';
      const response = await fetch(
        `${apiUrl}/api/analyze?company_name=Тестовая компания&law=152-ФЗ&doc_type=${docType}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

      if (response.status === 401) {
        openAuth();
        setError('Сессия истекла. Войдите снова.');
        return;
      }

      if (response.status === 402) {
        setLimitReached(true);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        const message = typeof errorData.detail === 'string' ? errorData.detail : errorData.detail?.message;
        throw new Error(message || 'Ошибка при анализе');
      }

      const data = await response.json();
      setResult(data);
      setUsage({
        plan: data.checks_remaining === null ? 'paid' : 'free',
        checks_used: data.checks_used,
        checks_remaining: data.checks_remaining,
        checks_limit: data.checks_limit,
      });
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 sm:px-10 py-10">
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-ink-900 mb-1.5">Проверка документа</h1>
            <p className="text-ink-500">
              AI оценит риски, найдёт нарушения и предложит готовые формулировки
            </p>
          </div>
          {usage && usage.checks_remaining !== null && (
            <span className="text-xs font-medium text-ink-500 bg-ink-100 px-3 py-1.5 rounded-pill whitespace-nowrap">
              Бесплатных проверок осталось: {usage.checks_remaining} из {usage.checks_limit}
            </span>
          )}
        </div>
      </div>

      <div className="mb-6">
        <p className="text-sm font-medium text-ink-700 mb-3">Тип документа</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {docTypes.map((type) => {
            const Icon = type.icon;
            const active = docType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => setDocType(type.id)}
                className={`p-4 rounded-card border text-left transition ${
                  active
                    ? 'border-brand bg-brand-light'
                    : 'border-ink-100 hover:border-brand/40'
                }`}
              >
                <Icon className={`w-5 h-5 mb-2 ${active ? 'text-brand' : 'text-ink-500'}`} />
                <div className="font-medium text-sm text-ink-900">{type.title}</div>
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-sm text-ink-500 mb-6">
        {docTypes.find((t) => t.id === docType)?.hint}
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <label
          htmlFor="file-upload"
          className="flex flex-col items-center gap-2 border-2 border-dashed border-ink-100 hover:border-brand/40 rounded-card p-10 text-center cursor-pointer transition"
        >
          <IconUpload className="w-8 h-8 text-brand" />
          <input
            type="file"
            accept=".pdf,.docx"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          <span className="text-ink-900 font-medium">
            {file ? file.name : 'Нажмите, чтобы выбрать файл (PDF или DOCX)'}
          </span>
          {file && (
            <span className="text-sm text-ink-500">{(file.size / 1024).toFixed(0)} KB</span>
          )}
        </label>

        <button
          type="submit"
          disabled={!file || loading}
          className="w-full bg-brand text-white py-3.5 rounded-card font-semibold hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? 'Анализирую...' : 'Проверить документ'}
        </button>
      </form>

      {error && (
        <Card className="mt-6 p-4 flex items-center gap-2.5 border-risk-high-border bg-risk-high-bg">
          <IconAlertTriangle className="w-5 h-5 text-risk-high shrink-0" />
          <p className="text-sm text-risk-high">{error}</p>
        </Card>
      )}

      {limitReached && (
        <div className="mt-6">
          <UpsellCard variant="limit" />
        </div>
      )}

      {result?.analysis && (
        <div className="mt-8 space-y-6">
          <ScoreSummary
            score={result.analysis.score}
            riskLabel={result.analysis.risk_label}
            standards={result.analysis.standards}
          />

          <div>
            <h3 className="text-lg font-semibold text-ink-900 mb-3">Найденные риски</h3>
            <RiskList violations={result.analysis.violations} />
          </div>

          {!result.is_full_report && (
            <UpsellCard variant="teaser" checksRemaining={result.checks_remaining ?? undefined} />
          )}

          {result.is_full_report && result.analysis.action_checklist?.length > 0 && (
            <Card className="p-5">
              <p className="text-sm font-semibold text-ink-900 mb-2">Чек-лист действий</p>
              <ul className="space-y-1.5">
                {result.analysis.action_checklist.map((item, i) => (
                  <li key={i} className="text-sm text-ink-700 flex gap-2">
                    <span className="text-brand">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
