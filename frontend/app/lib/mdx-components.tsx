import Link from 'next/link';
import type { ReactElement } from 'react';
import type { MDXRemoteProps } from 'next-mdx-remote/rsc';
import CopyableCodeBlock from '../components/CopyableCodeBlock';

export const mdxComponents: NonNullable<MDXRemoteProps['components']> = {
  a: ({ href, children }) => (
    <Link
      href={href ?? '#'}
      className="text-brand hover:text-brand-hover underline underline-offset-2"
    >
      {children}
    </Link>
  ),
  // Фенс-код-блоки (```...```) в статьях блога — например, готовый шаблон
  // документа для копирования — рендерятся как <pre><code>текст</code></pre>;
  // без rehype-подсветки синтаксиса children кода всегда простая строка.
  pre: ({ children }) => {
    const codeEl = children as ReactElement<{ children?: unknown }>;
    const code = typeof codeEl?.props?.children === 'string' ? codeEl.props.children : '';
    return <CopyableCodeBlock>{code}</CopyableCodeBlock>;
  },
};
