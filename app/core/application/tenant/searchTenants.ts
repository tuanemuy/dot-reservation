import type { Pagination } from "@/core/domain/common/pagination";
import type { TenantFilter } from "@/core/domain/tenant/ports/tenantRepository";
import { TenantCategory } from "@/core/domain/tenant/valueObject";
import type { ServiceArgs } from "../types";

export type SearchTenantsInput = {
  keyword: string | null;
  area: string | null;
  category: string | null;
  page: number;
  limit: number;
};

export type TenantSummary = {
  id: string;
  name: string;
  category: string;
  urlPath: string;
  imageUrls: string[];
  description: string | null;
  address: { prefecture: string; city: string; street: string } | null;
};

export type SearchTenantsOutput = {
  items: TenantSummary[];
  totalCount: number;
};

export async function searchTenants({
  container,
  input,
}: ServiceArgs<SearchTenantsInput>): Promise<SearchTenantsOutput> {
  const filter: TenantFilter = {
    status: "active",
    ...(input.keyword ? { keyword: input.keyword } : {}),
    ...(input.area ? { area: input.area } : {}),
    ...(input.category
      ? { category: TenantCategory.create(input.category) }
      : {}),
  };

  const pagination: Pagination = {
    page: input.page,
    limit: input.limit,
  };

  const result = await container.unitOfWorkProvider.transaction(
    async (repositories) => {
      return repositories.tenantRepository.findAll(filter, pagination);
    },
  );

  const items = result.items.map((tenant) => ({
    id: tenant.id as string,
    name: tenant.name as string,
    category: tenant.category as string,
    urlPath: tenant.urlPath as string,
    imageUrls: [...tenant.imageUrls],
    description: tenant.description as string | null,
    address: tenant.address
      ? {
          prefecture: tenant.address.prefecture,
          city: tenant.address.city,
          street: tenant.address.street,
        }
      : null,
  }));

  return {
    items,
    totalCount: result.total,
  };
}
