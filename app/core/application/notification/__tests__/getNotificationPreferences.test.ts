import { v7 as uuidv7 } from "uuid";
import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { getNotificationPreferences } from "../getNotificationPreferences";

describe("getNotificationPreferences", () => {
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

  it("should return customized preferences when recipient has customized settings", async () => {
    const container = getContainer();
    const recipientId = uuidv7();

    await insertPreference(container.db, {
      recipientType: "customer",
      recipientId,
      channel: "email",
      type: "reservation_confirmed",
      enabled: false,
    });

    const result = await getNotificationPreferences({
      container: {
        notificationPreferenceRepository:
          container.notificationPreferenceRepository,
      },
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId,
      },
    });

    const emailConfirmed = result.preferences.find(
      (p) => p.channel === "email" && p.type === "reservation_confirmed",
    );
    expect(emailConfirmed).toBeDefined();
    expect(emailConfirmed!.enabled).toBe(false);
  });

  it("should return all defaults when recipient has no customized settings", async () => {
    const container = getContainer();
    const recipientId = uuidv7();

    const result = await getNotificationPreferences({
      container: {
        notificationPreferenceRepository:
          container.notificationPreferenceRepository,
      },
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId,
      },
    });

    // All items should be enabled by default
    for (const pref of result.preferences) {
      expect(pref.enabled).toBe(true);
    }

    // Should have entries for both channels
    const inAppPrefs = result.preferences.filter((p) => p.channel === "in_app");
    const emailPrefs = result.preferences.filter((p) => p.channel === "email");
    expect(inAppPrefs.length).toBeGreaterThan(0);
    expect(emailPrefs.length).toBeGreaterThan(0);
  });

  it("should merge customized and default preferences", async () => {
    const container = getContainer();
    const recipientId = uuidv7();

    // Only customize one preference
    await insertPreference(container.db, {
      recipientType: "customer",
      recipientId,
      channel: "in_app",
      type: "reservation_reminder",
      enabled: false,
    });

    const result = await getNotificationPreferences({
      container: {
        notificationPreferenceRepository:
          container.notificationPreferenceRepository,
      },
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId,
      },
    });

    // Customized one should be false
    const customized = result.preferences.find(
      (p) => p.channel === "in_app" && p.type === "reservation_reminder",
    );
    expect(customized!.enabled).toBe(false);

    // Others should be default (true)
    const others = result.preferences.filter(
      (p) => !(p.channel === "in_app" && p.type === "reservation_reminder"),
    );
    for (const pref of others) {
      expect(pref.enabled).toBe(true);
    }
  });

  it("should return customer preferences when recipientType is customer", async () => {
    const container = getContainer();
    const customerId = uuidv7();

    const result = await getNotificationPreferences({
      container: {
        notificationPreferenceRepository:
          container.notificationPreferenceRepository,
      },
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId: customerId,
      },
    });

    expect(result.preferences.length).toBeGreaterThan(0);
  });

  it("should return member preferences when recipientType is member", async () => {
    const container = getContainer();
    const memberId = uuidv7();

    const result = await getNotificationPreferences({
      container: {
        notificationPreferenceRepository:
          container.notificationPreferenceRepository,
      },
      headers: createMockHeaders(),
      input: {
        recipientType: "member",
        recipientId: memberId,
      },
    });

    expect(result.preferences.length).toBeGreaterThan(0);
  });

  // ---- Edge cases ----

  it("should include email channel settings", async () => {
    const container = getContainer();
    const recipientId = uuidv7();

    const result = await getNotificationPreferences({
      container: {
        notificationPreferenceRepository:
          container.notificationPreferenceRepository,
      },
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId,
      },
    });

    const emailPrefs = result.preferences.filter((p) => p.channel === "email");
    expect(emailPrefs.length).toBeGreaterThan(0);
  });

  it("should include in_app channel settings", async () => {
    const container = getContainer();
    const recipientId = uuidv7();

    const result = await getNotificationPreferences({
      container: {
        notificationPreferenceRepository:
          container.notificationPreferenceRepository,
      },
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId,
      },
    });

    const inAppPrefs = result.preferences.filter((p) => p.channel === "in_app");
    expect(inAppPrefs.length).toBeGreaterThan(0);
  });

  it("should return settings for all notification types", async () => {
    const container = getContainer();
    const recipientId = uuidv7();

    const result = await getNotificationPreferences({
      container: {
        notificationPreferenceRepository:
          container.notificationPreferenceRepository,
      },
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId,
      },
    });

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
      const inApp = result.preferences.find(
        (p) => p.channel === "in_app" && p.type === type,
      );
      const email = result.preferences.find(
        (p) => p.channel === "email" && p.type === type,
      );
      expect(inApp).toBeDefined();
      expect(email).toBeDefined();
    }
  });
});
