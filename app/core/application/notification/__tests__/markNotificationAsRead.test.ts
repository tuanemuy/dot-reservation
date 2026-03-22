import { v7 as uuidv7 } from "uuid";
import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { NotFoundError } from "@/core/application/error";
import { getUnreadNotificationCount } from "../getUnreadNotificationCount";
import { markNotificationAsRead } from "../markNotificationAsRead";

describe("markNotificationAsRead", () => {
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

  it("should mark an unread notification as read", async () => {
    const container = getContainer();
    const recipientId = uuidv7();

    const notificationId = await insertNotification(container.db, {
      recipientType: "customer",
      recipientId,
      isRead: false,
    });

    await markNotificationAsRead({
      container,
      headers: createMockHeaders(),
      input: { notificationId },
    });

    const saved = await container.notificationRepository.findById(
      notificationId as never,
    );
    expect(saved).not.toBeNull();
    expect(saved!.isRead).toBe(true);
  });

  it("should succeed without error when notification is already read (idempotent)", async () => {
    const container = getContainer();
    const recipientId = uuidv7();

    const notificationId = await insertNotification(container.db, {
      recipientType: "customer",
      recipientId,
      isRead: true,
    });

    // Should not throw
    await expect(
      markNotificationAsRead({
        container,
        headers: createMockHeaders(),
        input: { notificationId },
      }),
    ).resolves.toBeUndefined();
  });

  // ---- Error cases ----

  it("should throw NotFoundError when notificationId does not exist", async () => {
    const container = getContainer();
    const nonExistentId = uuidv7();

    await expect(
      markNotificationAsRead({
        container,
        headers: createMockHeaders(),
        input: { notificationId: nonExistentId },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  // ---- Edge cases ----

  it("should decrease unread count by 1 after marking as read", async () => {
    const container = getContainer();
    const recipientId = uuidv7();

    await insertNotification(container.db, {
      recipientType: "customer",
      recipientId,
      isRead: false,
    });
    const notificationId = await insertNotification(container.db, {
      recipientType: "customer",
      recipientId,
      isRead: false,
    });

    // Count before
    const before = await getUnreadNotificationCount({
      container,
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId,
      },
    });
    expect(before.count).toBe(2);

    // Mark one as read
    await markNotificationAsRead({
      container,
      headers: createMockHeaders(),
      input: { notificationId },
    });

    // Count after
    const after = await getUnreadNotificationCount({
      container,
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId,
      },
    });
    expect(after.count).toBe(1);
  });

  it("should not change unread count when marking an already read notification", async () => {
    const container = getContainer();
    const recipientId = uuidv7();

    await insertNotification(container.db, {
      recipientType: "customer",
      recipientId,
      isRead: false,
    });
    const alreadyReadId = await insertNotification(container.db, {
      recipientType: "customer",
      recipientId,
      isRead: true,
    });

    // Count before
    const before = await getUnreadNotificationCount({
      container,
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId,
      },
    });
    expect(before.count).toBe(1);

    // Mark already read notification as read again
    await markNotificationAsRead({
      container,
      headers: createMockHeaders(),
      input: { notificationId: alreadyReadId },
    });

    // Count should not change
    const after = await getUnreadNotificationCount({
      container,
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId,
      },
    });
    expect(after.count).toBe(1);
  });
});
