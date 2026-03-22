import { v7 as uuidv7 } from "uuid";
import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { createNotification } from "../createNotification";
import { getUnreadNotificationCount } from "../getUnreadNotificationCount";

describe("getUnreadNotificationCount", () => {
  const getContainer = setupTestContainer();

  /**
   * Helper: insert a customer directly into the DB.
   */
  async function insertCustomer(
    db: ReturnType<typeof getContainer>["db"],
    overrides: Partial<typeof schema.customers.$inferInsert> = {},
  ) {
    const id = overrides.id ?? uuidv7();
    await db.insert(schema.customers).values({
      id,
      authUserId: overrides.authUserId ?? `auth-${id}`,
      displayName: overrides.displayName ?? "Test Customer",
      email: overrides.email ?? `customer-${id}@example.com`,
      status: "active",
      ...overrides,
    });
    return id;
  }

  /**
   * Helper: create a notification via the use case.
   */
  async function createTestNotification(
    container: ReturnType<typeof getContainer>,
    recipientType: string,
    recipientId: string,
    type = "reservation_reminder",
  ) {
    return createNotification({
      container,
      headers: createMockHeaders(),
      input: {
        recipientType,
        recipientId,
        type,
        title: "Test Notification",
        message: "Test message",
        referenceType: null,
        referenceId: null,
      },
    });
  }

  /**
   * Helper: insert a notification directly into the DB with specified isRead status.
   */
  async function insertNotification(
    db: ReturnType<typeof getContainer>["db"],
    params: {
      recipientType: string;
      recipientId: string;
      isRead: boolean;
      type?: string;
    },
  ) {
    const id = uuidv7();
    await db.insert(schema.notifications).values({
      id,
      recipientType: params.recipientType,
      recipientId: params.recipientId,
      type: params.type ?? "reservation_reminder",
      title: "Test",
      message: "Test message",
      isRead: params.isRead ? 1 : 0,
      createdAt: new Date(),
    });
    return id;
  }

  // ---- Normal cases ----

  it("should return count=5 when there are 5 unread notifications", async () => {
    const container = getContainer();
    const customerId = await insertCustomer(container.db);

    for (let i = 0; i < 5; i++) {
      await insertNotification(container.db, {
        recipientType: "customer",
        recipientId: customerId,
        isRead: false,
      });
    }

    const result = await getUnreadNotificationCount({
      container,
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId: customerId,
      },
    });

    expect(result.count).toBe(5);
  });

  it("should return count=1 when there is 1 unread notification", async () => {
    const container = getContainer();
    const customerId = await insertCustomer(container.db);

    await insertNotification(container.db, {
      recipientType: "customer",
      recipientId: customerId,
      isRead: false,
    });

    const result = await getUnreadNotificationCount({
      container,
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId: customerId,
      },
    });

    expect(result.count).toBe(1);
  });

  it("should return count=0 when all notifications are read", async () => {
    const container = getContainer();
    const customerId = await insertCustomer(container.db);

    await insertNotification(container.db, {
      recipientType: "customer",
      recipientId: customerId,
      isRead: true,
    });
    await insertNotification(container.db, {
      recipientType: "customer",
      recipientId: customerId,
      isRead: true,
    });

    const result = await getUnreadNotificationCount({
      container,
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId: customerId,
      },
    });

    expect(result.count).toBe(0);
  });

  it("should return count=0 when there are no notifications", async () => {
    const container = getContainer();
    const customerId = await insertCustomer(container.db);

    const result = await getUnreadNotificationCount({
      container,
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId: customerId,
      },
    });

    expect(result.count).toBe(0);
  });

  // ---- Edge cases ----

  it("should count only unread notifications when read and unread are mixed", async () => {
    const container = getContainer();
    const customerId = await insertCustomer(container.db);

    await insertNotification(container.db, {
      recipientType: "customer",
      recipientId: customerId,
      isRead: false,
    });
    await insertNotification(container.db, {
      recipientType: "customer",
      recipientId: customerId,
      isRead: true,
    });
    await insertNotification(container.db, {
      recipientType: "customer",
      recipientId: customerId,
      isRead: false,
    });

    const result = await getUnreadNotificationCount({
      container,
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId: customerId,
      },
    });

    expect(result.count).toBe(2);
  });

  it("should reflect newly created notification in unread count", async () => {
    const container = getContainer();
    const customerId = await insertCustomer(container.db);

    // Count before
    const before = await getUnreadNotificationCount({
      container,
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId: customerId,
      },
    });
    expect(before.count).toBe(0);

    // Create notification
    await createTestNotification(container, "customer", customerId);

    // Count after
    const after = await getUnreadNotificationCount({
      container,
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId: customerId,
      },
    });
    expect(after.count).toBe(1);
  });

  it("should count only customer type notifications for customer recipient", async () => {
    const container = getContainer();
    const customerId = await insertCustomer(container.db);
    const otherRecipientId = uuidv7();

    // Customer notifications
    await insertNotification(container.db, {
      recipientType: "customer",
      recipientId: customerId,
      isRead: false,
    });
    await insertNotification(container.db, {
      recipientType: "customer",
      recipientId: customerId,
      isRead: false,
    });

    // Member notifications for different recipient
    await insertNotification(container.db, {
      recipientType: "member",
      recipientId: otherRecipientId,
      isRead: false,
    });

    const result = await getUnreadNotificationCount({
      container,
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId: customerId,
      },
    });

    expect(result.count).toBe(2);
  });

  it("should count only member type notifications for member recipient", async () => {
    const container = getContainer();
    const memberId = uuidv7();
    const otherRecipientId = uuidv7();

    // Member notifications
    await insertNotification(container.db, {
      recipientType: "member",
      recipientId: memberId,
      isRead: false,
    });

    // Customer notifications for different recipient
    await insertNotification(container.db, {
      recipientType: "customer",
      recipientId: otherRecipientId,
      isRead: false,
    });

    const result = await getUnreadNotificationCount({
      container,
      headers: createMockHeaders(),
      input: {
        recipientType: "member",
        recipientId: memberId,
      },
    });

    expect(result.count).toBe(1);
  });
});
