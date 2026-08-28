import { ReactNode } from 'react';

export default function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  // Tailwind не гарантирует, что bg-* из className перебьёт дефолтный
  // bg-white ниже — порядок в сгенерированном CSS не совпадает с порядком
  // классов в строке. Если вызывающий код передал свой фон, дефолтный не
  // добавляем вовсе, чтобы не было конфликта.
  const hasCustomBg = /(^|\s)bg-/.test(className);

  return (
    <div
      className={`${hasCustomBg ? '' : 'bg-white '}border border-ink-100 rounded-card shadow-card ${className}`}
    >
      {children}
    </div>
  );
}
