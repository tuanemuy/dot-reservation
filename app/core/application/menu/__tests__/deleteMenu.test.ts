import { v7 as uuidv7 } from "uuid";
import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { NotFoundError } from "@/core/application/error";
import { createMockHeaders, setupTestContainer } from "../../__tests__/helpers";
import { createMenu } from "../createMenu";
import { deleteMenu } from "../deleteMenu";
import { listMenus } from "../listMenus";

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
 * Helper: Create a menu and return its id.
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

describe("deleteMenu", () => {
  const headers = createMockHeaders();

  it("should delete an existing menu", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);
    const menu = await createTestMenu(container, tenantId);

    await deleteMenu({
      container,
      headers,
      input: { menuId: menu.id },
    });

    const found = await container.menuRepository.findById(menu.id as never);
    expect(found).toBeNull();
  });

  it("should throw NotFoundError when menuId does not exist", async () => {
    const container = getContainer();
    const nonExistentMenuId = uuidv7();

    await expect(
      deleteMenu({
        container,
        headers,
        input: { menuId: nonExistentMenuId },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should not include deleted menu in list after deletion", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);
    const menu1 = await createTestMenu(container, tenantId, { name: "Cut" });
    await createTestMenu(container, tenantId, { name: "Perm" });

    await deleteMenu({
      container,
      headers,
      input: { menuId: menu1.id },
    });

    const result = await listMenus({
      container,
      headers,
      input: { tenantId },
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].name).toBe("Perm");
  });

  it("should maintain sort orders of remaining menus after deletion", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);
    await createTestMenu(container, tenantId, { name: "Menu A" });
    const menuB = await createTestMenu(container, tenantId, { name: "Menu B" });
    await createTestMenu(container, tenantId, { name: "Menu C" });

    // Delete the middle menu
    await deleteMenu({
      container,
      headers,
      input: { menuId: menuB.id },
    });

    const result = await listMenus({
      container,
      headers,
      input: { tenantId },
    });

    expect(result.items).toHaveLength(2);
    // sortOrder values should still be ordered correctly
    expect(result.items[0].name).toBe("Menu A");
    expect(result.items[1].name).toBe("Menu C");
    expect(result.items[0].sortOrder).toBeLessThan(result.items[1].sortOrder);
  });

  it("should delete menu even if reservations reference it (menuId stored as snapshot)", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);
    const menu = await createTestMenu(container, tenantId);

    // Insert a reservation that references this menu (as a snapshot)
    await container.db.insert(schema.reservations).values({
      id: uuidv7(),
      tenantId,
      menuId: menu.id,
      date: "2025-01-15",
      startTime: "10:00",
      endTime: "10:30",
      status: "confirmed",
      menuName: "Cut",
      menuDuration: 30,
      menuPrice: 3000,
      createdBy: "staff",
    });

    // The menu should still be deletable
    // (reservations store snapshot data, so deleting the menu is safe)
    await deleteMenu({
      container,
      headers,
      input: { menuId: menu.id },
    });

    const found = await container.menuRepository.findById(menu.id as never);
    expect(found).toBeNull();

    // The reservation should still exist
    const reservations = await container.db
      .select()
      .from(schema.reservations)
      .limit(1);
    expect(reservations).toHaveLength(1);
    expect(reservations[0].menuName).toBe("Cut");
  });
});
