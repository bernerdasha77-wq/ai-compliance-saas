import type { Metadata } from 'next';
import Link from 'next/link';
import Card from '../../components/ui/Card';
import { getAllPosts } from '../../lib/blog';

const TITLE = 'Блог — AI Compliance Checker';
const DESCRIPTION =
  'Статьи о соответствии 152-ФЗ, GDPR, ISO 27001 и NIS2 — риски, штрафы и практические советы для российского бизнеса.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: '/blog',
    type: 'website',
    locale: 'ru_RU',
  },
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="max-w-4xl mx-auto px-6 sm:px-10 py-14">
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-ink-900 mb-4">Блог</h1>
        <p className="text-lg text-ink-700 max-w-2xl mx-auto">
          Разборы законов, штрафов и практические советы по цифровому комплаенсу.
        </p>
      </div>

      {posts.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-ink-500">Скоро здесь появятся статьи.</p>
        </Card>
      ) : (
        <div className="space-y-5">
          {posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`}>
              <Card className="p-6 hover:shadow-card-hover transition">
                <time
                  dateTime={post.date}
                  className="text-xs text-ink-500 font-medium uppercase tracking-wide"
                >
                  {new Date(post.date).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </time>
                <h2 className="text-xl font-semibold text-ink-900 mt-2 mb-2">{post.title}</h2>
                <p className="text-ink-700">{post.description}</p>
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs font-medium text-ink-500 bg-ink-100 px-2.5 py-1 rounded-pill"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
