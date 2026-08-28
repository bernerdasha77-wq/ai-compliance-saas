'use client';

import { useState } from 'react';
import Card from './ui/Card';
import RiskBadge from './ui/RiskBadge';
import { Violation } from '../lib/types';
import { IconLock } from './icons';

export default function RiskItem({ violation }: { violation: Violation }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(violation.suggested_wording || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <RiskBadge level={violation.risk_level} />
          <span className="text-xs font-medium text-ink-500 bg-ink-100 px-2.5 py-1 rounded-pill">
            {violation.standard}
          </span>
        </div>
      </div>

      <h4 className="text-base font-semibold text-ink-900 mb-1.5">{violation.title}</h4>

      {violation.locked ? (
        <div className="flex items-center gap-2.5 bg-ink-100/60 border border-ink-100 rounded-lg px-4 py-3 mt-2">
          <IconLock className="w-4 h-4 text-ink-500 shrink-0" />
          <p className="text-sm text-ink-500">
            Статья закона, объяснение и готовая формулировка доступны в полном отчёте
          </p>
        </div>
      ) : (
        <>
          {violation.description && (
            <p className="text-sm text-ink-700 leading-relaxed mb-3">{violation.description}</p>
          )}

          {violation.article && (
            <p className="text-xs text-ink-500 font-medium mb-3">{violation.article}</p>
          )}

          {violation.quote && (
            <blockquote className="text-sm text-ink-700 italic bg-ink-100/60 border-l-2 border-ink-300 pl-3 py-2 rounded-r mb-3">
              «{violation.quote}»
            </blockquote>
          )}

          {violation.recommendation && (
            <div className="text-sm mb-3">
              <span className="font-medium text-ink-900">Рекомендация: </span>
              <span className="text-ink-700">{violation.recommendation}</span>
            </div>
          )}

          {violation.suggested_wording && (
            <div className="bg-brand-light rounded-lg p-3 border border-brand/10">
              <p className="text-xs text-ink-500 font-medium mb-1.5">Готовая формулировка</p>
              <p className="text-sm text-ink-900 font-mono bg-white p-2.5 rounded border border-ink-100">
                {violation.suggested_wording}
              </p>
              <button
                onClick={handleCopy}
                className="mt-2 text-xs font-medium text-brand hover:text-brand-hover transition"
              >
                {copied ? 'Скопировано' : 'Копировать'}
              </button>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
