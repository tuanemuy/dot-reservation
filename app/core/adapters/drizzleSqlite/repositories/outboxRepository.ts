import { eq, isNull } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import { outboxEvents } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { DomainEvent } from "@/core/domain/common/event";
import type {
  OutboxEntry,
  OutboxRepository,
} from "@/core/domain/common/ports/outboxRepository";
import type { Executor } from "../client";

export class DrizzleSqliteOutboxRepository implements OutboxRepository {
  constructor(private readonly executor: Executor) {}

  async saveEvents(events: readonly DomainEvent[]): Promise<void> {
    if (events.length === 0) {
      return;
    }

    try {
      const values = events.map((event) => ({
        id: uuidv7(),
        eventType: event.type,
        payload: JSON.stringify(event.payload),
        occurredAt: event.occurredAt,
      }));

      await this.executor.insert(outboxEvents).values(values);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save outbox events",
        error,
      );
    }
  }

  async findPendingEvents(limit: number): Promise<OutboxEntry[]> {
    try {
      const rows = await this.executor
        .select()
        .from(outboxEvents)
        .where(isNull(outboxEvents.processedAt))
        .limit(limit);

      return rows.map((row) => ({
        id: row.id,
        event: {
          type: row.eventType,
          payload: JSON.parse(row.payload),
          occurredAt: row.occurredAt,
        },
        occurredAt: row.occurredAt,
        processedAt: row.processedAt,
      }));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find pending outbox events",
        error,
      );
    }
  }

  async markAsProcessed(id: string): Promise<void> {
    try {
      await this.executor
        .update(outboxEvents)
        .set({ processedAt: new Date() })
        .where(eq(outboxEvents.id, id));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to mark outbox event as processed",
        error,
      );
    }
  }
}
