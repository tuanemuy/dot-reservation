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

describe("updateMenuSortOrders", () => {
  const headers = createMockHeaders();

  it("should update sort orders for all menus", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);

    const menuA = await createTestMenu(container, tenantId, { name: "Menu A" });
    const menuB = await createTestMenu(container, tenantId, { name: "Menu B" });
    const menuC = await createTestMenu(container, tenantId, { name: "Menu C" });

    await updateMenuSortOrders({
      container,
      headers,
      input: {
        items: [
          { menuId: menuA.id, sortOrder: 10 },
          { menuId: menuB.id, sortOrder: 20 },
          { menuId: menuC.id, sortOrder: 30 },
        ],
      },
    });

    const result = await listMenus({
      container,
      headers,
      input: { tenantId },
    });

    expect(result.items[0].sortOrder).toBe(10);
    expect(result.items[1].sortOrder).toBe(20);
    expect(result.items[2].sortOrder).toBe(30);
  });

  it("should reverse the sort order (3, 2, 1)", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);

    const menuA = await createTestMenu(container, tenantId, { name: "Menu A" });
    const menuB = await createTestMenu(container, tenantId, { name: "Menu B" });
    const menuC = await createTestMenu(container, tenantId, { name: "Menu C" });

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
    expect(result.items[0].sortOrder).toBe(1);
    expect(result.items[1].name).toBe("Menu B");
    expect(result.items[1].sortOrder).toBe(2);
    expect(result.items[2].name).toBe("Menu A");
    expect(result.items[2].sortOrder).toBe(3);
  });

  it("should update only specified menus' sort orders", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);

    const menuA = await createTestMenu(container, tenantId, { name: "Menu A" });
    await createTestMenu(container, tenantId, { name: "Menu B" });
    const menuC = await createTestMenu(container, tenantId, { name: "Menu C" });

    // Only update Menu A and Menu C, leave Menu B unchanged
    await updateMenuSortOrders({
      container,
      headers,
      input: {
        items: [
          { menuId: menuA.id, sortOrder: 5 },
          { menuId: menuC.id, sortOrder: 4 },
        ],
      },
    });

    const result = await listMenus({
      container,
      headers,
      input: { tenantId },
    });

    // Menu B keeps its original sortOrder (2), Menu C is 4, Menu A is 5
    const menuBResult = result.items.find((m) => m.name === "Menu B");
    const menuAResult = result.items.find((m) => m.name === "Menu A");
    const menuCResult = result.items.find((m) => m.name === "Menu C");

    expect(menuBResult!.sortOrder).toBe(2); // unchanged
    expect(menuCResult!.sortOrder).toBe(4);
    expect(menuAResult!.sortOrder).toBe(5);
  });

  it("should handle non-existent menuId gracefully (no error if DB allows)", async () => {
    const container = getContainer();
    const nonExistentMenuId = uuidv7();

    // The current implementation does not check for existence before updating.
    // The DB update simply has no effect for a non-existent ID.
    await expect(
      updateMenuSortOrders({
        container,
        headers,
        input: {
          items: [{ menuId: nonExistentMenuId, sortOrder: 1 }],
        },
      }),
    ).resolves.toBeUndefined();
  });

  it("should handle empty items array without error", async () => {
    const container = getContainer();

    // The current implementation processes an empty array without issues.
    await expect(
      updateMenuSortOrders({
        container,
        headers,
        input: {
          items: [],
        },
      }),
    ).resolves.toBeUndefined();
  });

  it("should allow duplicate sortOrder values (no validation in current implementation)", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);

    const menuA = await createTestMenu(container, tenantId, { name: "Menu A" });
    const menuB = await createTestMenu(container, tenantId, { name: "Menu B" });

    // The current implementation does not validate duplicate sortOrder values
    await expect(
      updateMenuSortOrders({
        container,
        headers,
        input: {
          items: [
            { menuId: menuA.id, sortOrder: 1 },
            { menuId: menuB.id, sortOrder: 1 },
          ],
        },
      }),
    ).resolves.toBeUndefined();
  });

  it("should allow negative sortOrder values (no validation in current implementation)", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);

    const menuA = await createTestMenu(container, tenantId, { name: "Menu A" });

    // The current implementation does not validate negative sortOrder values
    await expect(
      updateMenuSortOrders({
        container,
        headers,
        input: {
          items: [{ menuId: menuA.id, sortOrder: -1 }],
        },
      }),
    ).resolves.toBeUndefined();
  });

  it("should reflect new sort order in subsequent listMenus call", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);

    const menuA = await createTestMenu(container, tenantId, { name: "Menu A" });
    const menuB = await createTestMenu(container, tenantId, { name: "Menu B" });
    const menuC = await createTestMenu(container, tenantId, { name: "Menu C" });

    // Rearrange: C -> A -> B
    await updateMenuSortOrders({
      container,
      headers,
      input: {
        items: [
          { menuId: menuC.id, sortOrder: 1 },
          { menuId: menuA.id, sortOrder: 2 },
          { menuId: menuB.id, sortOrder: 3 },
        ],
      },
    });

    const result = await listMenus({
      container,
      headers,
      input: { tenantId },
    });

    expect(result.items).toHaveLength(3);
    expect(result.items[0].name).toBe("Menu C");
    expect(result.items[1].name).toBe("Menu A");
    expect(result.items[2].name).toBe("Menu B");
  });
});
