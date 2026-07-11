import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { CATALOG_TAG } from '@/lib/cached';

// Scraper işi bitince çağırır (bkz. scrapers/run.ts) — 1 saatlik cache'i beklemeden
// tazeler. REVALIDATE_TOKEN tanımlı değilse uç nokta kapalıdır (her istek 401 alır).
export async function POST(request: Request) {
  const auth = request.headers.get('authorization');
  const token = auth?.startsWith('Bearer ') ? auth.slice('Bearer '.length) : null;
  if (!process.env.REVALIDATE_TOKEN || token !== process.env.REVALIDATE_TOKEN) {
    return NextResponse.json({ revalidated: false }, { status: 401 });
  }
  revalidateTag(CATALOG_TAG);
  return NextResponse.json({ revalidated: true });
}
