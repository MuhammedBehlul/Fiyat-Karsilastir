// Admin panelinden tetiklenen YEREL scrape çalıştırıcısı: `npm run scrape`
// ayrı bir alt süreç olarak başlatılır (run.ts sonunda process.exit() çağırıyor —
// in-process import edilirse Next.js dev sunucusunu da öldürür).
//
// Yalnızca `next dev` altında çalışır (bkz. isLocalScrapeAllowed) — bu modül
// admin-parola korumalı bir API rotasından tetiklense de, deploy edilmiş bir
// sunucuda rastgele shell süreci başlatan bir uç nokta bırakmamak için sert
// bir NODE_ENV kapısı var. Süreç durumu bellekte tutulur: dev sunucusu tek,
// uzun ömürlü bir process olduğundan bu yeterlidir (ayrı bir store gerekmez).

import { spawn } from 'node:child_process';
import { CATEGORIES, SITES, type CategorySlug, type SiteName } from '../lib/types';
import { parseProgressLine, type ProgressEvent } from './progress-protocol';

const MAX_LOG_LINES = 400;

interface SiteResultSummary {
  site: SiteName;
  productsFound: number;
  productsUpserted: number;
  error?: boolean;
}

/** Canlı ilerleme: run.ts'in stdout'a bastığı @@PROGRESS@@ satırlarından derlenir. */
interface RunProgress {
  totalSites: number;
  totalCategories: number;
  doneCategories: number;
  siteIndex: number | null;
  currentSite: SiteName | null;
  currentCategory: CategorySlug | null;
  currentCategoryIndex: number | null;
  currentCategoryTotal: number | null;
  sitesPlan: { site: SiteName; categories: number }[];
  siteResults: SiteResultSummary[];
}

interface LocalRunState {
  running: boolean;
  startedAt: string | null;
  finishedAt: string | null;
  exitCode: number | null;
  sites: SiteName[];
  /** Boş dizi = filtre yok, taranan sitenin bildirdiği TÜM kategoriler. */
  categories: CategorySlug[];
  log: string[];
  progress: RunProgress | null;
}

// globalThis'e sabitlenir (lib/db.ts'teki Prisma singleton'ıyla aynı desen):
// Next.js dev sunucusu proje ağacındaki HERHANGİ bir dosya kaydında route
// modüllerini yeniden değerlendirebiliyor (Turbopack/HMR) — sıradan bir modül
// düzeyi değişken bu sırada sıfırlanır ve gerçekte hâlâ çalışan alt süreç
// "çalışmıyor" gibi görünür. globalThis gerçek JS realm'i olduğundan modül
// yeniden değerlendirmesinden etkilenmez.
const globalForLocalRun = globalThis as unknown as { __localScrapeState?: LocalRunState };
const state: LocalRunState = globalForLocalRun.__localScrapeState ?? {
  running: false,
  startedAt: null,
  finishedAt: null,
  exitCode: null,
  sites: [],
  categories: [],
  log: [],
  progress: null,
};
globalForLocalRun.__localScrapeState = state;

export function isLocalScrapeAllowed(): boolean {
  // `next start` (üretim derlemesi) NODE_ENV=production ayarlar; yalnızca
  // `next dev` bunu 'development' bırakır — deploy edilmiş bir örnekte bu
  // fonksiyon her zaman false döner ve alt süreç asla başlamaz.
  return process.env.NODE_ENV !== 'production';
}

function pushLog(line: string) {
  if (!line.trim()) return;
  state.log.push(line);
  if (state.log.length > MAX_LOG_LINES) state.log.splice(0, state.log.length - MAX_LOG_LINES);
}

function applyProgressEvent(event: ProgressEvent) {
  const p = state.progress;
  if (!p) return;
  switch (event.type) {
    case 'plan':
      p.sitesPlan = event.sites;
      p.totalCategories = event.sites.reduce((sum, s) => sum + s.categories, 0);
      break;
    case 'site-start':
      p.siteIndex = event.index;
      p.currentSite = event.site;
      p.currentCategory = null;
      p.currentCategoryIndex = null;
      p.currentCategoryTotal = null;
      break;
    case 'category':
      p.currentSite = event.site;
      p.currentCategory = event.category;
      p.currentCategoryIndex = event.index;
      p.currentCategoryTotal = event.total;
      if (event.phase === 'done') p.doneCategories++;
      break;
    case 'site-done':
      p.siteResults.push({
        site: event.site,
        productsFound: event.productsFound,
        productsUpserted: event.productsUpserted,
        error: event.error,
      });
      break;
  }
}

/** Bir satır ilerleme olayıysa yapılandırılmış duruma işlenir, değilse ham log'a düşer. */
function processLine(rawLine: string) {
  const line = rawLine.replace(/\r$/, '');
  const event = parseProgressLine(line);
  if (event) {
    applyProgressEvent(event);
    return;
  }
  pushLog(line);
}

/**
 * stdout/stderr parça parça (chunk) gelir; bir JSON ilerleme satırı iki chunk
 * arasında bölünebilir. Satır tamamlanana kadar arabelleğe alınır.
 */
function createLineReader(onLine: (line: string) => void) {
  let buffer = '';
  return {
    write(chunk: Buffer) {
      buffer += chunk.toString('utf-8');
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) onLine(line);
    },
    flush() {
      if (buffer.trim()) onLine(buffer);
      buffer = '';
    },
  };
}

export function getLocalScrapeState(): LocalRunState {
  return {
    ...state,
    log: [...state.log],
    progress: state.progress
      ? { ...state.progress, sitesPlan: [...state.progress.sitesPlan], siteResults: [...state.progress.siteResults] }
      : null,
  };
}

/**
 * Bilinen site adları/kategori slug'larıyla sınırlı — sonradan spawn'a giden
 * argümanlar hep sabit bir kümeden gelir. `categories` boşsa filtre uygulanmaz
 * (taranan sitenin bildirdiği TÜM kategoriler) — böylece "sadece bu kategoriyi
 * yeniden tara" mümkün olur, her seferinde baştan sona tüm kataloğu taramaya
 * gerek kalmaz.
 */
export function startLocalScrape(
  sites: SiteName[],
  categories: CategorySlug[] = [],
): { ok: true } | { ok: false; error: string } {
  if (!isLocalScrapeAllowed()) {
    return { ok: false, error: 'Yerel scrape yalnızca `npm run dev` ile geliştirme ortamında kullanılabilir.' };
  }
  if (state.running) {
    return { ok: false, error: 'Yerel scrape zaten çalışıyor.' };
  }
  const validSites = sites.filter((s): s is SiteName => (SITES as readonly string[]).includes(s));
  if (validSites.length === 0) {
    return { ok: false, error: 'En az bir geçerli site seçilmeli.' };
  }
  const validCategories = categories.filter((c): c is CategorySlug => c in CATEGORIES);

  state.running = true;
  state.startedAt = new Date().toISOString();
  state.finishedAt = null;
  state.exitCode = null;
  state.sites = validSites;
  state.categories = validCategories;
  state.log = [];
  state.progress = {
    totalSites: validSites.length,
    totalCategories: 0,
    doneCategories: 0,
    siteIndex: null,
    currentSite: null,
    currentCategory: null,
    currentCategoryIndex: null,
    currentCategoryTotal: null,
    sitesPlan: [],
    siteResults: [],
  };
  const catArgs = validCategories.length > 0 ? [`--cat=${validCategories.join(',')}`] : [];
  pushLog(`$ npm run scrape -- ${validSites.join(' ')}${catArgs.length ? ' ' + catArgs.join(' ') : ''}`);

  try {
    // Windows'ta .cmd dosyaları (npm.cmd) shell:true olmadan EINVAL ile
    // SENKRON fırlatır — dizi argümanlar shell:true altında da cmd.exe
    // tarafından doğru tırnaklanır (enjeksiyon riski yok, site/kategori adları
    // zaten sabit listelerle doğrulandı). POSIX'te shell gerekmiyor.
    const child = spawn('npm', ['run', 'scrape', '--', ...validSites, ...catArgs], {
      cwd: process.cwd(),
      env: process.env,
      shell: process.platform === 'win32',
    });

    const stdoutReader = createLineReader(processLine);
    const stderrReader = createLineReader(processLine);
    child.stdout?.on('data', (chunk: Buffer) => stdoutReader.write(chunk));
    child.stderr?.on('data', (chunk: Buffer) => stderrReader.write(chunk));
    child.on('error', (err) => {
      pushLog(`✖ Süreç başlatılamadı: ${err.message}`);
      state.running = false;
      state.finishedAt = new Date().toISOString();
    });
    child.on('close', (code) => {
      stdoutReader.flush();
      stderrReader.flush();
      pushLog(`— süreç sonlandı (exit ${code}) —`);
      state.running = false;
      state.finishedAt = new Date().toISOString();
      state.exitCode = code;
    });
  } catch (err) {
    // spawn() bazı ortamlarda (Windows .cmd) senkron fırlatabiliyor — burada
    // yakalanmazsa state.running hiç sıfırlanmayan "sahte çalışıyor" durumunda kalır.
    pushLog(`✖ Süreç başlatılamadı: ${(err as Error).message}`);
    state.running = false;
    state.finishedAt = new Date().toISOString();
  }

  return { ok: true };
}
