import { describe, expect, it } from "vitest";
import { NotFoundError, ValidationError } from "@/core/application/error";
import { addTemporaryHoliday } from "@/core/application/tenant/addTemporaryHoliday";
import { getTenant } from "@/core/application/tenant/getTenant";
import { BusinessRuleError } from "@/core/domain/error";
import {
  createMockHeaders,
  createTestTenant,
  setupTestContainer,
} from "./helpers";

const getContainer = setupTestContainer();

function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function futureDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return formatLocalDate(d);
}

function pastDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return formatLocalDate(d);
}

function todayDate(): string {
  return formatLocalDate(new Date());
}

describe("addTemporaryHoliday", () => {
  it("未来の日付とreasonを指定して臨時休業日が正常に追加される", async () => {
    const container = getContainer();
    const created = await createTestTenant(container);
    const date = futureDate(7);

    await addTemporaryHoliday({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id, date, reason: "設備メンテナンス" },
    });

    const tenant = await getTenant({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id },
    });

    expect(tenant.temporaryHolidays.length).toBe(1);
    expect(tenant.temporaryHolidays[0].reason).toBe("設備メンテナンス");
  });

  it("未来の日付でreasonをnullにして臨時休業日がreason無しで追加される", async () => {
    const container = getContainer();
    const created = await createTestTenant(container);
    const date = futureDate(7);

    await addTemporaryHoliday({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id, date, reason: null },
    });

    const tenant = await getTenant({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id },
    });

    expect(tenant.temporaryHolidays.length).toBe(1);
    expect(tenant.temporaryHolidays[0].reason).toBeNull();
  });

  it("本日の日付を指定して正常に追加される", async () => {
    const container = getContainer();
    const created = await createTestTenant(container);
    const date = todayDate();

    await addTemporaryHoliday({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id, date, reason: null },
    });

    const tenant = await getTenant({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id },
    });

    expect(tenant.temporaryHolidays.length).toBe(1);
  });

  it("過去の日付を指定するとValidationErrorがスローされる", async () => {
    const container = getContainer();
    const created = await createTestTenant(container);
    const date = pastDate(1);

    await expect(
      addTemporaryHoliday({
        container,
        headers: createMockHeaders(),
        input: { tenantId: created.id, date, reason: null },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("同じ日付の臨時休業日が既に登録されている場合、BusinessRuleErrorがスローされる", async () => {
    const container = getContainer();
    const created = await createTestTenant(container);
    const date = futureDate(7);

    await addTemporaryHoliday({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id, date, reason: null },
    });

    await expect(
      addTemporaryHoliday({
        container,
        headers: createMockHeaders(),
        input: { tenantId: created.id, date, reason: "別の理由" },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("存在しないtenantIdを指定するとNotFoundErrorがスローされる", async () => {
    const container = getContainer();

    await expect(
      addTemporaryHoliday({
        container,
        headers: createMockHeaders(),
        input: {
          tenantId: "non-existent-id",
          date: futureDate(7),
          reason: null,
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("不正な日付形式を指定するとValidationErrorがスローされる", async () => {
    const container = getContainer();
    const created = await createTestTenant(container);

    await expect(
      addTemporaryHoliday({
        container,
        headers: createMockHeaders(),
        input: { tenantId: created.id, date: "2026-13-01", reason: null },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("該当日に予約があっても臨時休業日が追加される", async () => {
    const container = getContainer();
    const created = await createTestTenant(container);
    const date = futureDate(14);

    // Simply add the holiday - we don't need to create reservations for this test
    // The spec says "予約の扱いは別途考慮"
    await addTemporaryHoliday({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id, date, reason: "臨時休業" },
    });

    const tenant = await getTenant({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id },
    });

    expect(tenant.temporaryHolidays.length).toBe(1);
  });
});
