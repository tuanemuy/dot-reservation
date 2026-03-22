import type { DomainEventBase } from "@/core/domain/common/event";
import type { TenantId } from "@/core/domain/tenant/valueObject";
import type { MenuId } from "./valueObject";

export type MenuCreatedEvent = DomainEventBase<
  "menu.created",
  { menuId: MenuId; tenantId: TenantId }
>;

export type MenuDeletedEvent = DomainEventBase<
  "menu.deleted",
  { menuId: MenuId; tenantId: TenantId }
>;

export type MenuEvent = MenuCreatedEvent | MenuDeletedEvent;

export const MenuEvents = {
  created: (menuId: MenuId, tenantId: TenantId): MenuCreatedEvent => ({
    type: "menu.created",
    payload: { menuId, tenantId },
    occurredAt: new Date(),
  }),

  deleted: (menuId: MenuId, tenantId: TenantId): MenuDeletedEvent => ({
    type: "menu.deleted",
    payload: { menuId, tenantId },
    occurredAt: new Date(),
  }),
};
