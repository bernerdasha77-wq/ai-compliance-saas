'use client';

import { useState } from 'react';
import Card from './ui/Card';
import RiskBadge from './ui/RiskBadge';
import { Violation } from '../lib/types';
import { IconLock } from './icons';

/** suggested_wording — теперь string[], но отчёты, сохранённые до этого
 * изменения, всё ещё хранят его строкой в самом JSON с сервера — сам JSON
 * не проверяется против TS-типов в рантайме, так что здесь принимаем более
 * широкий тип, чем объявлено в Violation, и оборачиваем строку в массив
 * вместо падения/пустого рендера. */
function normalizeWording(value: string[] | string | null | undefined): string[] {
  if (Array.isArray(value)) return value.filter((s) => s.trim());
  if (typeof value === 'string' && value.trim()) return [value];
  return [];
}

export default function RiskItem({ violation }: { violation: Violation }) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const wordingItems = normalizeWording(violation.suggested_wording);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(wordingItems.join('\n\n'));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 1500);
  };

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <RiskBadge level={violation.risk_level} />
          <span
            className={
              violation.standard === 'Договорная практика EULA'
                ? 'text-xs font-medium text-ink-400 border border-dashed border-ink-200 px-2.5 py-1 rounded-pill'
                : 'text-xs font-medium text-ink-500 bg-ink-100 px-2.5 py-1 rounded-pill'
            }
          >
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

          {wordingItems.length > 0 && (
            <div className="bg-brand-light rounded-lg p-3 border border-brand/10">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <p className="text-xs text-ink-500 font-medium">
                  {wordingItems.length > 1 ? 'Готовые формулировки' : 'Готовая формулировка'}
                </p>
                {wordingItems.length > 1 && (
                  <button
                    onClick={handleCopyAll}
                    className="text-xs font-medium text-brand hover:text-brand-hover transition shrink-0"
                  >
                    {copiedAll ? 'Скопировано' : 'Копировать всё'}
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {wordingItems.map((item, i) => (
                  <div key={i}>
                    {wordingItems.length > 1 && (
                      <p className="text-xs text-ink-500 font-medium mb-1">Пункт {i + 1}</p>
                    )}
                    <p className="text-sm text-ink-900 font-mono bg-white p-2.5 rounded border border-ink-100">
                      {item}
                    </p>
                    <button
                      onClick={() => handleCopy(item, i)}
                      className="mt-1.5 text-xs font-medium text-brand hover:text-brand-hover transition"
                    >
                      {copiedIndex === i ? 'Скопировано' : 'Копировать'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
