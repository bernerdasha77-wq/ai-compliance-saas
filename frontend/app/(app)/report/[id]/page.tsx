'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Card from '../../../components/ui/Card';
import ScoreSummary from '../../../components/ScoreSummary';
import RiskList from '../../../components/RiskList';
import RiskBadge from '../../../components/ui/RiskBadge';
import UpsellCard from '../../../components/UpsellCard';
import { useAuth } from '../../../lib/auth-context';
import { AnalysisResult, RiskLevel } from '../../../lib/types';

interface ReportDetail {
  id: number;
  file_name: string;
  risk_level: RiskLevel;
  analysis: AnalysisResult;
  is_full_report: boolean;
  created_at: string;
}

export default function ReportPage() {
  const params = useParams();
  const reportId = params.id;
  const { token, openAuth } = useAuth();

  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Пожалуйста, войдите в систему');
      setLoading(false);
      return;
    }

    const fetchReport = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ai-compliance-saas-6nz5.onrender.com';
        const response = await fetch(`${apiUrl}/api/reports/${reportId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 401) {
          openAuth();
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
  }, [reportId, token]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 sm:px-10 py-10">
        <p className="text-ink-500 text-center py-12">Загрузка...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-4xl mx-auto px-6 sm:px-10 py-10">
        <Card className="p-4 border-risk-high-border bg-risk-high-bg">
          <p className="text-sm text-risk-high">{error || 'Отчёт не найден'}</p>
        </Card>
        <Link href="/history" className="mt-4 inline-block text-sm text-brand hover:text-brand-hover transition">
          ← Вернуться к истории
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 sm:px-10 py-10">
      <Link href="/history" className="text-sm text-brand hover:text-brand-hover transition">
        ← Назад к истории
      </Link>

      <div className="flex items-start justify-between gap-4 mt-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">{report.file_name}</h1>
          <p className="text-sm text-ink-500 mt-1">
            {new Date(report.created_at).toLocaleString('ru-RU')}
          </p>
        </div>
        {report.risk_level && <RiskBadge level={report.risk_level} />}
      </div>

      {report.analysis && (
        <div className="space-y-6">
          <ScoreSummary
            score={report.analysis.score}
            riskLabel={report.analysis.risk_label}
            standards={report.analysis.standards}
          />

          <div>
            <h3 className="text-lg font-semibold text-ink-900 mb-3">Найденные риски</h3>
            <RiskList violations={report.analysis.violations || []} />
          </div>

          {!report.is_full_report && <UpsellCard variant="teaser" />}

          {report.is_full_report && report.analysis.action_checklist?.length > 0 && (
            <Card className="p-5">
              <p className="text-sm font-semibold text-ink-900 mb-2">Чек-лист действий</p>
              <ul className="space-y-1.5">
                {report.analysis.action_checklist.map((item, i) => (
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
