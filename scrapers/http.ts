// HTTP tabanlı scraping yardımcıları: gerçekçi header'lar, retry, rate limit.

const CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

/** Bot korumalarının beklediği tam tarayıcı başlık seti (Hepsiburada bunsuz 403 veriyor). */
export const BROWSER_HEADERS: Record<string, string> = {
  'User-Agent': CHROME_UA,
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
  'sec-ch-ua': '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
};

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** İstekler arası nazik gecikme: 2-4 sn arası rastgele. */
export function politeDelay(): Promise<void> {
  return sleep(2000 + Math.random() * 2000);
}

export class BlockedError extends Error {
  constructor(url: string, reason: string) {
    super(`Blocked at ${url}: ${reason}`);
    this.name = 'BlockedError';
  }
}

/** Yanıtın bot koruması / challenge sayfası olup olmadığını sezer. */
export function looksBlocked(status: number, html: string): string | null {
  if (status === 403 || status === 429 || status === 503) return `HTTP ${status}`;
  const head = html.slice(0, 4000).toLowerCase();
  if (/captcha|are you a human|robot check|güvenlik|cf-challenge|attention required/.test(head))
    return 'challenge page';
  return null;
}

/**
 * HTML sayfası indirir; 3 deneme, exponential backoff.
 * Bot koruması sezilirse BlockedError fırlatır (çağıran Playwright'a düşebilir).
 */
export async function fetchHtml(url: string, attempts = 3): Promise<string> {
  let lastError: Error = new Error('unreachable');
  for (let i = 0; i < attempts; i++) {
    if (i > 0) await sleep(3000 * 2 ** (i - 1));
    try {
      const res = await fetch(url, { headers: BROWSER_HEADERS, redirect: 'follow' });
      const html = await res.text();
      const blocked = looksBlocked(res.status, html);
      if (blocked) throw new BlockedError(url, blocked);
      if (!res.ok) throw new Error(`HTTP ${res.status} at ${url}`);
      return html;
    } catch (err) {
      lastError = err as Error;
      if (err instanceof BlockedError) throw err; // retry ile aşılamaz, hemen fallback'e geç
    }
  }
  throw lastError;
}
