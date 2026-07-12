'use client';

import { useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { removeAlert, saveAlert } from '@/app/hesap/mutations';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { BellIcon } from '@/components/ui/icons';
import { formatPrice } from '@/lib/normalize';

/**
 * Ürün sayfası fiyat alarmı. Oturum yoksa girişe yönlendirir. Hedef fiyatın
 * altına düşünce e-posta gider (kontrol tarama sonrası, scrapers/run.ts).
 */
export default function AlertForm({
  variantId,
  currentPrice,
  initialTarget,
  loggedIn,
}: {
  variantId: number;
  currentPrice: number | null;
  initialTarget: number | null;
  loggedIn: boolean;
}) {
  const [target, setTarget] = useState<number | null>(initialTarget);
  const [editing, setEditing] = useState(initialTarget == null);
  // Varsayılan öneri: güncel fiyatın %10 altı (yuvarlanmış).
  const suggested = currentPrice ? Math.max(1, Math.round((currentPrice * 0.9) / 10) * 10) : 0;
  const [value, setValue] = useState<string>(initialTarget?.toString() ?? (suggested ? String(suggested) : ''));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  function goLogin() {
    router.push(`/giris?next=${encodeURIComponent(pathname)}`);
  }

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const num = Number(value.replace(',', '.'));
    if (!Number.isFinite(num) || num <= 0) {
      setError('Geçerli bir hedef fiyat girin.');
      return;
    }
    startTransition(async () => {
      const res = await saveAlert(variantId, num);
      if ('needsAuth' in res) return goLogin();
      if ('error' in res) return setError(res.error);
      setTarget(res.targetPrice);
      setEditing(false);
    });
  }

  function onRemove() {
    startTransition(async () => {
      const res = await removeAlert(variantId);
      if ('needsAuth' in res) return goLogin();
      setTarget(null);
      setValue(suggested ? String(suggested) : '');
      setEditing(true);
    });
  }

  if (!loggedIn) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-alt/60 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <BellIcon className="h-5 w-5 text-primary" />
          <p className="text-body-sm text-text">
            Fiyat düşünce <span className="font-semibold">e-posta ile haber ver</span> — ücretsiz fiyat alarmı kur.
          </p>
        </div>
        <Button onClick={goLogin} size="sm" className="shrink-0">Giriş yap</Button>
      </div>
    );
  }

  // Alarm kurulu, düzenlenmiyor: özet göster.
  if (target != null && !editing) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary-soft/50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <BellIcon className="h-5 w-5 text-primary" />
          <p className="text-body-sm text-text">
            Alarm kurulu — fiyat <span className="font-mono font-semibold tabular-nums">{formatPrice(target)}</span> altına düşünce e-posta göndereceğiz.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)} disabled={pending}>Düzenle</Button>
          <Button variant="ghost" size="sm" onClick={onRemove} disabled={pending}>Kaldır</Button>
        </div>
      </div>
    );
  }

  // Form.
  return (
    <form onSubmit={onSave} className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-alt/60 p-5">
      <div className="flex items-center gap-2.5">
        <BellIcon className="h-5 w-5 text-primary" />
        <p className="text-body-sm font-semibold text-text">Fiyat alarmı kur</p>
      </div>
      <p className="text-caption text-muted">
        {currentPrice
          ? `Güncel en ucuz fiyat ${formatPrice(currentPrice)}. Hedeflediğin fiyatı gir — bu değerin altına düşünce e-posta göndereceğiz.`
          : 'Hedeflediğin fiyatı gir — bu değerin altına düşünce e-posta göndereceğiz.'}
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          type="number"
          inputMode="decimal"
          min={1}
          step="1"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Hedef fiyat (₺)"
          className="sm:max-w-48"
          aria-label="Hedef fiyat"
        />
        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>{pending ? 'Kaydediliyor…' : 'Alarmı kur'}</Button>
          {target != null && (
            <Button type="button" variant="ghost" onClick={() => setEditing(false)} disabled={pending}>Vazgeç</Button>
          )}
        </div>
      </div>
      {error && <p className="text-caption text-danger">{error}</p>}
    </form>
  );
}
