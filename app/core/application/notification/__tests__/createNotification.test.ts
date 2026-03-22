import { v7 as uuidv7 } from "uuid";
import { describe, expect, it, vi } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { createNotification } from "../createNotification";

describe("createNotification", () => {
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
   * Helper: insert a member directly into the DB.
   * Requires a tenant, so we create one too.
   */
  async function insertMember(
    db: ReturnType<typeof getContainer>["db"],
    overrides: Partial<typeof schema.members.$inferInsert> = {},
  ) {
    const tenantId = uuidv7();
    await db.insert(schema.tenants).values({
      id: tenantId,
      name: "Test Tenant",
      category: "salon",
      urlPath: `tenant-${tenantId}`,
      postalCode: "000-0000",
      addressPrefecture: "Tokyo",
      addressCity: "Shibuya",
      addressStreet: "1-1-1",
      phoneNumber: "03-0000-0000",
      businessHours: JSON.stringify({
        monday: { start: "09:00", end: "18:00" },
        tuesday: { start: "09:00", end: "18:00" },
        wednesday: { start: "09:00", end: "18:00" },
        thursday: { start: "09:00", end: "18:00" },
        friday: { start: "09:00", end: "18:00" },
        saturday: null,
        sunday: null,
      }),
      status: "active",
    });

    const memberId = overrides.id ?? uuidv7();
    const resolvedTenantId = overrides.tenantId ?? tenantId;
    await db.insert(schema.members).values({
      id: memberId,
      tenantId: resolvedTenantId,
      authUserId: overrides.authUserId ?? `auth-${memberId}`,
      name: overrides.name ?? "Test Member",
      email: overrides.email ?? `member-${memberId}@example.com`,
      role: "owner",
      joinedAt: new Date(),
    });
    return memberId;
  }

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

  it("should create in-app notification when in-app preference is ON", async () => {
    const container = getContainer();
    const customerId = await insertCustomer(container.db);

    await insertPreference(container.db, {
      recipientType: "customer",
      recipientId: customerId,
      channel: "in_app",
      type: "reservation_reminder",
      enabled: true,
    });
    await insertPreference(container.db, {
      recipientType: "customer",
      recipientId: customerId,
      channel: "email",
      type: "reservation_reminder",
      enabled: false,
    });

    const result = await createNotification({
      container: {
        unitOfWorkProvider: container.unitOfWorkProvider,
        notificationPreferenceRepository:
          container.notificationPreferenceRepository,
        emailSender: container.notificationEmailSender,
        customerRepository: container.customerRepository,
        memberRepository: container.memberRepository,
      },
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId: customerId,
        type: "reservation_reminder",
        title: "Reminder",
        message: "Your reservation is tomorrow",
        referenceType: null,
        referenceId: null,
      },
    });

    expect(result.id).toBeTruthy();

    // Verify notification was saved
    const saved = await container.notificationRepository.findById(
      result.id as never,
    );
    expect(saved).not.toBeNull();
    expect(saved!.title).toBe("Reminder");
  });

  it("should send email when email preference is ON", async () => {
    const container = getContainer();
    const email = `customer-email-test-${uuidv7()}@example.com`;
    const customerId = await insertCustomer(container.db, { email });

    await insertPreference(container.db, {
      recipientType: "customer",
      recipientId: customerId,
      channel: "in_app",
      type: "reservation_reminder",
      enabled: false,
    });
    await insertPreference(container.db, {
      recipientType: "customer",
      recipientId: customerId,
      channel: "email",
      type: "reservation_reminder",
      enabled: true,
    });

    const sendSpy = vi.fn();
    const result = await createNotification({
      container: {
        unitOfWorkProvider: container.unitOfWorkProvider,
        notificationPreferenceRepository:
          container.notificationPreferenceRepository,
        emailSender: { sendNotificationEmail: sendSpy },
        customerRepository: container.customerRepository,
        memberRepository: container.memberRepository,
      },
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId: customerId,
        type: "reservation_reminder",
        title: "Reminder",
        message: "Your reservation is tomorrow",
        referenceType: null,
        referenceId: null,
      },
    });

    expect(result.id).toBeTruthy();
    expect(sendSpy).toHaveBeenCalledWith(email, expect.anything());
  });

  it("should create in-app notification and send email when both are ON", async () => {
    const container = getContainer();
    const email = `both-on-${uuidv7()}@example.com`;
    const customerId = await insertCustomer(container.db, { email });

    // No preferences => defaults are ON

    const sendSpy = vi.fn();
    const result = await createNotification({
      container: {
        unitOfWorkProvider: container.unitOfWorkProvider,
        notificationPreferenceRepository:
          container.notificationPreferenceRepository,
        emailSender: { sendNotificationEmail: sendSpy },
        customerRepository: container.customerRepository,
        memberRepository: container.memberRepository,
      },
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId: customerId,
        type: "reservation_reminder",
        title: "Reminder",
        message: "Reminder message",
        referenceType: null,
        referenceId: null,
      },
    });

    expect(result.id).toBeTruthy();

    // In-app notification saved
    const saved = await container.notificationRepository.findById(
      result.id as never,
    );
    expect(saved).not.toBeNull();

    // Email sent
    expect(sendSpy).toHaveBeenCalledWith(email, expect.anything());
  });

  it("should create notification for customer recipientType", async () => {
    const container = getContainer();
    const customerId = await insertCustomer(container.db);

    const result = await createNotification({
      container: {
        unitOfWorkProvider: container.unitOfWorkProvider,
        notificationPreferenceRepository:
          container.notificationPreferenceRepository,
        emailSender: container.notificationEmailSender,
        customerRepository: container.customerRepository,
        memberRepository: container.memberRepository,
      },
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId: customerId,
        type: "reservation_reminder",
        title: "Customer Notification",
        message: "Message for customer",
        referenceType: null,
        referenceId: null,
      },
    });

    expect(result.id).toBeTruthy();
    const saved = await container.notificationRepository.findById(
      result.id as never,
    );
    expect(saved).not.toBeNull();
    expect(saved!.recipientType).toBe("customer");
  });

  it("should create notification for member recipientType", async () => {
    const container = getContainer();
    const memberId = await insertMember(container.db);

    const result = await createNotification({
      container: {
        unitOfWorkProvider: container.unitOfWorkProvider,
        notificationPreferenceRepository:
          container.notificationPreferenceRepository,
        emailSender: container.notificationEmailSender,
        customerRepository: container.customerRepository,
        memberRepository: container.memberRepository,
      },
      headers: createMockHeaders(),
      input: {
        recipientType: "member",
        recipientId: memberId,
        type: "new_reservation",
        title: "Member Notification",
        message: "Message for member",
        referenceType: null,
        referenceId: null,
      },
    });

    expect(result.id).toBeTruthy();
    const saved = await container.notificationRepository.findById(
      result.id as never,
    );
    expect(saved).not.toBeNull();
    expect(saved!.recipientType).toBe("member");
  });

  it("should create notification with referenceType and referenceId", async () => {
    const container = getContainer();
    const customerId = await insertCustomer(container.db);

    const result = await createNotification({
      container: {
        unitOfWorkProvider: container.unitOfWorkProvider,
        notificationPreferenceRepository:
          container.notificationPreferenceRepository,
        emailSender: container.notificationEmailSender,
        customerRepository: container.customerRepository,
        memberRepository: container.memberRepository,
      },
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId: customerId,
        type: "reservation_confirmed",
        title: "Reservation Confirmed",
        message: "Your reservation has been confirmed",
        referenceType: "reservation",
        referenceId: "res-123",
      },
    });

    expect(result.id).toBeTruthy();
    const saved = await container.notificationRepository.findById(
      result.id as never,
    );
    expect(saved).not.toBeNull();
    expect(saved!.referenceType).toBe("reservation");
    expect(saved!.referenceId).toBe("res-123");
  });

  it("should create notification without reference entity (null)", async () => {
    const container = getContainer();
    const customerId = await insertCustomer(container.db);

    const result = await createNotification({
      container: {
        unitOfWorkProvider: container.unitOfWorkProvider,
        notificationPreferenceRepository:
          container.notificationPreferenceRepository,
        emailSender: container.notificationEmailSender,
        customerRepository: container.customerRepository,
        memberRepository: container.memberRepository,
      },
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId: customerId,
        type: "reservation_reminder",
        title: "Reminder",
        message: "Message",
        referenceType: null,
        referenceId: null,
      },
    });

    expect(result.id).toBeTruthy();
    const saved = await container.notificationRepository.findById(
      result.id as never,
    );
    expect(saved).not.toBeNull();
    expect(saved!.referenceType).toBeNull();
    expect(saved!.referenceId).toBeNull();
  });

  it("should force create in-app notification for important types even when in-app is OFF", async () => {
    const container = getContainer();
    const customerId = await insertCustomer(container.db);

    // Disable in_app for important type
    await insertPreference(container.db, {
      recipientType: "customer",
      recipientId: customerId,
      channel: "in_app",
      type: "reservation_confirmed",
      enabled: false,
    });
    await insertPreference(container.db, {
      recipientType: "customer",
      recipientId: customerId,
      channel: "email",
      type: "reservation_confirmed",
      enabled: false,
    });

    const result = await createNotification({
      container: {
        unitOfWorkProvider: container.unitOfWorkProvider,
        notificationPreferenceRepository:
          container.notificationPreferenceRepository,
        emailSender: container.notificationEmailSender,
        customerRepository: container.customerRepository,
        memberRepository: container.memberRepository,
      },
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId: customerId,
        type: "reservation_confirmed",
        title: "Important",
        message: "Important notification",
        referenceType: null,
        referenceId: null,
      },
    });

    expect(result.id).toBeTruthy();
    const saved = await container.notificationRepository.findById(
      result.id as never,
    );
    expect(saved).not.toBeNull();
  });

  // ---- Error cases ----

  it("should not create notification or send email when both in-app and email are OFF for non-important type", async () => {
    const container = getContainer();
    const customerId = await insertCustomer(container.db);

    await insertPreference(container.db, {
      recipientType: "customer",
      recipientId: customerId,
      channel: "in_app",
      type: "reservation_reminder",
      enabled: false,
    });
    await insertPreference(container.db, {
      recipientType: "customer",
      recipientId: customerId,
      channel: "email",
      type: "reservation_reminder",
      enabled: false,
    });

    const sendSpy = vi.fn();
    const result = await createNotification({
      container: {
        unitOfWorkProvider: container.unitOfWorkProvider,
        notificationPreferenceRepository:
          container.notificationPreferenceRepository,
        emailSender: { sendNotificationEmail: sendSpy },
        customerRepository: container.customerRepository,
        memberRepository: container.memberRepository,
      },
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId: customerId,
        type: "reservation_reminder",
        title: "Reminder",
        message: "Message",
        referenceType: null,
        referenceId: null,
      },
    });

    // Returns empty id since nothing was created
    expect(result.id).toBe("");
    expect(sendSpy).not.toHaveBeenCalled();
  });

  it("should not throw when recipientId does not exist (email resolution returns null)", async () => {
    const container = getContainer();
    const nonExistentId = uuidv7();

    const sendSpy = vi.fn();
    const result = await createNotification({
      container: {
        unitOfWorkProvider: container.unitOfWorkProvider,
        notificationPreferenceRepository:
          container.notificationPreferenceRepository,
        emailSender: { sendNotificationEmail: sendSpy },
        customerRepository: container.customerRepository,
        memberRepository: container.memberRepository,
      },
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId: nonExistentId,
        type: "reservation_reminder",
        title: "Reminder",
        message: "Message",
        referenceType: null,
        referenceId: null,
      },
    });

    // Notification is created (defaults are enabled) but email not sent (no customer found)
    expect(result.id).toBeTruthy();
    expect(sendSpy).not.toHaveBeenCalled();
  });

  // ---- Edge cases ----

  it("should skip email when email is ON but recipient has no email address", async () => {
    const container = getContainer();
    // Customer always has email, so use member without matching email
    // Actually, resolveRecipientEmail returns null if customer/member not found
    // Let's test with a member scenario where member doesn't exist in DB
    const fakeRecipientId = uuidv7();

    // Set email preference ON, in_app OFF
    await insertPreference(container.db, {
      recipientType: "member",
      recipientId: fakeRecipientId,
      channel: "email",
      type: "reservation_reminder",
      enabled: true,
    });
    await insertPreference(container.db, {
      recipientType: "member",
      recipientId: fakeRecipientId,
      channel: "in_app",
      type: "reservation_reminder",
      enabled: false,
    });

    const sendSpy = vi.fn();
    const result = await createNotification({
      container: {
        unitOfWorkProvider: container.unitOfWorkProvider,
        notificationPreferenceRepository:
          container.notificationPreferenceRepository,
        emailSender: { sendNotificationEmail: sendSpy },
        customerRepository: container.customerRepository,
        memberRepository: container.memberRepository,
      },
      headers: createMockHeaders(),
      input: {
        recipientType: "member",
        recipientId: fakeRecipientId,
        type: "reservation_reminder",
        title: "Reminder",
        message: "Message",
        referenceType: null,
        referenceId: null,
      },
    });

    // Email skipped because member not found (no email)
    expect(sendSpy).not.toHaveBeenCalled();
  });

  it("should force create in-app and send email when important, in-app OFF, email ON", async () => {
    const container = getContainer();
    const email = `important-email-${uuidv7()}@example.com`;
    const customerId = await insertCustomer(container.db, { email });

    await insertPreference(container.db, {
      recipientType: "customer",
      recipientId: customerId,
      channel: "in_app",
      type: "reservation_cancelled",
      enabled: false,
    });
    await insertPreference(container.db, {
      recipientType: "customer",
      recipientId: customerId,
      channel: "email",
      type: "reservation_cancelled",
      enabled: true,
    });

    const sendSpy = vi.fn();
    const result = await createNotification({
      container: {
        unitOfWorkProvider: container.unitOfWorkProvider,
        notificationPreferenceRepository:
          container.notificationPreferenceRepository,
        emailSender: { sendNotificationEmail: sendSpy },
        customerRepository: container.customerRepository,
        memberRepository: container.memberRepository,
      },
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId: customerId,
        type: "reservation_cancelled",
        title: "Cancelled",
        message: "Your reservation was cancelled",
        referenceType: null,
        referenceId: null,
      },
    });

    expect(result.id).toBeTruthy();

    // In-app created
    const saved = await container.notificationRepository.findById(
      result.id as never,
    );
    expect(saved).not.toBeNull();

    // Email sent
    expect(sendSpy).toHaveBeenCalledWith(email, expect.anything());
  });

  it("should force create only in-app when important, in-app OFF, email OFF", async () => {
    const container = getContainer();
    const customerId = await insertCustomer(container.db);

    await insertPreference(container.db, {
      recipientType: "customer",
      recipientId: customerId,
      channel: "in_app",
      type: "reservation_approved",
      enabled: false,
    });
    await insertPreference(container.db, {
      recipientType: "customer",
      recipientId: customerId,
      channel: "email",
      type: "reservation_approved",
      enabled: false,
    });

    const sendSpy = vi.fn();
    const result = await createNotification({
      container: {
        unitOfWorkProvider: container.unitOfWorkProvider,
        notificationPreferenceRepository:
          container.notificationPreferenceRepository,
        emailSender: { sendNotificationEmail: sendSpy },
        customerRepository: container.customerRepository,
        memberRepository: container.memberRepository,
      },
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId: customerId,
        type: "reservation_approved",
        title: "Approved",
        message: "Approved",
        referenceType: null,
        referenceId: null,
      },
    });

    expect(result.id).toBeTruthy();

    // In-app created
    const saved = await container.notificationRepository.findById(
      result.id as never,
    );
    expect(saved).not.toBeNull();

    // Email not sent
    expect(sendSpy).not.toHaveBeenCalled();
  });

  it("should create notification with a very long title", async () => {
    const container = getContainer();
    const customerId = await insertCustomer(container.db);

    const longTitle = "A".repeat(1000);
    const result = await createNotification({
      container: {
        unitOfWorkProvider: container.unitOfWorkProvider,
        notificationPreferenceRepository:
          container.notificationPreferenceRepository,
        emailSender: container.notificationEmailSender,
        customerRepository: container.customerRepository,
        memberRepository: container.memberRepository,
      },
      headers: createMockHeaders(),
      input: {
        recipientType: "customer",
        recipientId: customerId,
        type: "reservation_reminder",
        title: longTitle,
        message: "Message",
        referenceType: null,
        referenceId: null,
      },
    });

    expect(result.id).toBeTruthy();
    const saved = await container.notificationRepository.findById(
      result.id as never,
    );
    expect(saved).not.toBeNull();
    expect(saved!.title).toBe(longTitle);
  });
});
