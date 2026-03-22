import type { Menu } from "@/core/domain/menu/entity";
import type { MenuId, MenuName } from "@/core/domain/menu/valueObject";
import type { TenantId } from "@/core/domain/tenant/valueObject";

export interface MenuRepository {
  save(menu: Menu): Promise<void>;
  findById(id: MenuId): Promise<Menu | null>;
  findByTenantId(tenantId: TenantId): Promise<Menu[]>;
  existsByTenantIdAndName(tenantId: TenantId, name: MenuName): Promise<boolean>;
  delete(id: MenuId): Promise<void>;
  updateSortOrders(items: { id: MenuId; sortOrder: number }[]): Promise<void>;
}
