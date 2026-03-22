import { describe, expect, it } from "vitest";
import { checkUrlPathAvailability } from "@/core/application/tenant/checkUrlPathAvailability";
import { deleteTenant } from "@/core/application/tenant/deleteTenant";
import { BusinessRuleError } from "@/core/domain/error";
import {
  createMockHeaders,
  createTestTenant,
  setupTestContainer,
} from "./helpers";

const getContainer = setupTestContainer();

describe("checkUrlPathAvailability", () => {
  it("未使用のurlPathの場合、available: trueが返却される", async () => {
    const container = getContainer();

    const result = await checkUrlPathAvailability({
      container,
      headers: createMockHeaders(),
      input: { urlPath: "unused-path", excludeTenantId: null },
    });

    expect(result.available).toBe(true);
  });

  it("別のテナントで使用中のurlPathの場合、available: falseが返却される", async () => {
    const container = getContainer();
    await createTestTenant(container, { urlPath: "used-path" });

    const result = await checkUrlPathAvailability({
      container,
      headers: createMockHeaders(),
      input: { urlPath: "used-path", excludeTenantId: null },
    });

    expect(result.available).toBe(false);
  });

  it("自テナントで使用中のurlPathでexcludeTenantIdに自テナントIDを指定するとavailable: trueが返却される", async () => {
    const container = getContainer();
    const created = await createTestTenant(container, {
      urlPath: "self-path",
    });

    const result = await checkUrlPathAvailability({
      container,
      headers: createMockHeaders(),
      input: { urlPath: "self-path", excludeTenantId: created.id },
    });

    expect(result.available).toBe(true);
  });

  it("別のテナントで使用中のurlPathでexcludeTenantIdに自テナントIDを指定するとavailable: falseが返却される", async () => {
    const container = getContainer();
    await createTestTenant(container, { urlPath: "other-path" });
    const myTenant = await createTestTenant(container, {
      urlPath: "my-path-aa",
      authUserId: "auth-2",
      creatorEmail: "a2@example.com",
    });

    const result = await checkUrlPathAvailability({
      container,
      headers: createMockHeaders(),
      input: { urlPath: "other-path", excludeTenantId: myTenant.id },
    });

    expect(result.available).toBe(false);
  });

  it("excludeTenantIdを指定しないで使用中のurlPathを確認するとavailable: falseが返却される", async () => {
    const container = getContainer();
    await createTestTenant(container, { urlPath: "in-use-path" });

    const result = await checkUrlPathAvailability({
      container,
      headers: createMockHeaders(),
      input: { urlPath: "in-use-path", excludeTenantId: null },
    });

    expect(result.available).toBe(false);
  });

  it("urlPathが空文字の場合、BusinessRuleErrorがスローされる", async () => {
    const container = getContainer();

    await expect(
      checkUrlPathAvailability({
        container,
        headers: createMockHeaders(),
        input: { urlPath: "", excludeTenantId: null },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("urlPathに使用不可文字が含まれている場合、BusinessRuleErrorがスローされる", async () => {
    const container = getContainer();

    await expect(
      checkUrlPathAvailability({
        container,
        headers: createMockHeaders(),
        input: { urlPath: "my store!", excludeTenantId: null },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("削除済みテナントが使用していたurlPathの場合、available: trueが返却される", async () => {
    const container = getContainer();
    const created = await createTestTenant(container, {
      urlPath: "deleted-path",
    });

    await deleteTenant({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id },
    });

    const result = await checkUrlPathAvailability({
      container,
      headers: createMockHeaders(),
      input: { urlPath: "deleted-path", excludeTenantId: null },
    });

    expect(result.available).toBe(true);
  });
});
