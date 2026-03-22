import type { DomainEventBase } from "@/core/domain/common/event";
import type { TenantId } from "./valueObject";

export type TenantCreatedEvent = DomainEventBase<
  "tenant.created",
  { tenantId: TenantId }
>;

export type TenantSuspendedEvent = DomainEventBase<
  "tenant.suspended",
  { tenantId: TenantId }
>;

export type TenantReactivatedEvent = DomainEventBase<
  "tenant.reactivated",
  { tenantId: TenantId }
>;

export type TenantDeletedEvent = DomainEventBase<
  "tenant.deleted",
  { tenantId: TenantId }
>;

export type TenantEvent =
  | TenantCreatedEvent
  | TenantSuspendedEvent
  | TenantReactivatedEvent
  | TenantDeletedEvent;

export const TenantEvents = {
  created: (tenantId: TenantId): TenantCreatedEvent => ({
    type: "tenant.created",
    payload: { tenantId },
    occurredAt: new Date(),
  }),

  suspended: (tenantId: TenantId): TenantSuspendedEvent => ({
    type: "tenant.suspended",
    payload: { tenantId },
    occurredAt: new Date(),
  }),

  reactivated: (tenantId: TenantId): TenantReactivatedEvent => ({
    type: "tenant.reactivated",
    payload: { tenantId },
    occurredAt: new Date(),
  }),

  deleted: (tenantId: TenantId): TenantDeletedEvent => ({
    type: "tenant.deleted",
    payload: { tenantId },
    occurredAt: new Date(),
  }),
};
