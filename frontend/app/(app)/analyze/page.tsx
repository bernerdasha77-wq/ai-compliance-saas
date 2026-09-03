'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Card from '../../components/ui/Card';
import ScoreSummary from '../../components/ScoreSummary';
import RiskList from '../../components/RiskList';
import UpsellCard from '../../components/UpsellCard';
import { useAuth } from '../../lib/auth-context';
import { AnalysisResult } from '../../lib/types';
import { IconFileText, IconSmartphone, IconLock, IconUpload, IconAlertTriangle, IconHistory } from '../../components/icons';
import { ANALYZE_SUSPENDED, SUSPENSION_MESSAGE } from '../../lib/maintenance';
import { extractTextFromFile } from '../../lib/extractText';
import { anonymizeText, formatRedactSummary, AnonymizeResult } from '../../lib/anonymize';

function getProgressSteps(standards: string[]) {
  return [
    { until: 25, label: 'Читаем документ' },
    { until: 60, label: `Ищем нарушения по ${standards.join(', ')}` },
    { until: 100, label: 'Формируем отчёт и рекомендации' },
  ];
}

const docTypes = [
  { id: 'contract', title: 'Договор с контрагентом', icon: IconFileText, hint: 'Проверим утечки данных, контроль доступа, шифрование и ответственность за инциденты' },
  { id: 'eula', title: 'EULA / Terms', icon: IconSmartphone, hint: 'Оценим лицензионные ограничения, авторские права и условия использования' },
  { id: 'privacy', title: 'Политика конфиденциальности', icon: IconLock, hint: 'Проверим сбор данных, согласия пользователей и передачу информации третьим лицам' },
];

const STANDARDS = ['152-ФЗ', 'GDPR', 'ISO 27001', 'NIS2'];

type AccountStatus =
  | { kind: 'admin' }
  | { kind: 'unlimited' }
  | { kind: 'subscription'; plan: string; checks_used: number; checks_limit: number; expires_at: string }
  | { kind: 'one_time'; credits: number }
  | { kind: 'free'; checks_used: number; checks_limit: number };

interface AnalyzeResponse {
  status: string;
  report_id: number;
  analysis: AnalysisResult;
  is_full_report: boolean;
  account: AccountStatus;
}

const PLAN_NAMES: Record<string, string> = { basic: 'Базовая подписка', pro: 'Pro подписка' };

function AccountStatusCard({ account }: { account: AccountStatus }) {
  if (account.kind === 'admin') {
    return (
      <Card className="p-4 mb-6 flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm font-medium text-ink-900">Админ-доступ</p>
        <span className="text-xs text-ink-500">Без ограничений</span>
      </Card>
    );
  }

  if (account.kind === 'unlimited') {
    return (
      <Card className="p-4 mb-6">
        <p className="text-sm font-medium text-ink-900">Безлимитный доступ</p>
      </Card>
    );
  }

  if (account.kind === 'subscription') {
    const expiresDate = new Date(account.expires_at);
    const daysLeft = Math.ceil((expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const expiringSoon = daysLeft <= 5;
    return (
      <Card className={`p-4 mb-6 flex items-center justify-between gap-4 flex-wrap ${expiringSoon ? 'border-risk-medium-border bg-risk-medium-bg' : ''}`}>
        <div>
          <p className="text-sm font-medium text-ink-900">{PLAN_NAMES[account.plan] || account.plan}</p>
          <p className="text-xs text-ink-500">
            Осталось {Math.max(0, account.checks_limit - account.checks_used)} из {account.checks_limit} проверок ·
            действует до {expiresDate.toLocaleDateString('ru-RU')}
            {expiringSoon && ' — скоро закончится, автопродления нет'}
          </p>
        </div>
        <Link href="/pricing" className="text-sm font-medium text-brand hover:text-brand-hover transition whitespace-nowrap">
          Продлить →
        </Link>
      </Card>
    );
  }

  if (account.kind === 'one_time') {
    return (
      <Card className="p-4 mb-6 flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm font-medium text-ink-900">Доступен разовый отчёт: {account.credits}</p>
        <Link href="/pricing" className="text-sm font-medium text-brand hover:text-brand-hover transition">
          Все тарифы →
        </Link>
      </Card>
    );
  }

  return (
    <Card className="p-4 mb-6 flex items-center justify-between gap-4 flex-wrap">
      <div>
        <p className="text-sm font-medium text-ink-900">Бесплатный тариф</p>
        <p className="text-xs text-ink-500">
          Осталось {Math.max(0, account.checks_limit - account.checks_used)} из {account.checks_limit} проверок
        </p>
      </div>
      <Link href="/pricing" className="text-sm font-medium text-brand hover:text-brand-hover transition">
        Тарифы →
      </Link>
    </Card>
  );
}

export default function Home() {
  const { token, openAuth } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [docType, setDocType] = useState('contract');
  const [selectedStandards, setSelectedStandards] = useState<string[]>([]);
  const [account, setAccount] = useState<AccountStatus | null>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Обезличивание — см. app/lib/anonymize.ts, app/lib/extractText.ts. Текст
  // извлекается в браузере сразу при выборе файла (не после отправки) —
  // именно поэтому сводка "Скрыто: ..." доступна ДО отправки, а сам файл
  // на сервер больше не уходит вообще, уходит только текст.
  const [redactEnabled, setRedactEnabled] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [redactResult, setRedactResult] = useState<AnonymizeResult | null>(null);

  const stopProgress = () => {
    if (progressTimer.current) {
      clearInterval(progressTimer.current);
      progressTimer.current = null;
    }
  };

  const startProgress = () => {
    setProgress(0);
    progressTimer.current = setInterval(() => {
      // Асимптотически подбирается к ~92% — честная имитация: мы не знаем
      // реальный прогресс на сервере, но не хотим ни застревать на 0%,
      // ни соврать про 100% раньше настоящего ответа.
      setProgress((p) => p + (92 - p) * 0.03);
    }, 500);
  };

  useEffect(() => stopProgress, []);

  useEffect(() => {
    if (!token) {
      setAccount(null);
      return;
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ai-compliance-saas-6nz5.onrender.com';
    fetch(`${apiUrl}/api/usage`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setAccount(data))
      .catch(() => {});
  }, [token]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setError(null);
    setResult(null);
    setLimitReached(false);
    setExtractedText(null);
    setRedactResult(null);
    setExtractError(null);
    setExtracting(true);

    try {
      const text = await extractTextFromFile(selected);
      if (!text.trim()) {
        setExtractError(
          'Не удалось извлечь текст из документа — возможно, это скан без текстового слоя. Попробуйте другой файл.'
        );
        return;
      }
      setExtractedText(text);
    } catch (err: any) {
      setExtractError(err.message || 'Не удалось прочитать файл');
    } finally {
      setExtracting(false);
    }
  };

  // Пересчитываем обезличивание при новом тексте или переключении чекбокса —
  // сводка в UI всегда должна отражать то, что реально уйдёт при отправке.
  useEffect(() => {
    if (!extractedText) {
      setRedactResult(null);
      return;
    }
    setRedactResult(redactEnabled ? anonymizeText(extractedText) : null);
  }, [extractedText, redactEnabled]);

  const toggleStandard = (standard: string) => {
    setSelectedStandards((prev) =>
      prev.includes(standard) ? prev.filter((s) => s !== standard) : [...prev, standard]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError('Пожалуйста, выберите файл');
      return;
    }

    if (extractError) {
      setError('Не удалось прочитать документ — выберите другой файл');
      return;
    }

    if (extracting || !extractedText) {
      setError('Дождитесь окончания чтения документа');
      return;
    }

    if (selectedStandards.length === 0) {
      setError('Выберите хотя бы один стандарт проверки');
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
    startProgress();

    const textToSend = redactEnabled && redactResult ? redactResult.text : extractedText;

    const formData = new FormData();
    formData.append('file_name', file.name);
    formData.append('text', textToSend);
    formData.append('company_name', 'Тестовая компания');
    selectedStandards.forEach((s) => formData.append('standards', s));

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ai-compliance-saas-6nz5.onrender.com';
      const response = await fetch(
        `${apiUrl}/api/analyze?company_name=Тестовая компания&doc_type=${docType}`,
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
      setProgress(100);
      setResult(data);
      setAccount(data.account);
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка');
    } finally {
      stopProgress();
      setLoading(false);
    }
  };

  if (ANALYZE_SUSPENDED) {
    return (
      <div className="max-w-4xl mx-auto px-6 sm:px-10 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-ink-900 mb-1.5">Проверка документа</h1>
          <p className="text-ink-500">
            AI оценит риски, найдёт нарушения и предложит готовые формулировки
          </p>
        </div>

        <Card className="p-6 sm:p-8 text-center border-risk-medium-border bg-risk-medium-bg">
          <IconAlertTriangle className="w-6 h-6 text-risk-medium mx-auto mb-3" />
          <p className="text-risk-medium font-medium">{SUSPENSION_MESSAGE}</p>
        </Card>

        <p className="mt-4 text-xs text-ink-400 flex items-center gap-1.5">
          <IconHistory className="w-3.5 h-3.5" />
          Уже отправляли документ раньше? Прошлые отчёты доступны в{' '}
          <Link href="/history" className="text-brand hover:underline">
            «Мои отчёты»
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 sm:px-10 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink-900 mb-1.5">Проверка документа</h1>
        <p className="text-ink-500">
          AI оценит риски, найдёт нарушения и предложит готовые формулировки
        </p>
      </div>

      {account && <AccountStatusCard account={account} />}

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 mb-6">
        <div>
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
          <p className="text-sm text-ink-500 mt-3">
            {docTypes.find((t) => t.id === docType)?.hint}
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-ink-700 mb-3">Стандарты проверки</p>
          <div className="space-y-2">
            {STANDARDS.map((standard) => (
              <label
                key={standard}
                className="flex items-center gap-2.5 p-3 rounded-card border border-ink-100 hover:border-brand/40 cursor-pointer transition"
              >
                <input
                  type="checkbox"
                  checked={selectedStandards.includes(standard)}
                  onChange={() => toggleStandard(standard)}
                  className="accent-brand w-4 h-4"
                />
                <span className="text-sm font-medium text-ink-900">
                  {standard}
                  {standard === 'ISO 27001' && <sup className="text-ink-400">*</sup>}
                </span>
              </label>
            ))}
          </div>
          <p className="text-xs text-ink-400 mt-2">
            {selectedStandards.length === 0 && <>Выберите хотя бы один стандарт<br /></>}
            * без прямых цитат из текста стандарта — по общим знаниям модели
          </p>
        </div>
      </div>

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

        {file && (
          <div>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={redactEnabled}
                onChange={(e) => setRedactEnabled(e.target.checked)}
                className="mt-0.5 accent-brand w-4 h-4 shrink-0"
              />
              <span className="text-sm font-medium text-ink-900">
                Скрыть контактные данные и номера документов перед отправкой
              </span>
            </label>
            <p className="text-xs text-ink-400 mt-1.5 ml-6">
              Имена и адреса не распознаются автоматически — для дополнительной защиты уберите
              их из документа вручную перед загрузкой, если это важно.
            </p>

            {extracting && (
              <p className="text-xs text-ink-500 mt-2 ml-6">Читаем документ…</p>
            )}

            {extractError && (
              <p className="text-xs text-risk-high mt-2 ml-6">{extractError}</p>
            )}

            {redactEnabled && redactResult && (
              <p className="text-xs text-ink-500 mt-2 ml-6">
                {redactResult.total > 0
                  ? `Скрыто: ${formatRedactSummary(redactResult.counts)}`
                  : 'Контактных данных и номеров документов не найдено'}
              </p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={!file || loading || selectedStandards.length === 0 || extracting || !!extractError || !extractedText}
          className="w-full bg-brand text-white py-3.5 rounded-card font-semibold hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? 'Анализирую...' : 'Проверить документ'}
        </button>
      </form>

      {loading && (
        <Card className="mt-6 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-ink-900">
              {(() => {
                const steps = getProgressSteps(selectedStandards);
                return steps.find((s) => progress < s.until)?.label ?? steps[steps.length - 1].label;
              })()}
            </p>
            <span className="text-sm text-ink-500 tabular-nums">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
            <div
              className="h-full bg-brand rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-ink-500 mt-3">
            Обычно занимает 1–3 минуты. Не закрывайте и не перезагружайте страницу — анализ
            продолжится на сервере, а результат в любом случае сохранится в{' '}
            <Link href="/history" className="text-brand hover:underline">
              «Мои отчёты»
            </Link>
            , даже если вы уйдёте со страницы.
          </p>
        </Card>
      )}

      {!loading && (
        <p className="mt-4 text-xs text-ink-400 flex items-center gap-1.5">
          <IconHistory className="w-3.5 h-3.5" />
          Уже отправляли документ и не дождались ответа? Результат может быть здесь:{' '}
          <Link href="/history" className="text-brand hover:underline">
            Мои отчёты
          </Link>
        </p>
      )}

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

      {result?.analysis?.error && (
        <Card className="mt-6 p-4 flex items-center gap-2.5 border-risk-medium-border bg-risk-medium-bg">
          <IconAlertTriangle className="w-5 h-5 text-risk-medium shrink-0" />
          <p className="text-sm text-risk-medium">{result.analysis.error}</p>
        </Card>
      )}

      {result?.analysis && !result.analysis.error && (
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
            <UpsellCard
              variant="teaser"
              checksRemaining={result.account.kind === 'free' ? Math.max(0, result.account.checks_limit - result.account.checks_used) : undefined}
            />
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
