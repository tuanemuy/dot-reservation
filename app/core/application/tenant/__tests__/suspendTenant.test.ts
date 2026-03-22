import { describe, expect, it } from "vitest";
import { ConflictError, NotFoundError } from "@/core/application/error";
import { getTenant } from "@/core/application/tenant/getTenant";
import { searchTenants } from "@/core/application/tenant/searchTenants";
import { suspendTenant } from "@/core/application/tenant/suspendTenant";
import {
  createMockHeaders,
  createTestTenant,
  setupTestContainer,
} from "./helpers";

const getContainer = setupTestContainer();

describe("suspendTenant", () => {
  it("アクティブなテナントが停止状態になる", async () => {
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

  it("停止後のテナントを取得するとステータスが停止中になっている", async () => {
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

  it("既に停止中のテナントを停止しようとするとConflictErrorがスローされる", async () => {
    const container = getContainer();
    const created = await createTestTenant(container);

    await suspendTenant({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id },
    });

    await expect(
      suspendTenant({
        container,
        headers: createMockHeaders(),
        input: { tenantId: created.id },
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("存在しないtenantIdを指定するとNotFoundErrorがスローされる", async () => {
    const container = getContainer();

    await expect(
      suspendTenant({
        container,
        headers: createMockHeaders(),
        input: { tenantId: "non-existent-id" },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("停止後のテナントをsearchTenantsで検索すると結果に含まれない", async () => {
    const container = getContainer();
    const created = await createTestTenant(container);

    await suspendTenant({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id },
    });

    const result = await searchTenants({
      container,
      headers: createMockHeaders(),
      input: { keyword: null, area: null, category: null, page: 1, limit: 10 },
    });

    expect(result.items.find((t) => t.id === created.id)).toBeUndefined();
  });
});
