'use client';

import { useEffect } from 'react';
import { setCompare } from '@/lib/useCompare';

/**
 * /karsilastir sayfasındaki URL id'lerini localStorage'a yansıtır — paylaşılan
 * bir karşılaştırma bağlantısı açıldığında tepsi de senkron olur, id çıkarıldığında
 * (URL değişince) tepsi güncellenir. Görsel çıktısı yoktur.
 */
export default function CompareSync({ ids }: { ids: number[] }) {
  useEffect(() => {
    setCompare(ids);
  }, [ids]);
  return null;
}
