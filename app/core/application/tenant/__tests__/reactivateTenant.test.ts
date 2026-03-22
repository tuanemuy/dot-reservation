import { describe, expect, it } from "vitest";
import { ConflictError, NotFoundError } from "@/core/application/error";
import { getTenant } from "@/core/application/tenant/getTenant";
import { reactivateTenant } from "@/core/application/tenant/reactivateTenant";
import { searchTenants } from "@/core/application/tenant/searchTenants";
import { suspendTenant } from "@/core/application/tenant/suspendTenant";
import {
  createMockHeaders,
  createTestTenant,
  setupTestContainer,
} from "./helpers";

const getContainer = setupTestContainer();

describe("reactivateTenant", () => {
  it("停止中のテナントがアクティブ状態になる", async () => {
    const container = getContainer();
    const created = await createTestTenant(container);

    await suspendTenant({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id },
    });

    await reactivateTenant({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id },
    });

    const tenant = await getTenant({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id },
    });

    expect(tenant.status).toBe("active");
  });

  it("再開後のテナントを取得するとステータスがアクティブになっている", async () => {
    const container = getContainer();
    const created = await createTestTenant(container);

    await suspendTenant({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id },
    });

    await reactivateTenant({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id },
    });

    const tenant = await getTenant({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id },
    });

    expect(tenant.status).toBe("active");
  });

  it("既に稼働中のテナントを再開しようとするとConflictErrorがスローされる", async () => {
    const container = getContainer();
    const created = await createTestTenant(container);

    await expect(
      reactivateTenant({
        container,
        headers: createMockHeaders(),
        input: { tenantId: created.id },
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("存在しないtenantIdを指定するとNotFoundErrorがスローされる", async () => {
    const container = getContainer();

    await expect(
      reactivateTenant({
        container,
        headers: createMockHeaders(),
        input: { tenantId: "non-existent-id" },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("再開後のテナントをsearchTenantsで検索すると結果に含まれる", async () => {
    const container = getContainer();
    const created = await createTestTenant(container);

    await suspendTenant({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id },
    });

    await reactivateTenant({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id },
    });

    const result = await searchTenants({
      container,
      headers: createMockHeaders(),
      input: { keyword: null, area: null, category: null, page: 1, limit: 10 },
    });

    expect(result.items.find((t) => t.id === created.id)).toBeDefined();
  });
});
