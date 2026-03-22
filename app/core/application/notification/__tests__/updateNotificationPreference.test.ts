import { v7 as uuidv7 } from "uuid";
import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { ConflictError } from "@/core/application/error";
import { getNotificationPreferences } from "../getNotificationPreferences";
import { updateNotificationPreference } from "../updateNotificationPreference";

describe("updateNotificationPreference", () => {
  const getContainer = setupTestContainer();

  /**
   * Helper: insert a notification preference directly into the DB.
   */
  async function insertPreference(
    db: ReturnType<typeof getContainer>["db"],
    params: {
      recipientType: string;
      recipientId: string;
      channel: string;
      type: string;
      enabled: boolean;
    },
  ) {
    const id = uuidv7();
    await db.insert(schema.notificationPreferences).values({
      id,
      recipientType: params.recipientType,
      recipientId: params.recipientId,
      channel: params.channel,
      type: params.type,
      enabled: params.enabled ? 1 : 0,
      updatedAt: new Date(),
    });
    return id;
  }

  // ---- Normal cases ----

  it("should disable email notification when currently enabled", async () => {
    const container = getContainer();
    const recipientId = uuidv7();

    await insertPreference(container.db, {
      recipientType: "customer",
      recipientId,
      channel: "email",
      type: "reservation_reminder",
      enabled: true,
    });

    await updateNotificationPreference({
      container,
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId,
        channel: "email",
        type: "reservation_reminder",
        enabled: false,
      },
    });

    const result = await getNotificationPreferences({
      container,
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId,
      },
    });

    const pref = result.preferences.find(
      (p) => p.channel === "email" && p.type === "reservation_reminder",
    );
    expect(pref!.enabled).toBe(false);
  });

  it("should enable email notification when currently disabled", async () => {
    const container = getContainer();
    const recipientId = uuidv7();

    await insertPreference(container.db, {
      recipientType: "customer",
      recipientId,
      channel: "email",
      type: "reservation_reminder",
      enabled: false,
    });

    await updateNotificationPreference({
      container,
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId,
        channel: "email",
        type: "reservation_reminder",
        enabled: true,
      },
    });

    const result = await getNotificationPreferences({
      container,
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId,
      },
    });

    const pref = result.preferences.find(
      (p) => p.channel === "email" && p.type === "reservation_reminder",
    );
    expect(pref!.enabled).toBe(true);
  });

  it("should disable in-app notification for non-important type", async () => {
    const container = getContainer();
    const recipientId = uuidv7();

    await insertPreference(container.db, {
      recipientType: "customer",
      recipientId,
      channel: "in_app",
      type: "reservation_reminder",
      enabled: true,
    });

    await updateNotificationPreference({
      container,
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId,
        channel: "in_app",
        type: "reservation_reminder",
        enabled: false,
      },
    });

    const result = await getNotificationPreferences({
      container,
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId,
      },
    });

    const pref = result.preferences.find(
      (p) => p.channel === "in_app" && p.type === "reservation_reminder",
    );
    expect(pref!.enabled).toBe(false);
  });

  it("should enable in-app notification when currently disabled", async () => {
    const container = getContainer();
    const recipientId = uuidv7();

    await insertPreference(container.db, {
      recipientType: "customer",
      recipientId,
      channel: "in_app",
      type: "reservation_reminder",
      enabled: false,
    });

    await updateNotificationPreference({
      container,
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId,
        channel: "in_app",
        type: "reservation_reminder",
        enabled: true,
      },
    });

    const result = await getNotificationPreferences({
      container,
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId,
      },
    });

    const pref = result.preferences.find(
      (p) => p.channel === "in_app" && p.type === "reservation_reminder",
    );
    expect(pref!.enabled).toBe(true);
  });

  it("should disable all email notification types", async () => {
    const container = getContainer();
    const recipientId = uuidv7();

    const allTypes = [
      "reservation_confirmed",
      "reservation_updated",
      "reservation_cancelled",
      "reservation_reminder",
      "reservation_pending",
      "reservation_approved",
      "reservation_rejected",
      "new_reservation",
      "reservation_updated_by_customer",
      "reservation_cancelled_by_customer",
      "invitation_received",
      "member_joined",
      "member_left",
      "shift_request_submitted",
    ];

    for (const type of allTypes) {
      await updateNotificationPreference({
        container,
        headers: createMockHeaders(),
        input: {
          recipientType: "customer",
          recipientId,
          channel: "email",
          type,
          enabled: false,
        },
      });
    }

    const result = await getNotificationPreferences({
      container,
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId,
      },
    });

    const emailPrefs = result.preferences.filter((p) => p.channel === "email");
    for (const pref of emailPrefs) {
      expect(pref.enabled).toBe(false);
    }
  });

  // ---- Error cases ----

  it("should throw ConflictError when trying to disable in-app for important notification type", async () => {
    const container = getContainer();
    const recipientId = uuidv7();

    const importantTypes = [
      "reservation_confirmed",
      "reservation_cancelled",
      "reservation_approved",
      "reservation_rejected",
    ];

    for (const type of importantTypes) {
      await expect(
        updateNotificationPreference({
          container,
          headers: createMockHeaders(),
          input: {
            recipientType: "customer",
            recipientId,
            channel: "in_app",
            type,
            enabled: false,
          },
        }),
      ).rejects.toThrow(ConflictError);
    }
  });

  it("should create preference when recipientId has no existing preference (no NotFoundError)", async () => {
    const container = getContainer();
    const recipientId = uuidv7();

    // No existing preference - should create a new one
    await expect(
      updateNotificationPreference({
        container,
        headers: createMockHeaders(),
        input: {
          recipientType: "customer",
          recipientId,
          channel: "email",
          type: "reservation_reminder",
          enabled: false,
        },
      }),
    ).resolves.toBeUndefined();

    const result = await getNotificationPreferences({
      container,
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId,
      },
    });

    const pref = result.preferences.find(
      (p) => p.channel === "email" && p.type === "reservation_reminder",
    );
    expect(pref!.enabled).toBe(false);
  });

  // ---- Edge cases ----

  it("should allow disabling email for important notification types", async () => {
    const container = getContainer();
    const recipientId = uuidv7();

    // Email can be disabled for important types (only in_app is protected)
    await expect(
      updateNotificationPreference({
        container,
        headers: createMockHeaders(),
        input: {
          recipientType: "customer",
          recipientId,
          channel: "email",
          type: "reservation_confirmed",
          enabled: false,
        },
      }),
    ).resolves.toBeUndefined();

    const result = await getNotificationPreferences({
      container,
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId,
      },
    });

    const pref = result.preferences.find(
      (p) => p.channel === "email" && p.type === "reservation_confirmed",
    );
    expect(pref!.enabled).toBe(false);
  });

  it("should succeed when updating to the same value (idempotent)", async () => {
    const container = getContainer();
    const recipientId = uuidv7();

    await insertPreference(container.db, {
      recipientType: "customer",
      recipientId,
      channel: "email",
      type: "reservation_reminder",
      enabled: true,
    });

    // Update to same value
    await expect(
      updateNotificationPreference({
        container,
        headers: createMockHeaders(),
        input: {
          recipientType: "customer",
          recipientId,
          channel: "email",
          type: "reservation_reminder",
          enabled: true,
        },
      }),
    ).resolves.toBeUndefined();
  });

  it("should reflect updated preference in getNotificationPreferences", async () => {
    const container = getContainer();
    const recipientId = uuidv7();

    // Get initial preferences (all defaults)
    const before = await getNotificationPreferences({
      container,
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId,
      },
    });

    const prefBefore = before.preferences.find(
      (p) => p.channel === "email" && p.type === "reservation_reminder",
    );
    expect(prefBefore!.enabled).toBe(true);

    // Update
    await updateNotificationPreference({
      container,
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId,
        channel: "email",
        type: "reservation_reminder",
        enabled: false,
      },
    });

    // Verify update is reflected
    const after = await getNotificationPreferences({
      container,
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId,
      },
    });

    const prefAfter = after.preferences.find(
      (p) => p.channel === "email" && p.type === "reservation_reminder",
    );
    expect(prefAfter!.enabled).toBe(false);
  });
});
