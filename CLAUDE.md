# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev                    # Next.js dev server (Turbopack), port 3000
npm run build                  # production build (Turbopack) — do NOT run while dev server is up, corrupts .next
npm run start                  # serve a production build
npm run lint                   # eslint (next/core-web-vitals + next/typescript)
npx tsc --noEmit                # typecheck only

npx prisma migrate dev         # apply schema changes locally (expand/contract pattern for live data — see Data model)
npx prisma migrate deploy      # apply pending migrations without prompting
npx prisma generate            # regenerate client into lib/generated/prisma (auto via postinstall)
npx prisma studio              # browse the DB visually

npm run scrape                 # all 5 sites, every category listing each site declares, writes to DB
npm run scrape -- trendyol n11 # only selected sites
npm run scrape -- --dry        # parse and print to console, no DB connection needed
npm run scrape -- --cat=supermarket,moda  # only selected categories (e.g. initial fill / split runs)
npx tsx scrapers/match-stats.ts [--samples]        # cross-store matching quality report
npx tsx scrapers/cleanup-accessories.ts [--apply]  # purge accessory rows that slipped into a product category (dry-run by default)
npx tsx scrapers/approve-match-reviews.ts [--apply] [--min=0.85]  # auto-merge high-confidence pending MatchReview rows (dry-run by default; see script header for the category exclusions and manual-skip IDs this needs — untracked attributes like flavor/scent/gender/bundle-type make some categories unsafe to auto-merge)
npx tsx scrapers/backfill-brands.ts [--apply]      # re-detect brand on existing null-brand Product rows after extending the BRANDS dict (dry-run by default)
```

There is no automated test suite in this repo. Verify changes with `npx tsc --noEmit`, `npm run lint`, `npm run build`, and by manually exercising the affected pages against the dev server (or a Playwright script for interaction states like hover/focus that curl can't check).

Env vars: `DATABASE_URL` (pooler, port 6543, `pgbouncer=true`) and `DIRECT_URL` (direct, port 5432, used by Prisma CLI/migrations) — see `.env.example`. Optional `REVALIDATE_URL` / `REVALIDATE_TOKEN`: if set, the scraper POSTs to `/api/revalidate` after each run to drop the Next.js cache immediately instead of waiting out the 1h TTL; silently skipped if unset.

## Architecture

### Data model: canonical product vs. variant vs. price

`Product` (brand + model, e.g. "Apple iPhone 15") → `ProductVariant` (attribute signature, e.g. "128GB · Mavi") → `PriceEntry` (one row per site per scrape). **The comparison/display unit is the variant, not the product** — a 128GB and a 256GB phone are different SKUs and their prices are never averaged or merged. `ProductWithPrices` (`lib/types.ts`) is one variant's cross-store view; its `id` is a variant id everywhere in the UI (`/urun/[id]`, `ProductCard`, etc).

The variant signature is **per-category**, defined once in `lib/attributes.ts` (`CATEGORY_ATTRIBUTES`): electronics use storage/RAM/color, fashion size/color, supermarket volume/weight/pack, books nothing (product = its single variant). Known values live in `ProductVariant.attrs` (JSONB; unknown = absent key); `variantKey` is the deterministic signature built by `variantKeyFor` (`color=mavi|ram_gb=?|storage_gb=128` — keys alphabetical, unknown `?`), and its format must stay in lockstep with the SQL rewrite in the `variant_attrs_expand` migration. Each `AttributeDef` carries a `mergePolicy` generalizing the old asymmetric rules: `fill` (unknown may join a known variant and backfill it — storage/RAM) vs `strict` (unknown waits in its own variant — color, size). **Transition state (expand/contract):** the legacy `storage_gb`/`ram_gb`/`color` columns still exist, `scrapers/persist.ts` dual-writes them alongside `attrs`, and queries/facets/matching still read the columns; drop them only after every reader moves to `attrs`.

Title parsing and canonicalization lives entirely in `lib/variant.ts`: brand dictionary, Turkish/English color dictionary with base-color grouping, storage/RAM valid-value sets (used to disambiguate ambiguous "4/128" style patterns), and per-category accessory-detection regexes (a "kulaklık" mention is an accessory signal in the telefon category but is the product itself in the kulaklik category — patterns are keyed by category slug, not global). Extend parsing here, never per-scraper.

Cross-store matching (`lib/matching.ts`): exact `modelKey` match first, then token-set Dice similarity within the same brand — but only when a set of "differentiator" tokens (model numbers, Pro/Plus/Max/Ultra/...) match exactly, so e.g. "Note 15 Pro" never fuzzy-matches "Note 15 Pro+" even at high similarity ("Note" itself isn't a differentiator token though — "Redmi Note 13" vs "Redmi 13" can still land in the review band; a known gap). ≥0.90 auto-accepts; 0.75–0.90 goes to the `MatchReview` table (visible on `/admin`) instead of being silently merged, and the scraped row still gets its own product so no price data is lost. Variant-level unknown fields follow asymmetric rules: an unknown RAM/storage can join a matching variant (and backfills the value), but an unknown color never merges into a colored variant — it waits in its own "color unknown" variant (N11 listings fill this in later via a detail-page fetch, capped at ~25/run).

`scrapers/approve-match-reviews.ts` auto-merges high-score (default ≥0.85) pending `MatchReview` rows in bulk (brand must match on both sides; a same-brand, ≥3-shared-modelKey-token safety check catches weak overlaps). It hard-excludes categories where a real product difference isn't captured by any tracked attribute and title similarity alone can't tell them apart — confirmed cases: petshop/supermarket (flavor/scent), anne-bebek ("bebek bezi" tape-diaper vs "kulot bez" pull-up — different format), kozmetik (erkek/kadın gender). Even within safe categories, one-off false positives slip through generic filler words ("erkek kol saati", "Standard/Adventure Combo") — the script's `MANUAL_SKIP_REVIEW_IDS` has worked examples; always dry-run and eyeball the list before `--apply` on new data, don't assume the existing exclusion list is exhaustive for categories not yet audited.

### `lib/` vs Next.js-aware code

Files directly in `lib/` (except `cached.ts`) are pure TypeScript with no Next.js import, by design — stated in `lib/queries.ts`'s own header comment, intended to stay portable. `lib/queries.ts` holds every Prisma query as a plain async function; `lib/cached.ts` wraps most of them in `unstable_cache` (tag `catalog`, 1h revalidate) for pages to import instead.

One deliberate exception: `getProductsByCategory` (filtered/sorted/paginated category listing, raw SQL with a shared `VARIANT_PRICE_CTE` for "current cheapest price + site count") is **not** wrapped in `unstable_cache` — filter permutations would create unbounded cache keys for no benefit, since the category page is already `dynamic = 'force-dynamic'` and Postgres cost is trivial at this catalog size. `getCategoryFacets` (available brand/storage/RAM/color values + counts, for building the filter sidebar) *is* cached — one entry per category, independent of the filters actually applied. Category-scoped `getTopPriceDrops`/`getFeaturedProducts` take an optional trailing `categorySlug` and are called from more than one place (`CategoryWidgets`, `Navbar`'s mega menu) with identical `(limit, slug)` args on purpose, so they share one cache entry — don't wrap them again locally in a new component.

### Category filtering is URL state, not component state

`lib/filters.ts` owns the query-param schema (`?brand=A,B&storage=128,256&min=&max=&comparable=1&sort=price-asc&page=2`) with parse/build helpers used identically by the server (the category page reads `searchParams`) and the client (`CategoryFilters` reads `useSearchParams()`). Only `CategoryFilters` and its two children (`FilterCheckboxGroup`, `PriceRangeInput`) are `'use client'` — checkbox toggles call `router.replace` immediately, price inputs debounce ~400ms. Everything else that touches filters (`Pagination`, `SortSelect`, `ActiveFilterChips`, `Breadcrumb`) is a plain server component built entirely from `<Link>`s with mutated query strings — removing a filter or changing sort/page is just navigation, no client JS needed. This mirrors the app's general JS-minimal bias: the mobile nav menu is a native `<details>`, and the navbar's category mega menu opens via pure CSS (`group-hover`/`group-focus-within`), not React state.

### Scraper engine

`scrapers/engine.ts` drives every site: each `SiteScraper` declares `CategoryListing[]` (a start URL + optional `pageUrl(page)` builder), and the engine walks pages up to `SCRAPE_MAX_PAGES` (env, default 5) per category, stopping a category early once a page yields zero *new* product URLs. Sites without server-side pagination support (Vatan — robots.txt bans `?page=`; Amazon — `/b` browse pages don't paginate) just declare no `pageUrl`. A page that returns 200 but parses to zero items is treated as "maybe JS-rendered" and retried via Playwright — but if Playwright *also* comes back empty (e.g. Hepsiburada serving a bot-challenge to headless Chrome), the engine does **not** permanently pin that site to browser mode, so later categories in the same run still get a fresh shot at plain `fetch`.

Category listing URLs are never guessed — each one was found in the target site's own navigation/category tree and verified live to return real product cards before being hardcoded into the scraper.

`scrapers/persist.ts` runs the parse → match → upsert pipeline per scraped item; `scrapers/cleanup-accessories.ts` is a standalone maintenance script (dry-run by default) for retroactively purging rows that an accessory-pattern update reveals were misclassified.

`/admin` can also trigger a scrape locally instead of via GitHub Actions (`scrapers/local-runner.ts`, spawned as a real child process since `run.ts` calls `process.exit()`) — useful when a site blocks GitHub's IPs but not yours. It only runs under `NODE_ENV !== 'production'` (both the API route and the module itself refuse otherwise) so a deployed instance can never spawn a shell process from a web request. Its in-memory run state is pinned to `globalThis` (same pattern as `lib/db.ts`'s Prisma singleton) because Next dev's HMR re-evaluates route modules on *any* file save, which would otherwise silently drop a running scrape's status. The child process reports structured progress (site/category/% done) back over stdout as `@@PROGRESS@@`-prefixed JSON lines (`scrapers/progress-protocol.ts`), parsed by the admin UI into a live progress bar; supports `--cat=` filtering via the same UI so you can re-scrape one category without redoing the whole catalog.

### Design system

`app/globals.css` defines a single semantic token set under `@theme inline` (Faz 1) — `primary`/`accent`/`success`/`danger` are meaning-bound (e.g. `success` is *only* for cheapest-price/price-drop, never decorative), plus `surface`/`surface-alt`/`border`/`text`/`muted` and a `text-*`/`price-*` type scale. `components/ui/` primitives use only these tokens, never hardcoded hex or Tailwind's default color scale. Prices are always rendered through `PriceTag` (`font-mono tabular-nums`) — never hand-formatted inline. A legacy pre-redesign token set (`ink`, `navy`, `slate`, `paper`, `hairline`, ...) existed alongside this and was fully removed on 2026-07-11; don't reintroduce those names.

`components/ui/` = generic, data-agnostic primitives (Card, Badge, Button, CategoryChip, Breadcrumb, Pagination...). `components/` (top level) = page-aware components that take domain data as props (ProductCard, CategoryFilters, CategoryWidgets, Navbar's mega menu wiring...).

The navbar (`components/ui/Navbar.tsx`) is an async server component — its category mega menu previews (top brands + a few featured products per category) are fetched via the already-cached `lib/cached.ts` functions, not a bespoke cache wrapper. It has a documented-but-empty slot (see the comment in the file) reserved for future account/favorites/price-alert icons; when one of those features lands, add the icon to `components/ui/icons.tsx` and place it there rather than inventing a new layout position.

### Conventions

- UI copy and code comments are Turkish; identifiers, types, and API/DB field names are English.
- `foldTurkish` (`lib/variant.ts`) — lowercases and strips Turkish diacritics to ASCII — is the shared normalization used anywhere text needs to match across differently-cased/accented sources (search, variant parsing, accessory detection).
- `CATEGORIES` (`lib/types.ts`) is the single source of truth for tracked **leaf** category slugs/labels — the unit of scraping, matching, accessory patterns, and attribute definitions. `CATEGORY_GROUPS` (same file) arranges the leaves into the 10 cimri-style top-level navigation groups. Don't hardcode category lists elsewhere (navbar, sitemaps, filters all derive from these).
- Category page and any other paginated/filterable list should stay `dynamic = 'force-dynamic'` with an explicit `generateMetadata` setting `alternates.canonical` back to the bare URL, so filter/sort/page permutations aren't indexed as separate pages.
