import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/standards', '/pricing', '/about', '/offer', '/blog', '/faq'],
      disallow: ['/analyze', '/history', '/report', '/admin'],
    },
    sitemap: 'https://www.ai-compliance.online/sitemap.xml',
  };
}
