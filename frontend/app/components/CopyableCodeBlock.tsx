'use client';

import { useState } from 'react';

export default function CopyableCodeBlock({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="bg-brand-light rounded-lg p-3 border border-brand/10 my-4">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <p className="text-xs text-ink-500 font-medium">Шаблон документа</p>
        <button
          onClick={handleCopy}
          className="text-xs font-medium text-brand hover:text-brand-hover transition shrink-0"
        >
          {copied ? 'Скопировано' : 'Копировать'}
        </button>
      </div>
      <pre className="text-sm text-ink-900 font-mono bg-white p-3 rounded border border-ink-100 overflow-x-auto whitespace-pre-wrap">
        {children}
      </pre>
    </div>
  );
}
