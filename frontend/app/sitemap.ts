import type { MetadataRoute } from 'next';
import { getAllPosts } from './lib/blog';

const BASE_URL = 'https://www.ai-compliance.online';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const posts = getAllPosts();
  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'yearly',
    priority: 0.6,
  }));

  return [
    { url: BASE_URL, lastModified, changeFrequency: 'monthly', priority: 1 },
    { url: `${BASE_URL}/standards`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/pricing`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/blog`, lastModified, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/about`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/offer`, lastModified, changeFrequency: 'yearly', priority: 0.7 },
    ...postEntries,
  ];
}
