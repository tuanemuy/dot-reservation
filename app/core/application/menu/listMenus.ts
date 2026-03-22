import { TenantId } from "@/core/domain/tenant/valueObject";
import type { ServiceArgs } from "../types";

export type ListMenusInput = {
  tenantId: string;
};

export type MenuDetail = {
  id: string;
  tenantId: string;
  name: string;
  category: string | null;
  description: string | null;
  duration: number;
  price: number;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ListMenusOutput = {
  items: MenuDetail[];
};

export async function listMenus({
  container,
  input,
}: ServiceArgs<ListMenusInput>): Promise<ListMenusOutput> {
  const tenantId = TenantId.create(input.tenantId);

  const menus = await container.menuRepository.findByTenantId(tenantId);

  // Sort by sortOrder (repository may already return sorted, but ensure it)
  const sorted = [...menus].sort((a, b) => a.sortOrder - b.sortOrder);

  return {
    items: sorted.map((menu) => ({
      id: menu.id,
      tenantId: menu.tenantId,
      name: menu.name,
      category: menu.category,
      description: menu.description,
      duration: menu.duration,
      price: menu.price,
      sortOrder: menu.sortOrder,
      createdAt: menu.createdAt,
      updatedAt: menu.updatedAt,
    })),
  };
}
