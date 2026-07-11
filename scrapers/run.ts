// Orkestratör: tüm scraper'ları sırayla çalıştırır, sonuçları kaydeder.
// Kullanım:
//   npm run scrape                 -> tüm siteler, DB'ye yazar
//   npm run scrape -- trendyol n11 -> yalnızca seçilen siteler
//   npm run scrape -- --dry        -> DB'ye yazmadan konsola döker (bağlantı gerektirmez)

import 'dotenv/config';
import { runScraper, type SiteScraper } from './engine';
import { closeBrowser } from './browser';
import { politeDelay } from './http';
import { trendyol } from './sites/trendyol';
import { hepsiburada } from './sites/hepsiburada';
import { amazon } from './sites/amazon';
import { vatan } from './sites/vatan';
import { n11 } from './sites/n11';
import type { SiteName } from '../lib/types';

const ALL_SCRAPERS: SiteScraper[] = [trendyol, hepsiburada, amazon, vatan, n11];

// Uygulama tarafındaki 1 saatlik veri cache'ini beklemeden düşürür (best-effort:
// REVALIDATE_URL/TOKEN tanımlı değilse sessizce atlanır, hata scrape'i bozmaz).
async function pingRevalidate() {
  const url = process.env.REVALIDATE_URL;
  const token = process.env.REVALIDATE_TOKEN;
  if (!url || !token) return;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
    });
    console.log(res.ok ? '\n✓ Uygulama cache’i tazelendi' : `\n⚠ Cache tazeleme ${res.status} döndü`);
  } catch (err) {
    console.warn(`\n⚠ Cache tazeleme başarısız: ${(err as Error).message}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dry = args.includes('--dry');
  const siteFilter = args.filter((a) => !a.startsWith('--')) as SiteName[];
  const scrapers = siteFilter.length
    ? ALL_SCRAPERS.filter((s) => siteFilter.includes(s.site))
    : ALL_SCRAPERS;

  if (scrapers.length === 0) {
    console.error(`Bilinmeyen site. Geçerli değerler: ${ALL_SCRAPERS.map((s) => s.site).join(', ')}`);
    process.exit(1);
  }

  // persist modülünü yalnızca gerektiğinde yükle ki --dry mod DB bağlantısı istemesin.
  const persist = dry ? null : await import('./persist');

  let hadError = false;
  for (const [i, scraper] of scrapers.entries()) {
    if (i > 0) await politeDelay();
    console.log(`\n▶ ${scraper.site} scrape ediliyor...`);
    const runId = persist ? await persist.startRun(scraper.site) : null;
    try {
      const result = await runScraper(scraper);
      console.log(
        `  ${result.products.length} ürün bulundu (${result.pagesFetched} sayfa, yöntem: ${result.usedBrowser ? 'playwright' : 'fetch'})` +
          (result.errors.length ? `, ${result.errors.length} sayfa hatası` : ''),
      );
      for (const e of result.errors) console.warn(`  ⚠ ${e}`);

      if (persist && runId !== null) {
        const outcome = await persist.saveProducts(result.products, {
          enrich: scraper.enrichDetail,
        });
        await persist.finishRun(runId, {
          status: result.errors.length && result.products.length === 0 ? 'error' : 'success',
          productsFound: result.products.length,
          productsUpserted: outcome.upserted,
          errorMessage: result.errors.join('; ') || undefined,
        });
        console.log(
          `  ${outcome.upserted} kayıt yazıldı` +
            (outcome.accessoriesSkipped ? `, ${outcome.accessoriesSkipped} aksesuar elendi` : '') +
            (outcome.enriched ? `, ${outcome.enriched} detaydan renk alındı` : '') +
            (outcome.fuzzyAccepted ? `, ${outcome.fuzzyAccepted} fuzzy eşleşme` : '') +
            (outcome.reviewLogged ? `, ${outcome.reviewLogged} incelemeye düştü` : ''),
        );
      } else {
        for (const p of result.products.slice(0, 5)) {
          console.log(`    ${p.price} ${p.currency}  ${p.name.slice(0, 60)}`);
        }
        if (result.products.length > 5) console.log(`    ... ve ${result.products.length - 5} ürün daha`);
      }
      if (result.products.length === 0) hadError = true;
    } catch (err) {
      hadError = true;
      console.error(`  ✖ ${scraper.site} başarısız: ${(err as Error).message}`);
      if (persist && runId !== null) {
        await persist.finishRun(runId, {
          status: 'error',
          productsFound: 0,
          productsUpserted: 0,
          errorMessage: (err as Error).message,
        });
      }
    }
  }

  if (persist) await pingRevalidate();
  await closeBrowser();
  // Tek site bile başarısızsa exit 1: GitHub Actions'ta görünür olsun (diğer siteler yine de işlendi).
  process.exit(hadError ? 1 : 0);
}

main();
