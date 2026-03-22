import type { DomainEventBase } from "@/core/domain/common/event";
import type { CustomerId } from "@/core/domain/customer/valueObject";
import type { TenantId } from "@/core/domain/tenant/valueObject";
import type {
  CreatedBy,
  ReservationId,
  ReservationStatus,
} from "./valueObject";

export type ReservationCreatedEvent = DomainEventBase<
  "reservation.created",
  {
    reservationId: ReservationId;
    tenantId: TenantId;
    customerId: CustomerId | null;
    status: ReservationStatus;
  }
>;

export type ReservationApprovedEvent = DomainEventBase<
  "reservation.approved",
  {
    reservationId: ReservationId;
    tenantId: TenantId;
    customerId: CustomerId | null;
  }
>;

export type ReservationRejectedEvent = DomainEventBase<
  "reservation.rejected",
  {
    reservationId: ReservationId;
    tenantId: TenantId;
    customerId: CustomerId | null;
    reason: string | null;
  }
>;

export type ReservationCancelledEvent = DomainEventBase<
  "reservation.cancelled",
  {
    reservationId: ReservationId;
    tenantId: TenantId;
    customerId: CustomerId | null;
    cancelledBy: CreatedBy;
    reason: string | null;
  }
>;

export type ReservationCompletedEvent = DomainEventBase<
  "reservation.completed",
  {
    reservationId: ReservationId;
    tenantId: TenantId;
  }
>;

export type ReservationUpdatedEvent = DomainEventBase<
  "reservation.updated",
  {
    reservationId: ReservationId;
    tenantId: TenantId;
    customerId: CustomerId | null;
  }
>;

export type ReservationEvent =
  | ReservationCreatedEvent
  | ReservationApprovedEvent
  | ReservationRejectedEvent
  | ReservationCancelledEvent
  | ReservationCompletedEvent
  | ReservationUpdatedEvent;

export const ReservationEvents = {
  created: (
    reservationId: ReservationId,
    tenantId: TenantId,
    customerId: CustomerId | null,
    status: ReservationStatus,
  ): ReservationCreatedEvent => ({
    type: "reservation.created",
    payload: { reservationId, tenantId, customerId, status },
    occurredAt: new Date(),
  }),

  approved: (
    reservationId: ReservationId,
    tenantId: TenantId,
    customerId: CustomerId | null,
  ): ReservationApprovedEvent => ({
    type: "reservation.approved",
    payload: { reservationId, tenantId, customerId },
    occurredAt: new Date(),
  }),

  rejected: (
    reservationId: ReservationId,
    tenantId: TenantId,
    customerId: CustomerId | null,
    reason: string | null,
  ): ReservationRejectedEvent => ({
    type: "reservation.rejected",
    payload: { reservationId, tenantId, customerId, reason },
    occurredAt: new Date(),
  }),

  cancelled: (
    reservationId: ReservationId,
    tenantId: TenantId,
    customerId: CustomerId | null,
    cancelledBy: CreatedBy,
    reason: string | null,
  ): ReservationCancelledEvent => ({
    type: "reservation.cancelled",
    payload: { reservationId, tenantId, customerId, cancelledBy, reason },
    occurredAt: new Date(),
  }),

  completed: (
    reservationId: ReservationId,
    tenantId: TenantId,
  ): ReservationCompletedEvent => ({
    type: "reservation.completed",
    payload: { reservationId, tenantId },
    occurredAt: new Date(),
  }),

  updated: (
    reservationId: ReservationId,
    tenantId: TenantId,
    customerId: CustomerId | null,
  ): ReservationUpdatedEvent => ({
    type: "reservation.updated",
    payload: { reservationId, tenantId, customerId },
    occurredAt: new Date(),
  }),
};
