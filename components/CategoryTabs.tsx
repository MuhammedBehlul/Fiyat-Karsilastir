'use client';

import { useState } from 'react';
import CategoryTile from './ui/CategoryTile';
import CategoryIcon from './CategoryIcon';

interface CategoryItem {
  id: number;
  name: string;
  slug: string;
}

interface CategoryGroupData {
  groupSlug: string;
  groupLabel: string;
  categories: CategoryItem[];
}

export default function CategoryTabs({ groups }: { groups: CategoryGroupData[] }) {
  const [activeTab, setActiveTab] = useState<string>(groups[0]?.groupSlug ?? 'all');

  const activeGroup = groups.find((g) => g.groupSlug === activeTab) ?? groups[0];
  if (!activeGroup) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* Tab Switcher Buttons */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-4">
        {groups.map((group) => (
          <button
            key={group.groupSlug}
            onClick={() => setActiveTab(group.groupSlug)}
            type="button"
            className={`inline-flex h-9 shrink-0 items-center justify-center rounded-full border px-4 text-body-sm font-semibold transition-all duration-300 ${
              activeTab === group.groupSlug
                ? 'border-primary bg-primary text-white shadow-sm'
                : 'border-border bg-surface text-text hover:border-primary hover:text-primary'
            }`}
          >
            {group.groupLabel}
          </button>
        ))}
      </div>

      {/* Categories Grid for the Active Tab */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 animate-fadeIn">
        {activeGroup.categories.map((c) => (
          <CategoryTile
            key={c.id}
            href={`/kategori/${c.slug}`}
            icon={<CategoryIcon slug={c.slug} className="h-7 w-7" />}
            label={c.name}
          />
        ))}
      </div>
    </div>
  );
}
