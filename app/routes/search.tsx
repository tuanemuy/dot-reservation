import { data, Link, useSearchParams } from "react-router";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import type { TenantSummary } from "@/core/application/tenant/searchTenants";
import { searchTenants } from "@/core/application/tenant/searchTenants";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/search";

const ITEMS_PER_PAGE = 12;

const categories = [
  "ヘアサロン",
  "ネイルサロン",
  "エステ",
  "リラクゼーション",
  "整体・整骨院",
  "歯科",
  "クリニック",
];

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const keyword = url.searchParams.get("keyword") || null;
  const area = url.searchParams.get("area") || null;
  const category = url.searchParams.get("category") || null;
  const page = Number(url.searchParams.get("page") || "1");

  const { container } = await import("@/core/di/server");

  const result = await handleUseCase(() =>
    searchTenants({
      container,
      headers: request.headers,
      input: {
        keyword,
        area,
        category,
        page,
        limit: ITEMS_PER_PAGE,
      },
    }),
  ).match(
    (r) => r,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  return {
    items: result.items,
    totalCount: result.totalCount,
    currentPage: page,
    totalPages: Math.ceil(result.totalCount / ITEMS_PER_PAGE),
  };
}

export default function SearchPage({ loaderData }: Route.ComponentProps) {
  const { items, totalCount, currentPage, totalPages } = loaderData;
  const [searchParams, setSearchParams] = useSearchParams();

  const keyword = searchParams.get("keyword") || "";
  const category = searchParams.get("category") || "";

  function handleFilterSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newParams = new URLSearchParams();
    const kw = formData.get("keyword") as string;
    const cat = formData.get("category") as string;
    if (kw) newParams.set("keyword", kw);
    if (cat) newParams.set("category", cat);
    newParams.set("page", "1");
    setSearchParams(newParams);
  }

  return (
    <PublicLayout>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">検索結果</h1>

        {/* Filters */}
        <form
          onSubmit={handleFilterSubmit}
          className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <Input
              type="text"
              name="keyword"
              placeholder="キーワード検索"
              defaultValue={keyword}
            />
          </div>
          <Select name="category" defaultValue={category} className="sm:w-44">
            <option value="">すべてのカテゴリー</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </Select>
          <Button type="submit">検索</Button>
        </form>

        {/* Result count */}
        <p className="mb-4 text-sm text-text-secondary">
          {totalCount}件の店舗が見つかりました
        </p>

        {/* Results */}
        {items.length === 0 ? (
          <div className="py-16 text-center">
            <p className="mb-2 text-lg font-medium text-text-secondary">
              条件に合う店舗が見つかりませんでした
            </p>
            <p className="text-sm text-text-muted">
              検索条件を変更して、もう一度お試しください
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((shop) => (
                <ShopCard key={shop.id} shop={shop} />
              ))}
            </div>

            <div className="mt-8">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                baseUrl="/search"
                searchParams={searchParams}
              />
            </div>
          </>
        )}
      </div>
    </PublicLayout>
  );
}

function ShopCard({ shop }: { shop: TenantSummary }) {
  return (
    <Link to={`/shop/${shop.urlPath}`}>
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        {/* Image */}
        <div className="aspect-[16/10] bg-surface-secondary">
          {shop.imageUrls[0] && (
            <img
              src={shop.imageUrls[0]}
              alt={shop.name}
              className="h-full w-full object-cover"
            />
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <Badge variant="primary" className="mb-2">
            {shop.category}
          </Badge>
          <h3 className="mb-1 text-base font-semibold">{shop.name}</h3>
          {shop.description && (
            <p className="line-clamp-2 text-sm text-text-secondary">
              {shop.description}
            </p>
          )}
        </div>
      </Card>
    </Link>
  );
}
