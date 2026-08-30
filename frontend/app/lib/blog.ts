import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface BlogPostMeta {
  title: string;
  description: string;
  date: string;
  slug: string;
  tags?: string[];
}

const BLOG_DIR = path.join(process.cwd(), 'content/blog');

export function getBlogSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => f.replace(/\.mdx$/, ''));
}

export function getPostRaw(slug: string): string {
  return fs.readFileSync(path.join(BLOG_DIR, `${slug}.mdx`), 'utf-8');
}

function normalizeDate(value: unknown): string {
  // YAML парсит неэкранированную дату (date: 2026-08-30) как объект Date,
  // а не строку — приводим к ISO-строке в обоих случаях.
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

export function getPostMeta(slug: string): BlogPostMeta {
  const { data } = matter(getPostRaw(slug));
  return {
    title: data.title,
    description: data.description,
    date: normalizeDate(data.date),
    tags: data.tags,
    slug,
  };
}

/** Читаем метаданные через gray-matter (обычный fs.readFileSync), а не через
 * динамический import(`.../${slug}.mdx`) — на пустой content/blog/ бандлер
 * пытается статически проанализировать такой импорт и падает со сборкой
 * ещё до того, как до него вообще дойдёт выполнение (см. историю коммита).
 */
export function getAllPosts(): BlogPostMeta[] {
  return getBlogSlugs()
    .map(getPostMeta)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function estimateReadTime(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
