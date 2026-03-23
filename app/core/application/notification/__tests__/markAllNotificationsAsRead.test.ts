import { v7 as uuidv7 } from "uuid";
import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { getUnreadNotificationCount } from "../getUnreadNotificationCount";
import { listNotifications } from "../listNotifications";
import { markAllNotificationsAsRead } from "../markAllNotificationsAsRead";

describe("markAllNotificationsAsRead", () => {
  const getContainer = setupTestContainer();

  /**
   * Helper: insert a notification directly into the DB.
   */
  async function insertNotification(
    db: ReturnType<typeof getContainer>["db"],
    params: {
      recipientType: string;
      recipientId: string;
      isRead?: boolean;
    },
  ) {
    const id = uuidv7();
    await db.insert(schema.notifications).values({
      id,
      recipientType: params.recipientType,
      recipientId: params.recipientId,
      type: "reservation_reminder",
      title: "Test",
      message: "Test message",
      isRead: params.isRead ? 1 : 0,
      createdAt: new Date(),
    });
    return id;
  }

  // ---- Normal cases ----

  it("should mark all unread notifications as read for recipient", async () => {
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
      isRead: false,
    });
    await insertNotification(container.db, {
      recipientType: "customer",
      recipientId,
      isRead: false,
    });

    await markAllNotificationsAsRead({
      container,
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId,
      },
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
        limit: 100,
      },
    });

    for (const item of result.items) {
      expect(item.isRead).toBe(true);
    }
  });

  it("should mark single unread notification as read", async () => {
    const container = getContainer();
    const recipientId = uuidv7();

    await insertNotification(container.db, {
      recipientType: "customer",
      recipientId,
      isRead: false,
    });

    await markAllNotificationsAsRead({
      container,
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId,
      },
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
        limit: 100,
      },
    });

    expect(result.items.length).toBe(1);
    expect(result.items[0]!.isRead).toBe(true);
  });

  it("should only update unread notifications, leaving already read ones unchanged", async () => {
    const container = getContainer();
    const recipientId = uuidv7();

    const readId = await insertNotification(container.db, {
      recipientType: "customer",
      recipientId,
      isRead: true,
    });
    await insertNotification(container.db, {
      recipientType: "customer",
      recipientId,
      isRead: false,
    });
    await insertNotification(container.db, {
      recipientType: "customer",
      recipientId,
      isRead: false,
    });

    await markAllNotificationsAsRead({
      container,
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId,
      },
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
        limit: 100,
      },
    });

    // All should be read
    for (const item of result.items) {
      expect(item.isRead).toBe(true);
    }
    expect(result.items.length).toBe(3);
  });

  // ---- Edge cases ----

  it("should not error when there are 0 unread notifications", async () => {
    const container = getContainer();
    const recipientId = uuidv7();

    await insertNotification(container.db, {
      recipientType: "customer",
      recipientId,
      isRead: true,
    });

    await expect(
      markAllNotificationsAsRead({
        container,
        headers: createMockHeaders(),
        input: {
          recipientType: "customer",
          recipientId,
        },
      }),
    ).resolves.toBeUndefined();
  });

  it("should not error when there are no notifications at all", async () => {
    const container = getContainer();
    const recipientId = uuidv7();

    await expect(
      markAllNotificationsAsRead({
        container,
        headers: createMockHeaders(),
        input: {
          recipientType: "customer",
          recipientId,
        },
      }),
    ).resolves.toBeUndefined();
  });

  it("should result in unread count of 0 after marking all as read", async () => {
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
      isRead: false,
    });

    // Verify count before
    const before = await getUnreadNotificationCount({
      container,
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId,
      },
    });
    expect(before.count).toBe(2);

    // Mark all as read
    await markAllNotificationsAsRead({
      container,
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId,
      },
    });

    // Verify count after
    const after = await getUnreadNotificationCount({
      container,
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId,
      },
    });
    expect(after.count).toBe(0);
  });
});
