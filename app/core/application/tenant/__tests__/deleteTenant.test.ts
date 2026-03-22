import { describe, expect, it } from "vitest";
import { NotFoundError } from "@/core/application/error";
import { deleteTenant } from "@/core/application/tenant/deleteTenant";
import { getTenant } from "@/core/application/tenant/getTenant";
import { suspendTenant } from "@/core/application/tenant/suspendTenant";
import {
  createMockHeaders,
  createTestTenant,
  setupTestContainer,
} from "./helpers";

const getContainer = setupTestContainer();

describe("deleteTenant", () => {
  it("アクティブなテナントが正常に削除される", async () => {
    const container = getContainer();
    const created = await createTestTenant(container);

    await deleteTenant({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id },
    });

    // Verify tenant is deleted
    await expect(
      getTenant({
        container,
        headers: createMockHeaders(),
        input: { tenantId: created.id },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("削除されたテナントのtenantIdでgetTenantするとNotFoundErrorがスローされる", async () => {
    const container = getContainer();
    const created = await createTestTenant(container);

    await deleteTenant({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id },
    });

    await expect(
      getTenant({
        container,
        headers: createMockHeaders(),
        input: { tenantId: created.id },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("存在しないtenantIdを指定するとNotFoundErrorがスローされる", async () => {
    const container = getContainer();

    await expect(
      deleteTenant({
        container,
        headers: createMockHeaders(),
        input: { tenantId: "non-existent-id" },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("停止中のテナントが正常に削除される", async () => {
    const container = getContainer();
    const created = await createTestTenant(container);

    // Suspend first
    await suspendTenant({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id },
    });

    // Then delete
    await deleteTenant({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id },
    });

    await expect(
      getTenant({
        container,
        headers: createMockHeaders(),
        input: { tenantId: created.id },
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
