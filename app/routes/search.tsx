import { data, Link, useSearchParams } from "react-router";
import { PublicLayout } from "@/components/layout/PublicLayout";
import type { TenantSummary } from "@/core/application/tenant/searchTenants";
import { searchTenants } from "@/core/application/tenant/searchTenants";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/search";

const ITEMS_PER_PAGE = 12;

/** 47 Japanese prefectures in standard order */
const PREFECTURES = [
  "北海道",
  "青森県",
  "岩手県",
  "宮城県",
  "秋田県",
  "山形県",
  "福島県",
  "茨城県",
  "栃木県",
  "群馬県",
  "埼玉県",
  "千葉県",
  "東京都",
  "神奈川県",
  "新潟県",
  "富山県",
  "石川県",
  "福井県",
  "山梨県",
  "長野県",
  "岐阜県",
  "静岡県",
  "愛知県",
  "三重県",
  "滋賀県",
  "京都府",
  "大阪府",
  "兵庫県",
  "奈良県",
  "和歌山県",
  "鳥取県",
  "島根県",
  "岡山県",
  "広島県",
  "山口県",
  "徳島県",
  "香川県",
  "愛媛県",
  "高知県",
  "福岡県",
  "佐賀県",
  "長崎県",
  "熊本県",
  "大分県",
  "宮崎県",
  "鹿児島県",
  "沖縄県",
] as const;

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const keyword = url.searchParams.get("keyword") || null;
  const area = url.searchParams.get("area") || null;
  const category = url.searchParams.get("category") || null;
  const page = Number(url.searchParams.get("page") || "1");

  const { container } = await import("@/core/di/server");

  // Fetch search results
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

  // Fetch all active tenants to extract available categories
  const allTenants = await handleUseCase(() =>
    searchTenants({
      container,
      headers: request.headers,
      input: {
        keyword: null,
        area: null,
        category: null,
        page: 1,
        limit: 1000,
      },
    }),
  ).match(
    (r) => r,
    () => ({ items: [], totalCount: 0 }),
  );

  const categorySet = new Set<string>();
  for (const tenant of allTenants.items) {
    if (tenant.category) {
      categorySet.add(tenant.category);
    }
  }
  const categoryFilters = [...categorySet].sort();

  return {
    items: result.items,
    totalCount: result.totalCount,
    currentPage: page,
    totalPages: Math.ceil(result.totalCount / ITEMS_PER_PAGE),
    categoryFilters,
  };
}

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

  // Page numbers for pagination
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <PublicLayout>
      <div
        className="mx-auto"
        style={{
          maxWidth: 1280,
          padding: "0 var(--space-2xl)",
        }}
      >
        {/* Breadcrumb */}
        <nav
          className="flex items-center text-neutral-500"
          aria-label="パンくずリスト"
          style={{
            padding: "var(--space-md) 0",
            fontSize: "var(--text-sm)",
            gap: "var(--space-sm)",
          }}
        >
          <Link
            to="/"
            className="text-neutral-500 no-underline transition-colors duration-[0.15s] ease-[ease] hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            トップ
          </Link>
          <span className="text-neutral-300">/</span>
          <span className="text-neutral-700">検索結果</span>
        </nav>

        {/* Results Header */}
        <div
          className="flex items-baseline justify-between"
          style={{
            padding: "var(--space-lg) 0 var(--space-xl)",
          }}
        >
          <h1
            className="text-neutral-900"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "var(--text-2xl)",
              fontWeight: "var(--weight-semibold)",
              letterSpacing: "var(--tracking-tight)",
              lineHeight: "var(--leading-tight)",
            }}
          >
            {pageTitle}
          </h1>
          <p
            className="text-neutral-500"
            style={{
              fontSize: "var(--text-base)",
              fontWeight: "var(--weight-normal)",
            }}
          >
            <strong
              className="text-primary"
              style={{ fontWeight: "var(--weight-semibold)" }}
            >
              {totalCount}
            </strong>
            件
          </p>
        </div>

        {/* Search Layout */}
        <div
          className="grid items-start"
          style={{
            gridTemplateColumns: "240px 1fr",
            gap: "var(--space-2xl)",
            paddingBottom: "var(--space-section)",
          }}
        >
          {/* Sidebar Filters */}
          <aside
            className="sticky"
            style={{ top: "calc(64px + var(--space-lg))" }}
          >
            {/* Area Filter */}
            <div style={{ marginBottom: "var(--space-xl)" }}>
              <h3
                className="border-b border-neutral-200 text-neutral-800 uppercase"
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--weight-semibold)",
                  letterSpacing: "var(--tracking-wide)",
                  marginBottom: "var(--space-md)",
                  paddingBottom: "var(--space-sm)",
                }}
              >
                エリア
              </h3>
              <div className="relative">
                <select
                  value={area}
                  onChange={(e) => handleAreaChange(e.target.value)}
                  className="w-full cursor-pointer appearance-none border border-neutral-300 bg-[var(--color-bg-card)] text-neutral-700 transition-[border-color] duration-[0.15s] ease-[ease] hover:border-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--text-sm)",
                    fontWeight: "var(--weight-medium)",
                    borderRadius: "var(--radius-md)",
                    padding:
                      "var(--space-sm) var(--space-2xl) var(--space-sm) var(--space-md)",
                  }}
                >
                  <option value="">すべてのエリア</option>
                  {PREFECTURES.map((pref) => (
                    <option key={pref} value={pref}>
                      {pref}
                    </option>
                  ))}
                </select>
                <span
                  className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-neutral-500"
                  style={{ right: "var(--space-sm)" }}
                >
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                  >
                    <title>開く</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                    />
                  </svg>
                </span>
              </div>
            </div>

            {/* Category Filter */}
            <div style={{ marginBottom: "var(--space-xl)" }}>
              <h3
                className="border-b border-neutral-200 text-neutral-800 uppercase"
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--weight-semibold)",
                  letterSpacing: "var(--tracking-wide)",
                  marginBottom: "var(--space-md)",
                  paddingBottom: "var(--space-sm)",
                }}
              >
                カテゴリ
              </h3>
              <ul
                className="flex list-none flex-col"
                style={{ gap: "var(--space-xs)" }}
              >
                {categoryFilters.map((cat) => {
                  const isActive = category === cat;
                  return (
                    <li key={cat}>
                      <button
                        type="button"
                        onClick={() => handleCategoryToggle(cat)}
                        className="flex w-full cursor-pointer items-center transition-[background] duration-[0.15s] ease-[ease] hover:bg-neutral-100"
                        style={{
                          gap: "var(--space-sm)",
                          padding: "var(--space-sm)",
                          borderRadius: "var(--radius-sm)",
                          border: "none",
                          background: "transparent",
                        }}
                      >
                        <div
                          className="shrink-0 transition-[border-color,background] duration-[0.15s] ease-[ease]"
                          style={{
                            width: 16,
                            height: 16,
                            border: isActive
                              ? "1.5px solid var(--color-primary)"
                              : "1.5px solid var(--color-neutral-400)",
                            borderRadius: 4,
                            background: isActive
                              ? "var(--color-primary)"
                              : "transparent",
                            position: "relative",
                          }}
                        >
                          {isActive && (
                            <span
                              className="absolute"
                              style={{
                                top: 2,
                                left: 5,
                                width: 4,
                                height: 8,
                                border: "solid #FFFFFF",
                                borderWidth: "0 1.5px 1.5px 0",
                                transform: "rotate(45deg)",
                                display: "block",
                              }}
                            />
                          )}
                        </div>
                        <span
                          className="flex-1 text-left"
                          style={{
                            fontSize: "var(--text-sm)",
                            fontWeight: isActive
                              ? "var(--weight-medium)"
                              : "var(--weight-normal)",
                            color: isActive
                              ? "var(--color-neutral-900)"
                              : "var(--color-neutral-700)",
                          }}
                        >
                          {cat}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>

          {/* Shop Results */}
          <div>
            {items.length === 0 ? (
              <div className="py-16 text-center">
                <p
                  className="text-neutral-600"
                  style={{
                    fontSize: "var(--text-lg)",
                    fontWeight: "var(--weight-medium)",
                    marginBottom: "var(--space-sm)",
                  }}
                >
                  条件に合う店舗が見つかりませんでした
                </p>
                <p
                  className="text-neutral-500"
                  style={{ fontSize: "var(--text-sm)" }}
                >
                  検索条件を変更して、もう一度お試しください
                </p>
              </div>
            ) : (
              <>
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "var(--space-lg)",
                  }}
                >
                  {items.map((shop, index) => (
                    <ShopCard
                      key={shop.id}
                      shop={shop}
                      imageVariant={index % 5}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <nav
                    className="flex items-center justify-center"
                    aria-label="ページネーション"
                    style={{
                      gap: "var(--space-xs)",
                      marginTop: "var(--space-3xl)",
                    }}
                  >
                    {currentPage > 1 && (
                      <Link
                        to={buildPageUrl(currentPage - 1)}
                        className="inline-flex items-center justify-center border border-neutral-300 bg-[var(--color-bg-card)] text-neutral-700 no-underline transition-[border-color,background,color] duration-[0.15s] ease-[ease] hover:border-primary-light hover:bg-primary-lighter hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        style={{
                          minWidth: 40,
                          height: 40,
                          padding: "0 var(--space-sm)",
                          borderRadius: "var(--radius-md)",
                          fontSize: "var(--text-sm)",
                          fontWeight: "var(--weight-medium)",
                        }}
                        aria-label="前のページ"
                      >
                        <svg
                          width="16"
                          height="16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          viewBox="0 0 24 24"
                        >
                          <title>前へ</title>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.75 19.5L8.25 12l7.5-7.5"
                          />
                        </svg>
                      </Link>
                    )}

                    {pageNumbers.map((page, idx) =>
                      page === null ? (
                        <span
                          key={`ellipsis-${idx}-${currentPage}`}
                          className="inline-flex items-center justify-center text-neutral-500"
                          style={{
                            minWidth: 40,
                            height: 40,
                            fontSize: "var(--text-sm)",
                          }}
                        >
                          ...
                        </span>
                      ) : (
                        <Link
                          key={page}
                          to={buildPageUrl(page)}
                          className={`inline-flex items-center justify-center border no-underline transition-[border-color,background,color] duration-[0.15s] ease-[ease] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                            page === currentPage
                              ? "border-primary bg-primary text-white hover:border-primary-dark hover:bg-primary-dark"
                              : "border-neutral-300 bg-[var(--color-bg-card)] text-neutral-700 hover:border-primary-light hover:bg-primary-lighter hover:text-primary"
                          }`}
                          style={{
                            minWidth: 40,
                            height: 40,
                            padding: "0 var(--space-sm)",
                            borderRadius: "var(--radius-md)",
                            fontSize: "var(--text-sm)",
                            fontWeight: "var(--weight-medium)",
                          }}
                          aria-current={
                            page === currentPage ? "page" : undefined
                          }
                        >
                          {page}
                        </Link>
                      ),
                    )}

                    {currentPage < totalPages && (
                      <Link
                        to={buildPageUrl(currentPage + 1)}
                        className="inline-flex items-center justify-center border border-neutral-300 bg-[var(--color-bg-card)] text-neutral-700 no-underline transition-[border-color,background,color] duration-[0.15s] ease-[ease] hover:border-primary-light hover:bg-primary-lighter hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        style={{
                          minWidth: 40,
                          height: 40,
                          padding: "0 var(--space-sm)",
                          borderRadius: "var(--radius-md)",
                          fontSize: "var(--text-sm)",
                          fontWeight: "var(--weight-medium)",
                        }}
                        aria-label="次のページ"
                      >
                        <svg
                          width="16"
                          height="16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          viewBox="0 0 24 24"
                        >
                          <title>次へ</title>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8.25 4.5l7.5 7.5-7.5 7.5"
                          />
                        </svg>
                      </Link>
                    )}
                  </nav>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

const imageBgs = [
  "linear-gradient(135deg, var(--color-primary-lighter) 0%, var(--color-primary-light) 100%)",
  "linear-gradient(135deg, var(--color-accent-lighter) 0%, var(--color-accent-light) 100%)",
  "linear-gradient(135deg, var(--color-secondary-lighter) 0%, var(--color-secondary-light) 100%)",
  "linear-gradient(135deg, var(--color-neutral-100) 0%, var(--color-neutral-300) 100%)",
  "linear-gradient(135deg, oklch(0.96 0.02 200) 0%, oklch(0.84 0.06 200) 100%)",
];

function ShopCard({
  shop,
  imageVariant,
}: {
  shop: TenantSummary;
  imageVariant: number;
}) {
  const hasImage = shop.imageUrls.length > 0;

  return (
    <Link
      to={`/shop/${shop.urlPath}`}
      className="block cursor-pointer overflow-hidden border border-neutral-300 bg-[var(--color-bg-card)] no-underline transition-[border-color,box-shadow] duration-[0.15s] ease-[ease] hover:border-neutral-400 hover:shadow-[var(--shadow-sm)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      style={{ borderRadius: "var(--radius-lg)" }}
    >
      {/* Image */}
      <div
        className="relative flex w-full items-center justify-center"
        style={{
          height: 160,
          background: hasImage
            ? undefined
            : imageBgs[imageVariant % imageBgs.length],
        }}
      >
        {hasImage ? (
          <img
            src={shop.imageUrls[0]}
            alt={shop.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span
            className="text-neutral-500 uppercase"
            style={{
              fontSize: "var(--text-sm)",
              fontWeight: "var(--weight-medium)",
              letterSpacing: "var(--tracking-wide)",
            }}
          >
            Photo
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "var(--space-lg)" }}>
        <span
          className="inline-block text-primary"
          style={{
            fontSize: "var(--text-xs)",
            fontWeight: "var(--weight-medium)",
            background: "var(--color-primary-lighter)",
            padding: "var(--space-xs) var(--space-sm)",
            borderRadius: "var(--radius-sm)",
            marginBottom: "var(--space-sm)",
            letterSpacing: "var(--tracking-wide)",
          }}
        >
          {shop.category}
        </span>
        <h3
          className="text-neutral-900"
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "var(--text-lg)",
            fontWeight: "var(--weight-medium)",
            letterSpacing: "var(--tracking-tight)",
            marginBottom: "var(--space-xs)",
            lineHeight: "var(--leading-tight)",
          }}
        >
          {shop.name}
        </h3>
        {shop.description && (
          <p
            className="text-neutral-500"
            style={{
              fontSize: "var(--text-sm)",
              fontWeight: "var(--weight-normal)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {shop.description}
          </p>
        )}
      </div>
    </Link>
  );
}

function getPageNumbers(current: number, total: number): (number | null)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | null)[] = [1];

  if (current > 3) {
    pages.push(null);
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push(null);
  }

  pages.push(total);

  return pages;
}
