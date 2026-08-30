import Link from 'next/link';
import type { MDXRemoteProps } from 'next-mdx-remote/rsc';

export const mdxComponents: NonNullable<MDXRemoteProps['components']> = {
  a: ({ href, children }) => (
    <Link
      href={href ?? '#'}
      className="text-brand hover:text-brand-hover underline underline-offset-2"
    >
      {children}
    </Link>
  ),
};
