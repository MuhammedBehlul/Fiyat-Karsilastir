import { NextResponse } from 'next/server';
import { getScrapeWorkflowRuns } from '@/lib/github';

export async function GET() {
  const token = process.env.GITHUB_ACTIONS_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'GITHUB_ACTIONS_TOKEN tanımlı değil' }, { status: 500 });
  }

  try {
    const runs = await getScrapeWorkflowRuns(token, 5);
    return NextResponse.json({ runs });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
