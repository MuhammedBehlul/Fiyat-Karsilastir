import { NextResponse } from 'next/server';
import { dispatchScrapeWorkflow } from '@/lib/github';

export async function POST() {
  const token = process.env.GITHUB_ACTIONS_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'GITHUB_ACTIONS_TOKEN tanımlı değil' }, { status: 500 });
  }

  try {
    await dispatchScrapeWorkflow(token);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
