import type { ReactNode } from 'react';
import Breadcrumb from '@/components/ui/Breadcrumb';

/** Yasal/bilgi sayfaları için ortak kabuk — düz h2/p/ul yazılır, stiller burada. */
export default function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Breadcrumb items={[{ label: 'Ana Sayfa', href: '/' }, { label: title }]} />
      <header className="border-b border-border/60 pb-5">
        <h1 className="font-heading text-title font-extrabold text-text sm:text-display">{title}</h1>
        {updated && <p className="mt-1.5 text-caption text-muted">Son güncelleme: {updated}</p>}
      </header>
      <article
        className="space-y-4 pb-8 text-body-sm leading-relaxed text-text
          [&_h2]:mt-8 [&_h2]:mb-1 [&_h2]:font-heading [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-text
          [&_p]:text-muted
          [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_ul]:text-muted
          [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2"
      >
        {children}
      </article>
    </div>
  );
}
