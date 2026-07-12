import { NextResponse } from 'next/server';
import { getSearchSuggestions } from '@/lib/queries';

// Arama otomatik tamamlama uç noktası. En az 2 karakter; kısa süreli cache.
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) return NextResponse.json({ suggestions: [] });

  const suggestions = await getSearchSuggestions(q, 8).catch(() => []);
  return NextResponse.json(
    { suggestions },
    { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } },
  );
}
