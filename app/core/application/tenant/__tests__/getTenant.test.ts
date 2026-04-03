import { describe, expect, it } from "vitest";
import { NotFoundError, ValidationError } from "@/core/application/error";
import { addTemporaryHoliday } from "@/core/application/tenant/addTemporaryHoliday";
import { getTenant } from "@/core/application/tenant/getTenant";
import { suspendTenant } from "@/core/application/tenant/suspendTenant";
import { updateBusinessHours } from "@/core/application/tenant/updateBusinessHours";
import { updateRegularHolidays } from "@/core/application/tenant/updateRegularHolidays";
import { updateReservationSettings } from "@/core/application/tenant/updateReservationSettings";
import {
  createMockHeaders,
  createTestTenant,
  defaultTenantInput,
  setupTestContainer,
} from "./helpers";

const getContainer = setupTestContainer();

describe("getTenant", () => {
  it("tenantIdを指定してテナント情報（全フィールド）が返却される", async () => {
    const container = getContainer();
    const created = await createTestTenant(container);

    const tenant = await getTenant({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id },
    });

    expect(tenant.id).toBe(created.id);
    expect(tenant.name).toBe(defaultTenantInput.name);
    expect(tenant.category).toBe(defaultTenantInput.category);
    expect(tenant.urlPath).toBe(defaultTenantInput.urlPath);
    expect(tenant.postalCode).toBe(defaultTenantInput.postalCode);
    expect(tenant.address).toEqual(defaultTenantInput.address);
    expect(tenant.phoneNumber).toBe(defaultTenantInput.phoneNumber);
    expect(tenant.status).toBe("active");
    expect(tenant.businessHours).toBeDefined();
    expect(tenant.regularHolidays).toBeDefined();
    expect(tenant.temporaryHolidays).toBeDefined();
    expect(tenant.reservationSettings).toBeDefined();
  });

  it("urlPathを指定してテナント情報が返却される", async () => {
    const container = getContainer();
    const created = await createTestTenant(container);

    const tenant = await getTenant({
      container,
      headers: createMockHeaders(),
      input: { urlPath: defaultTenantInput.urlPath },
    });

    expect(tenant.id).toBe(created.id);
    expect(tenant.urlPath).toBe(defaultTenantInput.urlPath);
  });

  it("存在しないtenantIdを指定するとNotFoundErrorがスローされる", async () => {
    const container = getContainer();

    await expect(
      getTenant({
        container,
        headers: createMockHeaders(),
        input: { tenantId: "non-existent-id" },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("存在しないurlPathを指定するとNotFoundErrorがスローされる", async () => {
    const container = getContainer();

    await expect(
      getTenant({
        container,
        headers: createMockHeaders(),
        input: { urlPath: "non-existent-path" },
      }),
    ).rejects.toThrow();
  });

  it("tenantIdもurlPathも指定しないとValidationErrorがスローされる", async () => {
    const container = getContainer();

    await expect(
      getTenant({
        container,
        headers: createMockHeaders(),
        input: {},
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("停止中のテナントをtenantIdで取得すると停止中ステータスで返却される", async () => {
    const container = getContainer();
    const created = await createTestTenant(container);

    await suspendTenant({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id },
    });

    const tenant = await getTenant({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id },
    });

    expect(tenant.status).toBe("suspended");
  });

  it("停止中のテナントをurlPathで取得しても停止中であることが分かる", async () => {
    const container = getContainer();
    await createTestTenant(container);

    await suspendTenant({
      container,
      headers: createMockHeaders(),
      input: {
        tenantId: (
          await getTenant({
            container,
            headers: createMockHeaders(),
            input: { urlPath: defaultTenantInput.urlPath },
          })
        ).id,
      },
    });

    const tenant = await getTenant({
      container,
      headers: createMockHeaders(),
      input: { urlPath: defaultTenantInput.urlPath },
    });

    expect(tenant.status).toBe("suspended");
  });

  it("descriptionが未設定の場合nullで返却される", async () => {
    const container = getContainer();
    const created = await createTestTenant(container);

    const tenant = await getTenant({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id },
    });

    expect(tenant.description).toBeNull();
  });

  it("imageUrlsが空配列で返却される", async () => {
    const container = getContainer();
    const created = await createTestTenant(container);

    const tenant = await getTenant({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id },
    });

    expect(tenant.imageKeys).toEqual([]);
    expect(tenant.imageUrls).toEqual([]);
  });

  it("営業時間・定休日・臨時休業日・予約設定が設定されている場合、全関連情報が正しく返却される", async () => {
    const container = getContainer();
    const created = await createTestTenant(container);

    // Set business hours
    await updateBusinessHours({
      container,
      headers: createMockHeaders(),
      input: {
        tenantId: created.id,
        businessHours: {
          0: null,
          1: { open: "09:00", close: "18:00" },
          2: { open: "09:00", close: "18:00" },
          3: { open: "09:00", close: "18:00" },
          4: { open: "09:00", close: "18:00" },
          5: { open: "09:00", close: "18:00" },
          6: null,
        },
      },
    });

    // Set regular holidays
    await updateRegularHolidays({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id, dayOfWeeks: [0, 6] },
    });

    // Add temporary holiday
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dateStr = futureDate.toISOString().split("T")[0];
    await addTemporaryHoliday({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id, date: dateStr, reason: "お盆休み" },
    });

    // Update reservation settings
    await updateReservationSettings({
      container,
      headers: createMockHeaders(),
      input: {
        tenantId: created.id,
        bookingWindowDays: 14,
        bookingDeadlineHours: 2,
        cancellationDeadlineHours: 4,
        slotDurationMinutes: 45,
        bufferMinutes: 15,
        approvalMethod: "auto",
      },
    });

    const tenant = await getTenant({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id },
    });

    // Verify business hours
    expect(tenant.businessHours[0]).toBeNull();
    expect(tenant.businessHours[1]).toEqual({
      open: "09:00",
      close: "18:00",
    });
    expect(tenant.businessHours[6]).toBeNull();

    // Verify regular holidays
    expect(tenant.regularHolidays).toEqual(expect.arrayContaining([0, 6]));

    // Verify temporary holidays
    expect(tenant.temporaryHolidays.length).toBe(1);
    expect(tenant.temporaryHolidays[0].reason).toBe("お盆休み");

    // Verify reservation settings
    expect(tenant.reservationSettings.bookingWindowDays).toBe(14);
    expect(tenant.reservationSettings.bookingDeadlineHours).toBe(2);
    expect(tenant.reservationSettings.cancellationDeadlineHours).toBe(4);
    expect(tenant.reservationSettings.slotDurationMinutes).toBe(45);
    expect(tenant.reservationSettings.bufferMinutes).toBe(15);
    expect(tenant.reservationSettings.approvalMethod).toBe("auto");
  });
});
