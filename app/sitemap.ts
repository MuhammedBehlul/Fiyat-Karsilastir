import type { MetadataRoute } from 'next';
import { getSitemapEntries } from '@/lib/cached';
import { siteUrl } from '@/lib/seo';
import { CATEGORIES } from '@/lib/types';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await getSitemapEntries().catch(() => []);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl('/'), changeFrequency: 'daily', priority: 1 },
    { url: siteUrl('/indirimdekiler'), changeFrequency: 'daily', priority: 0.7 },
    { url: siteUrl('/nasil-calisir'), changeFrequency: 'monthly', priority: 0.3 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = Object.keys(CATEGORIES).map((slug) => ({
    url: siteUrl(`/kategori/${slug}`),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  const productRoutes: MetadataRoute.Sitemap = entries.map((e) => ({
    url: siteUrl(`/urun/${e.id}`),
    lastModified: e.lastModified,
    changeFrequency: 'daily',
    priority: 0.6,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
