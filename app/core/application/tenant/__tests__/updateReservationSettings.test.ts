import { describe, expect, it } from "vitest";
import { NotFoundError } from "@/core/application/error";
import { getTenant } from "@/core/application/tenant/getTenant";
import { updateReservationSettings } from "@/core/application/tenant/updateReservationSettings";
import { BusinessRuleError } from "@/core/domain/error";
import {
  createMockHeaders,
  createTestTenant,
  setupTestContainer,
} from "./helpers";

const getContainer = setupTestContainer();

const validSettings = {
  bookingWindowDays: 60,
  bookingDeadlineHours: 12,
  cancellationDeadlineHours: 12,
  slotDurationMinutes: 60,
  bufferMinutes: 10,
  approvalMethod: "auto",
};

describe("updateReservationSettings", () => {
  it("全項目に有効な値を設定して予約設定が正常に更新される", async () => {
    const container = getContainer();
    const created = await createTestTenant(container);

    await updateReservationSettings({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id, ...validSettings },
    });

    const tenant = await getTenant({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id },
    });

    expect(tenant.reservationSettings.bookingWindowDays).toBe(60);
    expect(tenant.reservationSettings.bookingDeadlineHours).toBe(12);
    expect(tenant.reservationSettings.cancellationDeadlineHours).toBe(12);
    expect(tenant.reservationSettings.slotDurationMinutes).toBe(60);
    expect(tenant.reservationSettings.bufferMinutes).toBe(10);
    expect(tenant.reservationSettings.approvalMethod).toBe("auto");
  });

  it("approvalMethodを'auto'に設定して承認方法が自動承認に更新される", async () => {
    const container = getContainer();
    const created = await createTestTenant(container);

    await updateReservationSettings({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id, ...validSettings, approvalMethod: "auto" },
    });

    const tenant = await getTenant({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id },
    });

    expect(tenant.reservationSettings.approvalMethod).toBe("auto");
  });

  it("approvalMethodを'manual'に設定して承認方法が手動承認に更新される", async () => {
    const container = getContainer();
    const created = await createTestTenant(container);

    await updateReservationSettings({
      container,
      headers: createMockHeaders(),
      input: {
        tenantId: created.id,
        ...validSettings,
        approvalMethod: "manual",
      },
    });

    const tenant = await getTenant({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id },
    });

    expect(tenant.reservationSettings.approvalMethod).toBe("manual");
  });

  it("approvalMethodに無効な値を設定するとBusinessRuleErrorがスローされる", async () => {
    const container = getContainer();
    const created = await createTestTenant(container);

    await expect(
      updateReservationSettings({
        container,
        headers: createMockHeaders(),
        input: {
          tenantId: created.id,
          ...validSettings,
          approvalMethod: "invalid",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("bookingWindowDaysに0以下の値を設定するとBusinessRuleErrorがスローされる", async () => {
    const container = getContainer();
    const created = await createTestTenant(container);

    await expect(
      updateReservationSettings({
        container,
        headers: createMockHeaders(),
        input: {
          tenantId: created.id,
          ...validSettings,
          bookingWindowDays: 0,
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("bookingDeadlineHoursに負の値を設定するとBusinessRuleErrorがスローされる", async () => {
    const container = getContainer();
    const created = await createTestTenant(container);

    await expect(
      updateReservationSettings({
        container,
        headers: createMockHeaders(),
        input: {
          tenantId: created.id,
          ...validSettings,
          bookingDeadlineHours: -1,
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("cancellationDeadlineHoursに負の値を設定するとBusinessRuleErrorがスローされる", async () => {
    const container = getContainer();
    const created = await createTestTenant(container);

    await expect(
      updateReservationSettings({
        container,
        headers: createMockHeaders(),
        input: {
          tenantId: created.id,
          ...validSettings,
          cancellationDeadlineHours: -1,
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("slotDurationMinutesに0以下の値を設定するとBusinessRuleErrorがスローされる", async () => {
    const container = getContainer();
    const created = await createTestTenant(container);

    await expect(
      updateReservationSettings({
        container,
        headers: createMockHeaders(),
        input: {
          tenantId: created.id,
          ...validSettings,
          slotDurationMinutes: 0,
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("bufferMinutesに負の値を設定するとBusinessRuleErrorがスローされる", async () => {
    const container = getContainer();
    const created = await createTestTenant(container);

    await expect(
      updateReservationSettings({
        container,
        headers: createMockHeaders(),
        input: {
          tenantId: created.id,
          ...validSettings,
          bufferMinutes: -1,
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("存在しないtenantIdを指定するとNotFoundErrorがスローされる", async () => {
    const container = getContainer();

    await expect(
      updateReservationSettings({
        container,
        headers: createMockHeaders(),
        input: { tenantId: "non-existent-id", ...validSettings },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("slotDurationMinutesに非整数値を設定した場合の動作", async () => {
    const container = getContainer();
    const created = await createTestTenant(container);

    // The current implementation does not validate integer vs non-integer
    // It only checks >= 1. So 1.5 would pass through.
    // This documents the current behavior.
    await updateReservationSettings({
      container,
      headers: createMockHeaders(),
      input: {
        tenantId: created.id,
        ...validSettings,
        slotDurationMinutes: 1.5,
      },
    });

    const tenant = await getTenant({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id },
    });

    expect(tenant.reservationSettings.slotDurationMinutes).toBe(1.5);
  });

  it("bookingWindowDaysに極端に大きい値を設定した場合の動作", async () => {
    const container = getContainer();
    const created = await createTestTenant(container);

    // The current implementation does not validate upper bounds
    // This documents the current behavior.
    await updateReservationSettings({
      container,
      headers: createMockHeaders(),
      input: {
        tenantId: created.id,
        ...validSettings,
        bookingWindowDays: 10000,
      },
    });

    const tenant = await getTenant({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id },
    });

    expect(tenant.reservationSettings.bookingWindowDays).toBe(10000);
  });
});
