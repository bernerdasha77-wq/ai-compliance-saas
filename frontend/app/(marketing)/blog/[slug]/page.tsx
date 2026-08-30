import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { compileMDX } from 'next-mdx-remote/rsc';
import { getBlogSlugs, getPostRaw, estimateReadTime } from '../../../lib/blog';
import { mdxComponents } from '../../../lib/mdx-components';

interface Frontmatter {
  title: string;
  description: string;
  date: string;
  tags?: string[];
}

export async function generateStaticParams() {
  return getBlogSlugs().map((slug) => ({ slug }));
}

export const dynamicParams = false;

async function loadPost(slug: string) {
  if (!getBlogSlugs().includes(slug)) return null;
  const source = getPostRaw(slug);
  const { content, frontmatter } = await compileMDX<Frontmatter>({
    source,
    options: { parseFrontmatter: true },
    components: mdxComponents,
  });
  return { content, frontmatter, raw: source };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) return {};

  const { title, description } = post.frontmatter;
  return {
    title: `${title} — AI Compliance Checker`,
    description,
    openGraph: {
      title,
      description,
      url: `/blog/${slug}`,
      type: 'article',
      locale: 'ru_RU',
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) notFound();

  const { content, frontmatter, raw } = post;
  const readTime = estimateReadTime(raw);
  const formattedDate = new Date(frontmatter.date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="max-w-3xl mx-auto px-6 sm:px-10 py-14">
      <nav aria-label="Хлебные крошки" className="text-sm text-ink-500 mb-8 flex items-center gap-2">
        <Link href="/blog" className="hover:text-ink-900 transition">
          Блог
        </Link>
        <span>/</span>
        <span className="text-ink-900 truncate">{frontmatter.title}</span>
      </nav>

      <article>
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-ink-900 mb-3">{frontmatter.title}</h1>
          <div className="flex items-center gap-3 text-sm text-ink-500">
            <time dateTime={frontmatter.date}>{formattedDate}</time>
            <span>·</span>
            <span>{readTime} мин чтения</span>
          </div>
        </header>

        <div className="prose max-w-none prose-headings:text-ink-900 prose-p:text-ink-700 prose-a:text-brand prose-a:no-underline hover:prose-a:underline prose-strong:text-ink-900 prose-li:text-ink-700 prose-blockquote:border-brand prose-blockquote:text-ink-700">
          {content}
        </div>
      </article>

      <div className="mt-12 p-6 sm:p-8 bg-navy text-white rounded-card text-center">
        <p className="text-lg font-semibold mb-2">Проверьте свой договор прямо сейчас</p>
        <p className="text-sm text-navy-300 mb-5">Первая проверка — бесплатно, с полным отчётом.</p>
        <Link
          href="/analyze"
          className="inline-block px-6 py-3 bg-brand text-white font-semibold rounded-lg hover:bg-brand-hover transition"
        >
          Проверить документ →
        </Link>
      </div>
    </div>
  );
}
