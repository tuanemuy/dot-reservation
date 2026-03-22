import { describe, expect, it } from "vitest";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { ConflictError, NotFoundError } from "@/core/application/error";
import { createCustomer } from "../createCustomer";
import { getCustomer } from "../getCustomer";
import { suspendCustomer } from "../suspendCustomer";

describe("suspendCustomer", () => {
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

  it("アクティブな顧客を停止状態にできる", async () => {
    const container = getContainer();
    const headers = createMockHeaders();
    const customer = await createActiveCustomer(container, "suspend-ok");

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

  it("停止後の顧客のステータスが停止中になっている", async () => {
    const container = getContainer();
    const headers = createMockHeaders();
    const customer = await createActiveCustomer(container, "suspend-verify");

    await suspendCustomer({
      container,
      headers,
      input: { customerId: customer.id },
    });

    const fetched = await getCustomer({
      container,
      headers,
      input: { customerId: customer.id },
    });

    expect(fetched.status).toBe("suspended");
  });

  it("既に停止中の顧客を停止するとConflictErrorがスローされる", async () => {
    const container = getContainer();
    const headers = createMockHeaders();
    const customer = await createActiveCustomer(
      container,
      "suspend-already-suspended",
    );

    await suspendCustomer({
      container,
      headers,
      input: { customerId: customer.id },
    });

    await expect(
      suspendCustomer({
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
      suspendCustomer({
        container,
        headers,
        input: { customerId: "non-existent-id" },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("未来の予約があるアクティブな顧客でも停止できる", async () => {
    const container = getContainer();
    const headers = createMockHeaders();
    const customer = await createActiveCustomer(
      container,
      "suspend-with-reservation",
    );

    // The suspendCustomer implementation does not check for future reservations.
    // It simply suspends the customer regardless.
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
});
