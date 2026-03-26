import { data } from "react-router";
import { searchTenants } from "@/core/application/tenant/searchTenants";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/index";

const ITEMS_PER_PAGE = 12;

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
