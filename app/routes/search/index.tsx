import { useSearchParams } from "react-router";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { EmptyResults } from "@/components/search/EmptyResults";
import { SearchPagination } from "@/components/search/SearchPagination";
import { ShopCard } from "@/components/search/ShopCard";
import { SidebarFilters } from "@/components/search/SidebarFilters";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";
import type { Route } from "./+types/index";

export { loader } from "./loader";

export default function SearchPage({ loaderData }: Route.ComponentProps) {
  const { items, totalCount, currentPage, totalPages, categoryFilters } =
    loaderData;
  const [searchParams, setSearchParams] = useSearchParams();

  const category = searchParams.get("category") || "";
  const area = searchParams.get("area") || "";

  function handleCategoryToggle(cat: string) {
    const newParams = new URLSearchParams(searchParams);
    if (category === cat) {
      newParams.delete("category");
    } else {
      newParams.set("category", cat);
    }
    newParams.set("page", "1");
    setSearchParams(newParams);
  }

  function handleAreaChange(prefecture: string) {
    const newParams = new URLSearchParams(searchParams);
    if (prefecture === "") {
      newParams.delete("area");
    } else {
      newParams.set("area", prefecture);
    }
    newParams.set("page", "1");
    setSearchParams(newParams);
  }

  function buildPageUrl(page: number): string {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(page));
    return `/search?${params.toString()}`;
  }

  // Build title
  const titleParts: string[] = [];
  if (searchParams.get("area"))
    titleParts.push(searchParams.get("area") as string);
  if (category) titleParts.push(category);
  const pageTitle =
    titleParts.length > 0 ? `${titleParts.join("の")}` : "検索結果";

  return (
    <PublicLayout>
      <Container>
        <Breadcrumb
          items={[{ label: "トップ", to: "/" }, { label: "検索結果" }]}
        />

        {/* Results Header */}
        <div className="flex items-baseline justify-between pb-8 pt-6">
          <h1 className="font-heading text-2xl font-semibold leading-tight tracking-tight text-neutral-900">
            {pageTitle}
          </h1>
          <p className="text-base font-normal text-neutral-500">
            <strong className="font-semibold text-primary">{totalCount}</strong>
            件
          </p>
        </div>

        {/* Search Layout */}
        <div className="grid items-start gap-10 pb-20 max-md:grid-cols-1 md:grid-cols-[240px_1fr]">
          {/* Sidebar Filters */}
          <SidebarFilters
            area={area}
            category={category}
            categoryFilters={categoryFilters}
            onAreaChange={handleAreaChange}
            onCategoryToggle={handleCategoryToggle}
          />

          {/* Shop Results */}
          <div>
            {items.length === 0 ? (
              <EmptyResults />
            ) : (
              <>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((shop, index) => (
                    <ShopCard
                      key={shop.id}
                      shop={shop}
                      imageVariant={index % 5}
                    />
                  ))}
                </div>

                {/* Pagination */}
                <SearchPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  buildPageUrl={buildPageUrl}
                />
              </>
            )}
          </div>
        </div>
      </Container>
    </PublicLayout>
  );
}
