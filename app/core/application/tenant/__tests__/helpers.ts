import {
  createMockHeaders,
  setupTestContainer,
  type TestContainer,
} from "@/core/application/__tests__/helpers";
import { createTenant } from "@/core/application/tenant/createTenant";

/**
 * Default valid tenant input for testing
 */
export const defaultTenantInput = {
  authUserId: "auth-user-001",
  name: "テストテナント",
  category: "美容室",
  urlPath: "test-tenant",
  postalCode: "100-0001",
  address: { prefecture: "東京都", city: "千代田区", street: "千代田1-1" },
  phoneNumber: "03-1234-5678",
  creatorName: "テスト管理者",
  creatorEmail: "admin@example.com",
};

/**
 * Create a tenant for testing and return its id and other basic info
 */
export async function createTestTenant(
  container: TestContainer,
  overrides: Partial<typeof defaultTenantInput> = {},
) {
  const input = { ...defaultTenantInput, ...overrides };
  const result = await createTenant({
    container,
    headers: createMockHeaders(),
    input,
  });
  return result;
}

export { setupTestContainer, createMockHeaders };
