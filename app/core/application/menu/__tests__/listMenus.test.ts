import { v7 as uuidv7 } from "uuid";
import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { createMockHeaders, setupTestContainer } from "../../__tests__/helpers";
import { createMenu } from "../createMenu";
import { listMenus } from "../listMenus";
import { updateMenuSortOrders } from "../updateMenuSortOrders";

const getContainer = setupTestContainer();

/**
 * Helper: Insert a tenant directly into the database.
 */
async function insertTenant(
  db: ReturnType<typeof getContainer>["db"],
  overrides: Partial<typeof schema.tenants.$inferInsert> = {},
) {
  const id = overrides.id ?? uuidv7();
  await db.insert(schema.tenants).values({
    id,
    name: "Test Tenant",
    category: "salon",
    urlPath: `test-${id}`,
    postalCode: "100-0001",
    addressPrefecture: "Tokyo",
    addressCity: "Chiyoda",
    addressStreet: "1-1-1",
    phoneNumber: "03-1234-5678",
    businessHours: JSON.stringify({
      0: null,
      1: { open: "09:00", close: "18:00" },
      2: { open: "09:00", close: "18:00" },
      3: { open: "09:00", close: "18:00" },
      4: { open: "09:00", close: "18:00" },
      5: { open: "09:00", close: "18:00" },
      6: null,
    }),
    ...overrides,
  });
  return id;
}

/**
 * Helper: Create a menu and return its output.
 */
async function createTestMenu(
  container: ReturnType<typeof getContainer>,
  tenantId: string,
  overrides: {
    name?: string;
    duration?: number;
    price?: number;
  } = {},
) {
  return createMenu({
    container,
    headers: createMockHeaders(),
    input: {
      tenantId,
      name: overrides.name ?? "Cut",
      category: "Hair",
      description: "Basic haircut",
      duration: overrides.duration ?? 30,
      price: overrides.price ?? 3000,
    },
  });
}

describe("listMenus", () => {
  const headers = createMockHeaders();

  it("should return menus sorted by sortOrder when tenant has multiple menus", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);

    await createTestMenu(container, tenantId, { name: "Menu A" });
    await createTestMenu(container, tenantId, { name: "Menu B" });
    await createTestMenu(container, tenantId, { name: "Menu C" });

    const result = await listMenus({
      container,
      headers,
      input: { tenantId },
    });

    expect(result.items).toHaveLength(3);
    expect(result.items[0].name).toBe("Menu A");
    expect(result.items[1].name).toBe("Menu B");
    expect(result.items[2].name).toBe("Menu C");
    expect(result.items[0].sortOrder).toBeLessThan(result.items[1].sortOrder);
    expect(result.items[1].sortOrder).toBeLessThan(result.items[2].sortOrder);
  });

  it("should return empty items array when tenant has no menus", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);

    const result = await listMenus({
      container,
      headers,
      input: { tenantId },
    });

    expect(result.items).toEqual([]);
  });

  it("should return a single menu when tenant has exactly one", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);

    await createTestMenu(container, tenantId);

    const result = await listMenus({
      container,
      headers,
      input: { tenantId },
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].name).toBe("Cut");
  });

  it("should return menus in the updated sort order after sort order change", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);

    const menuA = await createTestMenu(container, tenantId, { name: "Menu A" });
    const menuB = await createTestMenu(container, tenantId, { name: "Menu B" });
    const menuC = await createTestMenu(container, tenantId, { name: "Menu C" });

    // Reverse the order
    await updateMenuSortOrders({
      container,
      headers,
      input: {
        items: [
          { menuId: menuA.id, sortOrder: 3 },
          { menuId: menuB.id, sortOrder: 2 },
          { menuId: menuC.id, sortOrder: 1 },
        ],
      },
    });

    const result = await listMenus({
      container,
      headers,
      input: { tenantId },
    });

    expect(result.items[0].name).toBe("Menu C");
    expect(result.items[1].name).toBe("Menu B");
    expect(result.items[2].name).toBe("Menu A");
  });

  it("should return empty array for a non-existent tenantId", async () => {
    const container = getContainer();
    const nonExistentTenantId = uuidv7();

    // listMenus uses TenantId.create which just casts the string,
    // and findByTenantId returns empty array for non-existent tenant
    const result = await listMenus({
      container,
      headers,
      input: { tenantId: nonExistentTenantId },
    });

    expect(result.items).toEqual([]);
  });

  it("should return only menus belonging to the specified tenant", async () => {
    const container = getContainer();
    const tenantIdA = await insertTenant(container.db);
    const tenantIdB = await insertTenant(container.db);

    await createTestMenu(container, tenantIdA, { name: "Tenant A Menu 1" });
    await createTestMenu(container, tenantIdA, { name: "Tenant A Menu 2" });
    await createTestMenu(container, tenantIdB, { name: "Tenant B Menu 1" });

    const resultA = await listMenus({
      container,
      headers,
      input: { tenantId: tenantIdA },
    });

    expect(resultA.items).toHaveLength(2);
    for (const item of resultA.items) {
      expect(item.tenantId).toBe(tenantIdA);
    }

    const resultB = await listMenus({
      container,
      headers,
      input: { tenantId: tenantIdB },
    });

    expect(resultB.items).toHaveLength(1);
    expect(resultB.items[0].tenantId).toBe(tenantIdB);
  });
});
