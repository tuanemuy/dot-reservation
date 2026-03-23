import { useState } from "react";
import { data, Form, Link, useNavigate } from "react-router";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { searchTenants } from "@/core/application/tenant/searchTenants";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/index";

/** Icon components for category cards (mapped by category name) */
const CATEGORY_ICONS: Record<
  string,
  {
    iconBg: string;
    iconColor: string;
    iconStyle?: React.CSSProperties;
    icon: React.ReactNode;
  }
> = {
  整体院: {
    iconBg: "bg-primary-lighter",
    iconColor: "text-primary",
    icon: (
      <svg
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
      >
        <title>整体院</title>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
        />
      </svg>
    ),
  },
  ジム: {
    iconBg: "bg-accent-lighter",
    iconColor: "text-accent",
    icon: (
      <svg
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
      >
        <title>ジム</title>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
        />
      </svg>
    ),
  },
  美容院: {
    iconBg: "bg-secondary-lighter",
    iconColor: "text-secondary",
    icon: (
      <svg
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
      >
        <title>美容院</title>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
        />
      </svg>
    ),
  },
  リラクゼーション: {
    iconBg: "",
    iconColor: "",
    iconStyle: {
      background: "oklch(0.96 0.02 200)",
      color: "oklch(0.55 0.10 240)",
    },
    icon: (
      <svg
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
      >
        <title>リラクゼーション</title>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
    ),
  },
};

/** Default icon for categories without a specific icon mapping */
const DEFAULT_CATEGORY_ICON = {
  iconBg: "",
  iconColor: "",
  iconStyle: {
    background: "var(--color-neutral-100)",
    color: "var(--color-neutral-600)",
  },
  icon: (
    <svg
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
    >
      <title>カテゴリ</title>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
      />
    </svg>
  ),
};

export async function loader({ request }: Route.LoaderArgs) {
  const { container } = await import("@/core/di/server");

  // Fetch all active tenants (with a high limit to get all for category/area extraction)
  const result = await handleUseCase(() =>
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
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  // Extract unique categories and prefectures from search results
  const categorySet = new Set<string>();
  const prefectureSet = new Set<string>();

  for (const tenant of result.items) {
    if (tenant.category) {
      categorySet.add(tenant.category);
    }
    if (tenant.address?.prefecture) {
      prefectureSet.add(tenant.address.prefecture);
    }
  }

  const categories = [...categorySet].sort();
  const prefectures = [...prefectureSet].sort();

  return { categories, prefectures };
}

export default function TopPage({ loaderData }: Route.ComponentProps) {
  const { categories, prefectures } = loaderData;
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [area, setArea] = useState("");
  const [category, setCategory] = useState("");

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword);
    if (area) params.set("area", area);
    if (category) params.set("category", category);
    navigate(`/search?${params.toString()}`);
  }

  return (
    <PublicLayout>
      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(160deg, var(--color-primary-lighter) 0%, var(--color-neutral-100) 30%, var(--color-accent-lighter) 60%, var(--color-secondary-lighter) 100%)",
          padding: "var(--space-section) 0",
        }}
      >
        <div
          className="mx-auto flex flex-col items-center text-center"
          style={{
            maxWidth: 1280,
            padding: "0 var(--space-2xl)",
          }}
        >
          <h1
            className="text-neutral-900"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "var(--text-3xl)",
              fontWeight: "var(--weight-semibold)",
              letterSpacing: "var(--tracking-tight)",
              lineHeight: "var(--leading-tight)",
              marginBottom: "var(--space-md)",
            }}
          >
            あなたにぴったりのサロンを見つけよう
          </h1>
          <p
            className="text-neutral-600"
            style={{
              fontSize: "var(--text-lg)",
              fontWeight: "var(--weight-light)",
              marginBottom: "var(--space-3xl)",
              lineHeight: "var(--leading-normal)",
            }}
          >
            整体院、ジム、美容院など、お気に入りの場所を簡単予約
          </p>

          {/* Search */}
          <Form
            onSubmit={handleSearch}
            className="w-full"
            style={{ maxWidth: 720 }}
          >
            <div
              className="flex items-center border border-neutral-300 bg-[var(--color-bg-card)] transition-[border-color,box-shadow] duration-[0.15s] ease-[ease] focus-within:border-primary focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary"
              style={{
                borderRadius: "var(--radius-lg)",
                padding: "var(--space-xs)",
              }}
            >
              <div
                className="flex shrink-0 items-center justify-center text-neutral-500"
                style={{ padding: "0 var(--space-md)" }}
              >
                <svg
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                >
                  <title>検索</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
              </div>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="サロン名、エリア、キーワードで検索"
                className="flex-1 border-none bg-transparent text-neutral-800 outline-none placeholder:text-neutral-500"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--text-base)",
                  padding: "var(--space-sm) 0",
                }}
              />
              <button
                type="submit"
                className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-[var(--space-sm)] border-none bg-primary text-white transition-[background] duration-[0.15s] ease-[ease] hover:bg-primary-dark active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                style={{
                  height: 44,
                  padding: "0 var(--space-lg)",
                  borderRadius: "var(--radius-md)",
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--text-base)",
                  fontWeight: "var(--weight-medium)",
                }}
              >
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <title>検索</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
                検索
              </button>
            </div>

            {/* Search Options */}
            <div
              className="flex justify-center"
              style={{
                gap: "var(--space-md)",
                marginTop: "var(--space-md)",
              }}
            >
              <div className="relative">
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="cursor-pointer appearance-none border border-neutral-300 bg-[var(--color-bg-card)] text-neutral-700 transition-[border-color] duration-[0.15s] ease-[ease] hover:border-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--text-sm)",
                    fontWeight: "var(--weight-medium)",
                    borderRadius: "var(--radius-md)",
                    padding:
                      "var(--space-sm) var(--space-2xl) var(--space-sm) var(--space-md)",
                    minWidth: 160,
                  }}
                >
                  <option value="">エリアを選択</option>
                  {prefectures.map((pref) => (
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
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="cursor-pointer appearance-none border border-neutral-300 bg-[var(--color-bg-card)] text-neutral-700 transition-[border-color] duration-[0.15s] ease-[ease] hover:border-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--text-sm)",
                    fontWeight: "var(--weight-medium)",
                    borderRadius: "var(--radius-md)",
                    padding:
                      "var(--space-sm) var(--space-2xl) var(--space-sm) var(--space-md)",
                    minWidth: 160,
                  }}
                >
                  <option value="">カテゴリを選択</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
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
          </Form>
        </div>
      </section>

      {/* Popular Categories */}
      <section
        className="mx-auto"
        style={{
          maxWidth: 1280,
          padding: "var(--space-section) var(--space-2xl)",
        }}
      >
        <h2
          className="text-neutral-900"
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "var(--text-2xl)",
            fontWeight: "var(--weight-semibold)",
            letterSpacing: "var(--tracking-tight)",
            lineHeight: "var(--leading-tight)",
            marginBottom: "var(--space-lg)",
          }}
        >
          人気のカテゴリ
        </h2>
        <p
          className="text-neutral-500"
          style={{
            fontSize: "var(--text-base)",
            fontWeight: "var(--weight-normal)",
            marginBottom: "var(--space-xl)",
          }}
        >
          あなたの目的にあったカテゴリからサロンを探しましょう
        </p>

        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${Math.min(categories.length, 4)}, 1fr)`,
            gap: "var(--space-md)",
          }}
        >
          {categories.map((catName) => {
            const catIcon = CATEGORY_ICONS[catName] ?? DEFAULT_CATEGORY_ICON;
            return (
              <Link
                key={catName}
                to={`/search?category=${encodeURIComponent(catName)}`}
                className="flex cursor-pointer flex-col items-center border border-neutral-300 bg-[var(--color-bg-card)] no-underline transition-[border-color,box-shadow] duration-[0.15s] ease-[ease] hover:border-primary-light hover:shadow-[var(--shadow-sm)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                style={{
                  gap: "var(--space-md)",
                  padding: "var(--space-xl) var(--space-md)",
                  borderRadius: "var(--radius-lg)",
                }}
              >
                <div
                  className={`flex items-center justify-center ${catIcon.iconBg} ${catIcon.iconColor}`}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "var(--radius-xl)",
                    ...catIcon.iconStyle,
                  }}
                >
                  <span className="[&>svg]:h-6 [&>svg]:w-6">
                    {catIcon.icon}
                  </span>
                </div>
                <span
                  className="text-center text-neutral-800"
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "var(--text-base)",
                    fontWeight: "var(--weight-medium)",
                  }}
                >
                  {catName}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section
        className="mx-auto text-center"
        style={{
          maxWidth: 1280,
          padding: "var(--space-section) var(--space-2xl)",
        }}
      >
        <h2
          className="text-neutral-900"
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "var(--text-2xl)",
            fontWeight: "var(--weight-semibold)",
            letterSpacing: "var(--tracking-tight)",
            marginBottom: "var(--space-md)",
          }}
        >
          サロンを探してみましょう
        </h2>
        <p
          className="text-neutral-600"
          style={{
            fontSize: "var(--text-base)",
            fontWeight: "var(--weight-light)",
            marginBottom: "var(--space-xl)",
          }}
        >
          あなたのお気に入りがきっと見つかります
        </p>
        <Link
          to="/search"
          className="inline-flex cursor-pointer items-center justify-center gap-[var(--space-sm)] border-none bg-primary text-white no-underline transition-[background] duration-[0.15s] ease-[ease] hover:bg-primary-dark active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          style={{
            height: 52,
            padding: "0 var(--space-xl)",
            borderRadius: "var(--radius-md)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-base)",
            fontWeight: "var(--weight-medium)",
          }}
        >
          <svg
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
          >
            <title>検索</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          サロンを検索する
        </Link>
      </section>
    </PublicLayout>
  );
}
