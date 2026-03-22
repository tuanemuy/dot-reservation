import type { InferSelectModel } from "drizzle-orm";
import { and, eq, sql } from "drizzle-orm";
import { menus } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { Menu as MenuType } from "@/core/domain/menu/entity";
import type { MenuRepository } from "@/core/domain/menu/ports/menuRepository";
import type {
  MenuCategory as MenuCategoryType,
  MenuDescription as MenuDescriptionType,
  MenuDuration as MenuDurationType,
  MenuId as MenuIdType,
  MenuName as MenuNameType,
  MenuPrice as MenuPriceType,
} from "@/core/domain/menu/valueObject";
import type { TenantId as TenantIdType } from "@/core/domain/tenant/valueObject";
import type { Executor } from "../client";

type MenuDataModel = InferSelectModel<typeof menus>;

export class DrizzleSqliteMenuRepository implements MenuRepository {
  constructor(private readonly executor: Executor) {}

  private into(data: MenuDataModel): MenuType {
    return {
      id: data.id as MenuIdType,
      tenantId: data.tenantId as TenantIdType,
      name: data.name as MenuNameType,
      category: data.category as MenuCategoryType | null,
      description: data.description as MenuDescriptionType | null,
      duration: data.duration as MenuDurationType,
      price: data.price as MenuPriceType,
      sortOrder: data.sortOrder,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  async save(menu: MenuType): Promise<void> {
    try {
      await this.executor
        .insert(menus)
        .values({
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
        })
        .onConflictDoUpdate({
          target: menus.id,
          set: {
            tenantId: menu.tenantId,
            name: menu.name,
            category: menu.category,
            description: menu.description,
            duration: menu.duration,
            price: menu.price,
            sortOrder: menu.sortOrder,
            updatedAt: menu.updatedAt,
          },
        });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save menu",
        error,
      );
    }
  }

  async findById(id: MenuIdType): Promise<MenuType | null> {
    try {
      const rows = await this.executor
        .select()
        .from(menus)
        .where(eq(menus.id, id))
        .limit(1);

      return rows.length > 0 ? this.into(rows[0]) : null;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find menu by id",
        error,
      );
    }
  }

  async findByTenantId(tenantId: TenantIdType): Promise<MenuType[]> {
    try {
      const rows = await this.executor
        .select()
        .from(menus)
        .where(eq(menus.tenantId, tenantId))
        .orderBy(menus.sortOrder);

      return rows.map((row) => this.into(row));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find menus by tenant id",
        error,
      );
    }
  }

  async existsByTenantIdAndName(
    tenantId: TenantIdType,
    name: MenuNameType,
  ): Promise<boolean> {
    try {
      const result = await this.executor
        .select({ count: sql<number>`count(*)` })
        .from(menus)
        .where(and(eq(menus.tenantId, tenantId), eq(menus.name, name)));

      return Number(result[0].count) > 0;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to check menu existence by tenant id and name",
        error,
      );
    }
  }

  async delete(id: MenuIdType): Promise<void> {
    try {
      await this.executor.delete(menus).where(eq(menus.id, id));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete menu",
        error,
      );
    }
  }

  async updateSortOrders(
    items: { id: MenuIdType; sortOrder: number }[],
  ): Promise<void> {
    try {
      for (const item of items) {
        await this.executor
          .update(menus)
          .set({ sortOrder: item.sortOrder })
          .where(eq(menus.id, item.id));
      }
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to update menu sort orders",
        error,
      );
    }
  }
}
