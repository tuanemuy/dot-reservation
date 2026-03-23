import { v7 as uuidv7 } from "uuid";
import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { listNotifications } from "../listNotifications";

describe("listNotifications", () => {
  const getContainer = setupTestContainer();

  /**
   * Helper: insert a notification directly into the DB.
   */
  async function insertNotification(
    db: ReturnType<typeof getContainer>["db"],
    params: {
      recipientType: string;
      recipientId: string;
      type?: string;
      isRead?: boolean;
      createdAt?: Date;
      title?: string;
    },
  ) {
    const id = uuidv7();
    await db.insert(schema.notifications).values({
      id,
      recipientType: params.recipientType,
      recipientId: params.recipientId,
      type: params.type ?? "reservation_reminder",
      title: params.title ?? "Test Notification",
      message: "Test message",
      isRead: params.isRead ? 1 : 0,
      createdAt: params.createdAt ?? new Date(),
    });
    return id;
  }

  // ---- Normal cases ----

  it("should return notification list and totalCount", async () => {
    const container = getContainer();
    const recipientId = uuidv7();

    await insertNotification(container.db, {
      recipientType: "customer",
      recipientId,
    });
    await insertNotification(container.db, {
      recipientType: "customer",
      recipientId,
    });
    await insertNotification(container.db, {
      recipientType: "customer",
      recipientId,
    });

    const result = await listNotifications({
      container,
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId,
        typeFilter: null,
        typeFilters: null,
        page: 1,
        limit: 10,
      },
    });

    expect(result.items.length).toBe(3);
    expect(result.totalCount).toBe(3);
  });

  it("should filter by typeFilter", async () => {
    const container = getContainer();
    const recipientId = uuidv7();

    await insertNotification(container.db, {
      recipientType: "customer",
      recipientId,
      type: "reservation_confirmed",
    });
    await insertNotification(container.db, {
      recipientType: "customer",
      recipientId,
      type: "reservation_cancelled",
    });
    await insertNotification(container.db, {
      recipientType: "customer",
      recipientId,
      type: "reservation_confirmed",
    });

    const result = await listNotifications({
      container,
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId,
        typeFilter: "reservation_confirmed",
        typeFilters: null,
        page: 1,
        limit: 10,
      },
    });

    expect(result.items.length).toBe(2);
    expect(result.totalCount).toBe(2);
    for (const item of result.items) {
      expect(item.type).toBe("reservation_confirmed");
    }
  });

  it("should return all types when typeFilter is null", async () => {
    const container = getContainer();
    const recipientId = uuidv7();

    await insertNotification(container.db, {
      recipientType: "customer",
      recipientId,
      type: "reservation_confirmed",
    });
    await insertNotification(container.db, {
      recipientType: "customer",
      recipientId,
      type: "reservation_cancelled",
    });

    const result = await listNotifications({
      container,
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId,
        typeFilter: null,
        typeFilters: null,
        page: 1,
        limit: 10,
      },
    });

    expect(result.items.length).toBe(2);
    expect(result.totalCount).toBe(2);
  });

  it("should return first 10 items with totalCount=20 on page 1", async () => {
    const container = getContainer();
    const recipientId = uuidv7();

    for (let i = 0; i < 20; i++) {
      await insertNotification(container.db, {
        recipientType: "customer",
        recipientId,
      });
    }

    const result = await listNotifications({
      container,
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId,
        typeFilter: null,
        typeFilters: null,
        page: 1,
        limit: 10,
      },
    });

    expect(result.items.length).toBe(10);
    expect(result.totalCount).toBe(20);
  });

  it("should return next 10 items with totalCount=20 on page 2", async () => {
    const container = getContainer();
    const recipientId = uuidv7();

    for (let i = 0; i < 20; i++) {
      await insertNotification(container.db, {
        recipientType: "customer",
        recipientId,
      });
    }

    const result = await listNotifications({
      container,
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId,
        typeFilter: null,
        typeFilters: null,
        page: 2,
        limit: 10,
      },
    });

    expect(result.items.length).toBe(10);
    expect(result.totalCount).toBe(20);
  });

  it("should return both read and unread notifications", async () => {
    const container = getContainer();
    const recipientId = uuidv7();

    await insertNotification(container.db, {
      recipientType: "customer",
      recipientId,
      isRead: false,
    });
    await insertNotification(container.db, {
      recipientType: "customer",
      recipientId,
      isRead: true,
    });

    const result = await listNotifications({
      container,
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId,
        typeFilter: null,
        typeFilters: null,
        page: 1,
        limit: 10,
      },
    });

    expect(result.items.length).toBe(2);
    const readStates = result.items.map((item) => item.isRead);
    expect(readStates).toContain(true);
    expect(readStates).toContain(false);
  });

  // ---- Error cases ----

  it("should return empty array and totalCount=0 when no notifications exist", async () => {
    const container = getContainer();
    const recipientId = uuidv7();

    const result = await listNotifications({
      container,
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId,
        typeFilter: null,
        typeFilters: null,
        page: 1,
        limit: 10,
      },
    });

    expect(result.items).toEqual([]);
    expect(result.totalCount).toBe(0);
  });

  // ---- Edge cases ----

  it("should return remaining 5 items on page 2 when there are 15 notifications", async () => {
    const container = getContainer();
    const recipientId = uuidv7();

    for (let i = 0; i < 15; i++) {
      await insertNotification(container.db, {
        recipientType: "customer",
        recipientId,
      });
    }

    const result = await listNotifications({
      container,
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId,
        typeFilter: null,
        typeFilters: null,
        page: 2,
        limit: 10,
      },
    });

    expect(result.items.length).toBe(5);
    expect(result.totalCount).toBe(15);
  });

  it("should return empty array on page 2 when there are exactly 10 notifications", async () => {
    const container = getContainer();
    const recipientId = uuidv7();

    for (let i = 0; i < 10; i++) {
      await insertNotification(container.db, {
        recipientType: "customer",
        recipientId,
      });
    }

    const result = await listNotifications({
      container,
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId,
        typeFilter: null,
        typeFilters: null,
        page: 2,
        limit: 10,
      },
    });

    expect(result.items).toEqual([]);
    expect(result.totalCount).toBe(10);
  });

  it("should return empty array when typeFilter matches no notifications", async () => {
    const container = getContainer();
    const recipientId = uuidv7();

    await insertNotification(container.db, {
      recipientType: "customer",
      recipientId,
      type: "reservation_confirmed",
    });

    const result = await listNotifications({
      container,
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId,
        typeFilter: "reservation_cancelled",
        typeFilters: null,
        page: 1,
        limit: 10,
      },
    });

    expect(result.items).toEqual([]);
    expect(result.totalCount).toBe(0);
  });

  it("should return notifications in descending order by createdAt", async () => {
    const container = getContainer();
    const recipientId = uuidv7();

    const now = new Date();
    await insertNotification(container.db, {
      recipientType: "customer",
      recipientId,
      title: "Oldest",
      createdAt: new Date(now.getTime() - 3000),
    });
    await insertNotification(container.db, {
      recipientType: "customer",
      recipientId,
      title: "Middle",
      createdAt: new Date(now.getTime() - 2000),
    });
    await insertNotification(container.db, {
      recipientType: "customer",
      recipientId,
      title: "Newest",
      createdAt: new Date(now.getTime() - 1000),
    });

    const result = await listNotifications({
      container,
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId,
        typeFilter: null,
        typeFilters: null,
        page: 1,
        limit: 10,
      },
    });

    expect(result.items.length).toBe(3);
    // Newest first
    expect(result.items[0]!.title).toBe("Newest");
    expect(result.items[1]!.title).toBe("Middle");
    expect(result.items[2]!.title).toBe("Oldest");
  });
});
