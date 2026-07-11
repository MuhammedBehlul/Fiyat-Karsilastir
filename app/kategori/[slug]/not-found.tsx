import CategoryGrid from '@/components/CategoryGrid';
import Card from '@/components/ui/Card';
import { getCategories } from '@/lib/cached';

export default async function CategoryNotFound() {
  const categories = await getCategories().catch(() => []);
  return (
    <div className="flex flex-col gap-6">
      <Card className="p-8 text-center">
        <h1 className="font-heading text-title font-bold text-text">Kategori bulunamadı</h1>
        <p className="mt-2 text-body-sm text-muted">
          Aradığınız kategori yok ya da adresi değişmiş olabilir. Takip ettiğimiz kategoriler:
        </p>
      </Card>
      <CategoryGrid categories={categories} />
    </div>
  );
}
