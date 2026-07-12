import { NextResponse } from 'next/server';
import { isLocalScrapeAllowed, startLocalScrape } from '@/scrapers/local-runner';
import { CATEGORIES, SITES, type CategorySlug, type SiteName } from '@/lib/types';

export async function POST(request: Request) {
  if (!isLocalScrapeAllowed()) {
    return NextResponse.json(
      { error: 'Yerel scrape yalnızca `npm run dev` ile geliştirme ortamında kullanılabilir.' },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const requestedSites = Array.isArray(body.sites) ? (body.sites as string[]) : [...SITES];
  const sites = requestedSites.filter((s): s is SiteName => (SITES as readonly string[]).includes(s));
  // Kategori dizisi boşsa/atlanmışsa filtre uygulanmaz (tüm kategoriler taranır).
  const requestedCategories = Array.isArray(body.categories) ? (body.categories as string[]) : [];
  const categories = requestedCategories.filter((c): c is CategorySlug => c in CATEGORIES);

  const result = startLocalScrape(sites, categories);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
