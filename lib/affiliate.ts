// Ortaklık (affiliate) linkleri — saf TS, Next.js importu yok.
//
// Her site için eklenecek query parametreleri env'den okunur; tanımsızsa URL
// AYNEN döner (no-op). Böylece ortaklık programına üye olunmadan da uygulama
// çalışır, üyelik gelince sadece env eklenir.
//
//   AFFILIATE_TRENDYOL_PARAMS="utm_source=fiyatk&subid=..."   (ör.)
//   AFFILIATE_AMAZON_PARAMS="tag=fiyatk-21"
//   AFFILIATE_HEPSIBURADA_PARAMS / _VATAN_PARAMS / _N11_PARAMS
//
// NOT: Bazı TR ortaklık ağları (Admitad, Gelir Ortakları) hedef URL'i tümüyle
// bir "deeplink" içine sarar — o durumda bu basit parametre ekleme yetmez, siteye
// özel sarmalama gerekir (buraya eklenebilir). Amazon gibi `tag=` ile çalışan
// programlar ve doğrudan UTM tabanlı izlemeler bu haliyle desteklenir.

import type { SiteName } from './types';

function siteParams(site: SiteName): string | undefined {
  const raw = process.env[`AFFILIATE_${site.toUpperCase()}_PARAMS`];
  return raw && raw.trim() ? raw.trim() : undefined;
}

/** Bir mağaza ürün URL'ine yapılandırılmış ortaklık parametrelerini ekler. */
export function affiliateUrl(rawUrl: string, site: SiteName): string {
  const params = siteParams(site);
  if (!params) return rawUrl;
  try {
    const url = new URL(rawUrl);
    for (const [key, value] of new URLSearchParams(params)) {
      url.searchParams.set(key, value);
    }
    return url.toString();
  } catch {
    return rawUrl;
  }
}

/** Bir sitede ortaklık yapılandırması var mı? (rel="sponsored" eklemek için.) */
export function isAffiliateConfigured(site: SiteName): boolean {
  return siteParams(site) !== undefined;
}
