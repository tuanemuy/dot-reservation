import { describe, expect, it } from "vitest";
import { NotFoundError } from "@/core/application/error";
import { getTenant } from "@/core/application/tenant/getTenant";
import { updateRegularHolidays } from "@/core/application/tenant/updateRegularHolidays";
import { BusinessRuleError } from "@/core/domain/error";
import {
  createMockHeaders,
  createTestTenant,
  setupTestContainer,
} from "./helpers";

const getContainer = setupTestContainer();

describe("updateRegularHolidays", () => {
  it("有効な曜日値（例: [0, 6]）で定休日が正常に更新される", async () => {
    const container = getContainer();
    const created = await createTestTenant(container);

    await updateRegularHolidays({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id, dayOfWeeks: [0, 6] },
    });

    const tenant = await getTenant({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id },
    });

    expect(tenant.regularHolidays).toEqual(expect.arrayContaining([0, 6]));
    expect(tenant.regularHolidays).toHaveLength(2);
  });

  it("空配列で定休日なしに更新される", async () => {
    const container = getContainer();
    const created = await createTestTenant(container);

    // First set holidays
    await updateRegularHolidays({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id, dayOfWeeks: [0, 6] },
    });

    // Then clear them
    await updateRegularHolidays({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id, dayOfWeeks: [] },
    });

    const tenant = await getTenant({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id },
    });

    expect(tenant.regularHolidays).toHaveLength(0);
  });

  it("全曜日（[0,1,2,3,4,5,6]）を定休日に設定して正常に更新される", async () => {
    const container = getContainer();
    const created = await createTestTenant(container);

    await updateRegularHolidays({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id, dayOfWeeks: [0, 1, 2, 3, 4, 5, 6] },
    });

    const tenant = await getTenant({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id },
    });

    expect(tenant.regularHolidays).toHaveLength(7);
  });

  it("無効な曜日値（7）を含む配列でBusinessRuleErrorがスローされる", async () => {
    const container = getContainer();
    const created = await createTestTenant(container);

    await expect(
      updateRegularHolidays({
        container,
        headers: createMockHeaders(),
        input: { tenantId: created.id, dayOfWeeks: [0, 7] },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("負の曜日値（-1）を含む配列でBusinessRuleErrorがスローされる", async () => {
    const container = getContainer();
    const created = await createTestTenant(container);

    await expect(
      updateRegularHolidays({
        container,
        headers: createMockHeaders(),
        input: { tenantId: created.id, dayOfWeeks: [0, -1] },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("重複する曜日値（[0, 0, 1]）を含む配列を指定した場合", async () => {
    const container = getContainer();
    const created = await createTestTenant(container);

    // The current implementation does not deduplicate, so duplicates are preserved.
    // This test verifies the current behavior.
    await updateRegularHolidays({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id, dayOfWeeks: [0, 0, 1] },
    });

    const tenant = await getTenant({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id },
    });

    // Either duplicates are preserved or deduplicated - both are acceptable per spec
    expect(tenant.regularHolidays).toEqual(expect.arrayContaining([0, 1]));
  });

  it("存在しないtenantIdを指定するとNotFoundErrorがスローされる", async () => {
    const container = getContainer();

    await expect(
      updateRegularHolidays({
        container,
        headers: createMockHeaders(),
        input: { tenantId: "non-existent-id", dayOfWeeks: [0] },
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
