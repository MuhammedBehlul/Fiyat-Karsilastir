import CategoryIcon from './CategoryIcon';
import CategoryTile from './ui/CategoryTile';

export default function CategoryGrid({
  categories,
}: {
  categories: { id: number; name: string; slug: string }[];
}) {
  if (categories.length === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
      {categories.map((c) => (
        <CategoryTile
          key={c.id}
          href={`/kategori/${c.slug}`}
          icon={<CategoryIcon slug={c.slug} className="h-7 w-7" />}
          label={c.name}
        />
      ))}
    </div>
  );
}
