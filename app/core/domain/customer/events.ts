import type { DomainEventBase } from "@/core/domain/common/event";
import type { Email } from "@/core/domain/common/valueObject";
import type { CustomerId } from "./valueObject";

export type CustomerCreatedEvent = DomainEventBase<
  "customer.created",
  { customerId: CustomerId }
>;

export type CustomerSuspendedEvent = DomainEventBase<
  "customer.suspended",
  { customerId: CustomerId }
>;

export type CustomerReactivatedEvent = DomainEventBase<
  "customer.reactivated",
  { customerId: CustomerId }
>;

export type CustomerDeletedEvent = DomainEventBase<
  "customer.deleted",
  { customerId: CustomerId; email: Email }
>;

export type CustomerEvent =
  | CustomerCreatedEvent
  | CustomerSuspendedEvent
  | CustomerReactivatedEvent
  | CustomerDeletedEvent;

export const CustomerEvents = {
  created: (customerId: CustomerId): CustomerCreatedEvent => ({
    type: "customer.created",
    payload: { customerId },
    occurredAt: new Date(),
  }),

  suspended: (customerId: CustomerId): CustomerSuspendedEvent => ({
    type: "customer.suspended",
    payload: { customerId },
    occurredAt: new Date(),
  }),

  reactivated: (customerId: CustomerId): CustomerReactivatedEvent => ({
    type: "customer.reactivated",
    payload: { customerId },
    occurredAt: new Date(),
  }),

  deleted: (customerId: CustomerId, email: Email): CustomerDeletedEvent => ({
    type: "customer.deleted",
    payload: { customerId, email },
    occurredAt: new Date(),
  }),
};
