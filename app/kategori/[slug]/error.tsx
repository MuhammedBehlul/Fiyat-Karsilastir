'use client';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

/** Next.js hata sınırı — istemci bileşeni olmak zorundadır. */
export default function CategoryError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <Card className="p-8 text-center">
      <h1 className="font-heading text-title font-bold text-text">Bir şeyler ters gitti</h1>
      <p className="mt-2 text-body-sm text-muted">
        Kategori yüklenirken bir hata oluştu. Sorun sürerse birkaç dakika sonra tekrar deneyin.
      </p>
      <p className="mt-1 font-mono text-caption text-muted/70">{error.message}</p>
      <Button variant="primary" size="md" className="mt-5" onClick={() => reset()}>
        Tekrar dene
      </Button>
    </Card>
  );
}
