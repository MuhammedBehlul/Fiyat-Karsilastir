import { NextResponse } from 'next/server';
import { getLocalScrapeState, isLocalScrapeAllowed } from '@/scrapers/local-runner';

export async function GET() {
  if (!isLocalScrapeAllowed()) {
    return NextResponse.json({ allowed: false });
  }
  return NextResponse.json({ allowed: true, ...getLocalScrapeState() });
}
