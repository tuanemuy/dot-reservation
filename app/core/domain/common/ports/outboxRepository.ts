import type { DomainEvent } from "@/core/domain/common/event";

export type OutboxEntry = {
  readonly id: string;
  readonly event: DomainEvent;
  readonly occurredAt: Date;
  readonly processedAt: Date | null;
};

export interface OutboxRepository {
  saveEvents(events: readonly DomainEvent[]): Promise<void>;
  findPendingEvents(limit: number): Promise<OutboxEntry[]>;
  markAsProcessed(id: string): Promise<void>;
}
