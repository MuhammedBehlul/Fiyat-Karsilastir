// E-posta gönderimi — takılıp çıkarılabilir taşıyıcı. RESEND_API_KEY tanımlıysa
// Resend REST API'si (SDK bağımlılığı yok, düz fetch); değilse geliştirme modunda
// konsola yazar (şifre sıfırlama linki / alarm bildirimi terminalde görünür).

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function sendEmail(msg: EmailMessage): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? 'FiyatKarşılaştır <onboarding@resend.dev>';

  if (!apiKey) {
    console.log(
      `\n[email:dev] Kime: ${msg.to}\n[email:dev] Konu: ${msg.subject}\n[email:dev] ${msg.text ?? stripHtml(msg.html)}\n`,
    );
    return;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from, to: msg.to, subject: msg.subject, html: msg.html, text: msg.text }),
  });
  if (!res.ok) {
    throw new Error(`E-posta gönderilemedi (${res.status}): ${await res.text().catch(() => '')}`);
  }
}

/** Basit, gövdeye gömülü stille marka tutarlı e-posta şablonu (harici CSS yok). */
export function emailLayout(title: string, bodyHtml: string): string {
  return `<!doctype html><html lang="tr"><body style="margin:0;background:#f1f5f9;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <div style="max-width:520px;margin:0 auto;padding:32px 20px;">
    <div style="font-size:20px;font-weight:700;letter-spacing:-.02em;margin-bottom:20px;">Fiyat<span style="color:#2563eb;">Karşılaştır</span></div>
    <div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:28px;">
      <h1 style="font-size:18px;margin:0 0 14px;">${title}</h1>
      ${bodyHtml}
    </div>
    <p style="color:#64748b;font-size:12px;margin-top:20px;">Bu e-postayı FiyatKarşılaştır hesabınız için aldınız.</p>
  </div>
</body></html>`;
}

export function emailButton(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;font-weight:600;padding:11px 22px;border-radius:10px;font-size:14px;">${label}</a>`;
}
