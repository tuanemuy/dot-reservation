import type { Pagination } from "@/core/domain/common/pagination";
import type { TenantFilter } from "@/core/domain/tenant/ports/tenantRepository";
import { TenantCategory, TenantStatus } from "@/core/domain/tenant/valueObject";
import type { ServiceArgs } from "../types";

export type ListTenantsInput = {
  keyword: string | null;
  status: string | null;
  category: string | null;
  page: number;
  limit: number;
};

export type TenantAdminSummary = {
  id: string;
  name: string;
  category: string;
  urlPath: string;
  status: string;
  createdAt: string;
};

export type ListTenantsOutput = {
  items: TenantAdminSummary[];
  totalCount: number;
};

export async function listTenants({
  container,
  input,
}: ServiceArgs<ListTenantsInput>): Promise<ListTenantsOutput> {
  const filter: TenantFilter = {
    ...(input.status ? { status: TenantStatus.create(input.status) } : {}),
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

  let items = result.items.map((tenant) => ({
    id: tenant.id as string,
    name: tenant.name as string,
    category: tenant.category as string,
    urlPath: tenant.urlPath as string,
    status: tenant.status,
    createdAt: tenant.createdAt.toISOString(),
  }));

  // Client-side keyword filtering
  // In a production system, this would be handled at the repository level
  if (input.keyword) {
    const keyword = input.keyword.toLowerCase();
    items = items.filter((item) => item.name.toLowerCase().includes(keyword));
  }

  return {
    items,
    totalCount: result.total,
  };
}
