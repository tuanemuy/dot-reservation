import { describe, expect, it } from "vitest";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { ConflictError, NotFoundError } from "@/core/application/error";
import { createCustomer } from "../createCustomer";
import { getCustomer } from "../getCustomer";
import { reactivateCustomer } from "../reactivateCustomer";
import { suspendCustomer } from "../suspendCustomer";

describe("reactivateCustomer", () => {
  const getContainer = setupTestContainer();

  async function createSuspendedCustomer(
    container: ReturnType<typeof getContainer>,
    suffix: string,
  ) {
    const headers = createMockHeaders();
    const customer = await createCustomer({
      container,
      headers,
      input: {
        authUserId: `auth-${suffix}`,
        displayName: `ユーザー${suffix}`,
        email: `${suffix}@example.com`,
      },
    });

    await suspendCustomer({
      container,
      headers,
      input: { customerId: customer.id },
    });

    return customer;
  }

  it("停止中の顧客をアクティブ状態にできる", async () => {
    const container = getContainer();
    const headers = createMockHeaders();
    const customer = await createSuspendedCustomer(container, "reactivate-ok");

    await reactivateCustomer({
      container,
      headers,
      input: { customerId: customer.id },
    });

    const result = await getCustomer({
      container,
      headers,
      input: { customerId: customer.id },
    });

    expect(result.status).toBe("active");
  });

  it("再開後の顧客のステータスがアクティブになっている", async () => {
    const container = getContainer();
    const headers = createMockHeaders();
    const customer = await createSuspendedCustomer(
      container,
      "reactivate-verify",
    );

    await reactivateCustomer({
      container,
      headers,
      input: { customerId: customer.id },
    });

    const fetched = await getCustomer({
      container,
      headers,
      input: { customerId: customer.id },
    });

    expect(fetched.status).toBe("active");
  });

  it("既にアクティブな顧客を再開するとConflictErrorがスローされる", async () => {
    const container = getContainer();
    const headers = createMockHeaders();

    const customer = await createCustomer({
      container,
      headers,
      input: {
        authUserId: "auth-already-active",
        displayName: "アクティブユーザー",
        email: "already-active@example.com",
      },
    });

    await expect(
      reactivateCustomer({
        container,
        headers,
        input: { customerId: customer.id },
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("存在しないcustomerIdの場合NotFoundErrorがスローされる", async () => {
    const container = getContainer();
    const headers = createMockHeaders();

    await expect(
      reactivateCustomer({
        container,
        headers,
        input: { customerId: "non-existent-id" },
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
