import Link from 'next/link';
import type { ReactNode } from 'react';

/** Giriş/kayıt/şifre sayfaları için ortak, ortalanmış kart kabuğu. */
export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center gap-6 py-8">
      <Link href="/" className="mx-auto flex items-center gap-2.5 font-heading text-lg font-bold tracking-tight text-text">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-blue-500 text-white shadow-md shadow-primary/20">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="M12 3v18M12 5l7 3M12 5l-7 3M19 8c0 2.5-1.5 4.5-3.5 4.5S12 10.5 12 8M5 8c0 2.5 1.5 4.5 3.5 4.5S12 10.5 12 8" />
          </svg>
        </span>
        Fiyat<span className="text-primary">Karşılaştır</span>
      </Link>

      <div className="rounded-3xl border border-border bg-surface p-7 shadow-premium sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="font-heading text-xl font-bold text-text sm:text-2xl">{title}</h1>
          {subtitle && <p className="mt-1.5 text-body-sm text-muted">{subtitle}</p>}
        </div>
        {children}
      </div>

      {footer && <div className="text-center text-body-sm text-muted">{footer}</div>}
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-body-sm font-medium text-text">
      {label}
      {children}
    </label>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="rounded-xl border border-danger/20 bg-danger-soft px-3.5 py-2.5 text-body-sm text-danger">
      {message}
    </p>
  );
}

export function FormNotice({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="rounded-xl border border-success/20 bg-success-soft px-3.5 py-2.5 text-body-sm text-success">
      {message}
    </p>
  );
}
