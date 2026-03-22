import { describe, expect, it } from "vitest";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { NotFoundError, ValidationError } from "@/core/application/error";
import { createCustomer } from "../createCustomer";
import { getCustomer } from "../getCustomer";

describe("getCustomer", () => {
  const getContainer = setupTestContainer();

  async function createActiveCustomer(
    container: ReturnType<typeof getContainer>,
    suffix: string,
  ) {
    const headers = createMockHeaders();
    return createCustomer({
      container,
      headers,
      input: {
        authUserId: `auth-${suffix}`,
        displayName: `ユーザー${suffix}`,
        email: `${suffix}@example.com`,
      },
    });
  }

  it("customerIdを指定して顧客情報が返却される", async () => {
    const container = getContainer();
    const headers = createMockHeaders();
    const created = await createActiveCustomer(container, "get-by-id");

    const result = await getCustomer({
      container,
      headers,
      input: { customerId: created.id },
    });

    expect(result.id).toBe(created.id);
    expect(result.displayName).toBe("ユーザーget-by-id");
    expect(result.email).toBe("get-by-id@example.com");
    expect(result.phoneNumber).toBeNull();
    expect(result.status).toBe("active");
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it("authUserIdを指定して顧客情報が返却される", async () => {
    const container = getContainer();
    const headers = createMockHeaders();
    await createActiveCustomer(container, "get-by-auth");

    const result = await getCustomer({
      container,
      headers,
      input: { authUserId: "auth-get-by-auth" },
    });

    expect(result.displayName).toBe("ユーザーget-by-auth");
    expect(result.email).toBe("get-by-auth@example.com");
  });

  it("存在しないcustomerIdの場合NotFoundErrorがスローされる", async () => {
    const container = getContainer();
    const headers = createMockHeaders();

    await expect(
      getCustomer({
        container,
        headers,
        input: { customerId: "non-existent-id" },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("存在しないauthUserIdの場合NotFoundErrorがスローされる", async () => {
    const container = getContainer();
    const headers = createMockHeaders();

    await expect(
      getCustomer({
        container,
        headers,
        input: { authUserId: "non-existent-auth" },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("customerIdもauthUserIdも指定しない場合ValidationErrorがスローされる", async () => {
    const container = getContainer();
    const headers = createMockHeaders();

    await expect(
      getCustomer({
        container,
        headers,
        input: {},
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("customerIdとauthUserIdの両方を指定するとcustomerIdが優先される", async () => {
    const container = getContainer();
    const headers = createMockHeaders();
    const customer = await createActiveCustomer(container, "both-ids");

    const result = await getCustomer({
      container,
      headers,
      input: {
        customerId: customer.id,
        authUserId: "auth-non-existent",
      },
    });

    expect(result.id).toBe(customer.id);
    expect(result.displayName).toBe("ユーザーboth-ids");
  });

  it("停止中の顧客もcustomerIdで取得でき停止中ステータスが返却される", async () => {
    const container = getContainer();
    const headers = createMockHeaders();
    const customer = await createActiveCustomer(container, "suspended-get");

    const { suspendCustomer } = await import("../suspendCustomer");
    await suspendCustomer({
      container,
      headers,
      input: { customerId: customer.id },
    });

    const result = await getCustomer({
      container,
      headers,
      input: { customerId: customer.id },
    });

    expect(result.status).toBe("suspended");
  });

  it("phoneNumberが設定されていない場合nullで返却される", async () => {
    const container = getContainer();
    const headers = createMockHeaders();
    const customer = await createActiveCustomer(container, "no-phone");

    const result = await getCustomer({
      container,
      headers,
      input: { customerId: customer.id },
    });

    expect(result.phoneNumber).toBeNull();
  });
});
