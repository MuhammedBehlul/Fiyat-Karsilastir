'use client';

import { useFormStatus } from 'react-dom';
import Button from '@/components/ui/Button';

/** Form içinde kullanılır; gönderim sırasında otomatik olarak devre dışı + "..." gösterir. */
export default function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? 'Lütfen bekleyin…' : children}
    </Button>
  );
}
