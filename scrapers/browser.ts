// Playwright tabanlı sayfa indirme — JS render / bot korumalı siteler için.

import { chromium, type Browser, type BrowserContext } from 'playwright';

let browser: Browser | null = null;
let context: BrowserContext | null = null;

async function getContext(): Promise<BrowserContext> {
  if (context) return context;
  browser = await chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled'],
  });
  context = await browser.newContext({
    locale: 'tr-TR',
    viewport: { width: 1366, height: 900 },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  });
  // Basit bot-tespiti sinyallerini kapat (navigator.webdriver).
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });
  // Görsel/font/medya isteklerini engelle: hem hızlı hem siteye daha az yük.
  await context.route('**/*', (route) => {
    const type = route.request().resourceType();
    if (type === 'image' || type === 'font' || type === 'media') return route.abort();
    return route.continue();
  });
  return context;
}

export interface BrowserFetchResult {
  /** Sunucunun döndürdüğü ham SSR HTML — hydration/virtualization bozmadan önceki tam içerik. */
  ssrHtml: string;
  /** Scroll sonrası canlı DOM — JS ile render edilen içerik için. */
  domHtml: string;
}

/** Sayfayı headless Chromium ile açar, opsiyonel selector'ı bekler, hem SSR hem DOM HTML'i döner. */
export async function fetchHtmlWithBrowser(
  url: string,
  waitForSelector?: string,
): Promise<BrowserFetchResult> {
  const ctx = await getContext();
  const page = await ctx.newPage();
  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const ssrHtml = (await response?.text().catch(() => '')) ?? '';
    if (waitForSelector) {
      await page.waitForSelector(waitForSelector, { timeout: 20000 }).catch(() => {
        // selector gelmese de eldeki HTML ile devam et; parse aşaması boş dönerse hata zaten görünür
      });
    }
    // Lazy-load edilen kartları tetiklemek için sayfanın SONUNA kadar kademeli
    // kaydır: 4 sabit adım alt sıradaki kartların görsellerini hiç tetiklemiyordu
    // (958 varyant görselsiz kalmıştı). Üst sınır güvenlik içindir (sonsuz feed).
    for (let i = 0; i < 15; i++) {
      const { reachedBottom } = await page.evaluate(() => {
        window.scrollBy(0, 1800);
        return {
          reachedBottom:
            window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 200,
        };
      });
      await page.waitForTimeout(500);
      if (reachedBottom) break;
    }
    return { ssrHtml, domHtml: await page.content() };
  } finally {
    await page.close();
  }
}

export async function closeBrowser(): Promise<void> {
  await context?.close().catch(() => {});
  await browser?.close().catch(() => {});
  context = null;
  browser = null;
}
