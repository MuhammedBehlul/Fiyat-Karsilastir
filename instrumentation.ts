// Sunucu tarafı hata bildirimi — Next.js'in yerel onRequestError kancası.
// ERROR_WEBHOOK_URL tanımlıysa her yakalanmamış sunucu hatası oraya JSON olarak
// POST edilir (Discord/Slack webhook'u veya herhangi bir HTTP alıcısı olabilir;
// Discord webhook'ları düz JSON'daki "content" alanını gösterir). Tanımsızsa
// no-op — geliştirmede hata zaten konsola düşer. İleride Sentry'ye geçmek
// istenirse @sentry/nextjs kurulup bu dosyadan Sentry.captureRequestError
// çağrılması yeterli.

import type { Instrumentation } from 'next';

export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  const webhook = process.env.ERROR_WEBHOOK_URL;
  if (!webhook) return;

  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? (err.stack ?? '').split('\n').slice(0, 6).join('\n') : '';

  const summary = [
    `🔴 Sunucu hatası: ${message}`,
    `Yol: ${request.method} ${request.path}`,
    `Konum: ${context.routerKind} / ${context.routePath} (${context.routeType})`,
    stack && '```\n' + stack + '\n```',
  ]
    .filter(Boolean)
    .join('\n');

  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      // "content": Discord biçimi; diğer alanlar genel alıcılar için yapılandırılmış veri.
      body: JSON.stringify({
        content: summary.slice(0, 1900), // Discord 2000 karakter sınırı
        error: message,
        path: `${request.method} ${request.path}`,
        route: context.routePath,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch {
    // Bildirim başarısızlığı uygulamayı asla etkilemesin.
  }
};
