// GitHub Actions API istemcisi — günlük scraping workflow'unu elle tetiklemek
// ve son çalışmaların durumunu okumak için. Next.js'e bağımlılığı yok, sade fetch kullanır.

const REPO = 'MuhammedBehlul/Fiyat-Karsilastir';
const WORKFLOW_FILE = 'scrape.yml';
const API_BASE = `https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW_FILE}`;

function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

export interface WorkflowRunSummary {
  id: number;
  status: string; // queued | in_progress | completed
  conclusion: string | null; // success | failure | cancelled | null
  runNumber: number;
  htmlUrl: string;
  createdAt: string;
}

/** .github/workflows/scrape.yml içindeki workflow_dispatch tetikleyicisini elle çalıştırır. */
export async function dispatchScrapeWorkflow(token: string, ref = 'master'): Promise<void> {
  const res = await fetch(`${API_BASE}/dispatches`, {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ ref }),
  });
  if (!res.ok) {
    throw new Error(`GitHub workflow tetikleme başarısız: ${res.status} ${await res.text()}`);
  }
}

/** Son workflow çalışmalarını en yeniden en eskiye döner. */
export async function getScrapeWorkflowRuns(token: string, limit = 5): Promise<WorkflowRunSummary[]> {
  const res = await fetch(`${API_BASE}/runs?per_page=${limit}`, {
    headers: authHeaders(token),
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`GitHub workflow durumu alınamadı: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { workflow_runs: Array<Record<string, unknown>> };
  return data.workflow_runs.map((r) => ({
    id: r.id as number,
    status: r.status as string,
    conclusion: (r.conclusion as string | null) ?? null,
    runNumber: r.run_number as number,
    htmlUrl: r.html_url as string,
    createdAt: r.created_at as string,
  }));
}
