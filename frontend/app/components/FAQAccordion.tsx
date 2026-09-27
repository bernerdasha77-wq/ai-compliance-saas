'use client';

import { useState } from 'react';
import Card from './ui/Card';
import { IconChevronDown } from './icons';

export interface FAQAccordionItem {
  question: string;
  answer: React.ReactNode;
  /** Plain-text версия ответа для JSON-LD — без JSX-ссылок. */
  answerText: string;
}

/** Аккордеон FAQ + разметка schema.org FAQPage (JSON-LD) — JSON-LD рендерится
 * независимо от того, раскрыт ли пункт визуально, так что поисковики видят
 * полные ответы даже без взаимодействия с аккордеоном. */
export default function FAQAccordion({ items }: { items: FAQAccordionItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answerText,
      },
    })),
  };

  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="space-y-3">
        {items.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <Card key={item.question} className="overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between gap-4 p-5 sm:p-6 text-left"
              >
                <span className="font-semibold text-ink-900">{item.question}</span>
                <IconChevronDown
                  className={`w-5 h-5 text-ink-500 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isOpen && (
                <div className="px-5 sm:px-6 pb-5 sm:pb-6 text-ink-700 leading-relaxed">
                  {item.answer}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}
