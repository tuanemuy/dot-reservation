import { describe, expect, it } from "vitest";
import { NotFoundError } from "@/core/application/error";
import { addTemporaryHoliday } from "@/core/application/tenant/addTemporaryHoliday";
import { getTenant } from "@/core/application/tenant/getTenant";
import { removeTemporaryHoliday } from "@/core/application/tenant/removeTemporaryHoliday";
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

describe("removeTemporaryHoliday", () => {
  it("登録済みの日付を指定して臨時休業日が正常に削除される", async () => {
    const container = getContainer();
    const created = await createTestTenant(container);
    const date = futureDate(7);

    await addTemporaryHoliday({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id, date, reason: "メンテナンス" },
    });

    await removeTemporaryHoliday({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id, date },
    });

    const tenant = await getTenant({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id },
    });

    expect(tenant.temporaryHolidays.length).toBe(0);
  });

  it("削除した日付が一覧に含まれていない", async () => {
    const container = getContainer();
    const created = await createTestTenant(container);
    const date1 = futureDate(7);
    const date2 = futureDate(14);

    await addTemporaryHoliday({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id, date: date1, reason: null },
    });
    await addTemporaryHoliday({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id, date: date2, reason: null },
    });

    await removeTemporaryHoliday({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id, date: date1 },
    });

    const tenant = await getTenant({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id },
    });

    expect(tenant.temporaryHolidays.length).toBe(1);
    // The remaining holiday should be date2
    const remainingDate = new Date(tenant.temporaryHolidays[0].date);
    const expectedDate = new Date(date2);
    expect(remainingDate.getFullYear()).toBe(expectedDate.getFullYear());
    expect(remainingDate.getMonth()).toBe(expectedDate.getMonth());
    expect(remainingDate.getDate()).toBe(expectedDate.getDate());
  });

  it("登録されていない日付を指定するとBusinessRuleErrorがスローされる", async () => {
    const container = getContainer();
    const created = await createTestTenant(container);

    await expect(
      removeTemporaryHoliday({
        container,
        headers: createMockHeaders(),
        input: { tenantId: created.id, date: futureDate(7) },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("存在しないtenantIdを指定するとNotFoundErrorがスローされる", async () => {
    const container = getContainer();

    await expect(
      removeTemporaryHoliday({
        container,
        headers: createMockHeaders(),
        input: { tenantId: "non-existent-id", date: futureDate(7) },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("過去の臨時休業日が登録されている場合も正常に削除される", async () => {
    const container = getContainer();
    const created = await createTestTenant(container);
    // Add a holiday for today (which will pass validation)
    const today = formatLocalDate(new Date());

    await addTemporaryHoliday({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id, date: today, reason: null },
    });

    // Remove it - removeTemporaryHoliday does not check if the date is past
    await removeTemporaryHoliday({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id, date: today },
    });

    const tenant = await getTenant({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id },
    });

    expect(tenant.temporaryHolidays.length).toBe(0);
  });
});
