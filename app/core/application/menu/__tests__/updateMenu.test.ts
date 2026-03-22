import { v7 as uuidv7 } from "uuid";
import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { ConflictError, NotFoundError } from "@/core/application/error";
import { BusinessRuleError } from "@/core/domain/error";
import { createMockHeaders, setupTestContainer } from "../../__tests__/helpers";
import { createMenu } from "../createMenu";
import { updateMenu } from "../updateMenu";

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
    category?: string | null;
    description?: string | null;
    duration?: number;
    price?: number;
  } = {},
) {
  const result = await createMenu({
    container,
    headers: createMockHeaders(),
    input: {
      tenantId,
      name: overrides.name ?? "Cut",
      category: overrides.category ?? "Hair",
      description: overrides.description ?? "Basic haircut",
      duration: overrides.duration ?? 30,
      price: overrides.price ?? 3000,
    },
  });
  return result;
}

describe("updateMenu", () => {
  const headers = createMockHeaders();

  it("should update a menu with valid name, duration, and price", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);
    const menu = await createTestMenu(container, tenantId);

    const result = await updateMenu({
      container,
      headers,
      input: {
        menuId: menu.id,
        name: "Updated Cut",
        category: "Hair",
        description: "Updated description",
        duration: 45,
        price: 4000,
      },
    });

    expect(result.id).toBe(menu.id);
    expect(result.name).toBe("Updated Cut");
  });

  it("should update only the name", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);
    const menu = await createTestMenu(container, tenantId);

    const result = await updateMenu({
      container,
      headers,
      input: {
        menuId: menu.id,
        name: "New Name",
        category: "Hair",
        description: "Basic haircut",
        duration: 30,
        price: 3000,
      },
    });

    expect(result.name).toBe("New Name");

    const updated = await container.menuRepository.findById(menu.id as never);
    expect(updated).not.toBeNull();
    expect(updated!.name).toBe("New Name");
  });

  it("should update category and description", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);
    const menu = await createTestMenu(container, tenantId);

    await updateMenu({
      container,
      headers,
      input: {
        menuId: menu.id,
        name: "Cut",
        category: "Premium Hair",
        description: "Premium haircut service",
        duration: 30,
        price: 3000,
      },
    });

    const updated = await container.menuRepository.findById(menu.id as never);
    expect(updated!.category).toBe("Premium Hair");
    expect(updated!.description).toBe("Premium haircut service");
  });

  it("should clear category to null", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);
    const menu = await createTestMenu(container, tenantId, {
      category: "Hair",
    });

    await updateMenu({
      container,
      headers,
      input: {
        menuId: menu.id,
        name: "Cut",
        category: null,
        description: null,
        duration: 30,
        price: 3000,
      },
    });

    const updated = await container.menuRepository.findById(menu.id as never);
    expect(updated!.category).toBeNull();
  });

  it("should throw ConflictError when changing to a name that already exists in the same tenant", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);
    await createTestMenu(container, tenantId, { name: "Cut" });
    const menu2 = await createTestMenu(container, tenantId, { name: "Perm" });

    await expect(
      updateMenu({
        container,
        headers,
        input: {
          menuId: menu2.id,
          name: "Cut",
          category: "Hair",
          description: "Basic haircut",
          duration: 30,
          price: 3000,
        },
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("should allow updating with the same name (self-duplicate is ok)", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);
    const menu = await createTestMenu(container, tenantId, { name: "Cut" });

    const result = await updateMenu({
      container,
      headers,
      input: {
        menuId: menu.id,
        name: "Cut",
        category: "Updated Category",
        description: "Updated description",
        duration: 45,
        price: 4000,
      },
    });

    expect(result.id).toBe(menu.id);
    expect(result.name).toBe("Cut");
  });

  it("should throw NotFoundError when menuId does not exist", async () => {
    const container = getContainer();
    const nonExistentMenuId = uuidv7();

    await expect(
      updateMenu({
        container,
        headers,
        input: {
          menuId: nonExistentMenuId,
          name: "Cut",
          category: "Hair",
          description: "Basic haircut",
          duration: 30,
          price: 3000,
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw BusinessRuleError when duration is less than 15", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);
    const menu = await createTestMenu(container, tenantId);

    await expect(
      updateMenu({
        container,
        headers,
        input: {
          menuId: menu.id,
          name: "Cut",
          category: "Hair",
          description: "Basic haircut",
          duration: 10,
          price: 3000,
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should update with duration 15 (boundary value)", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);
    const menu = await createTestMenu(container, tenantId);

    const result = await updateMenu({
      container,
      headers,
      input: {
        menuId: menu.id,
        name: "Cut",
        category: "Hair",
        description: "Basic haircut",
        duration: 15,
        price: 3000,
      },
    });

    expect(result.id).toBe(menu.id);

    const updated = await container.menuRepository.findById(menu.id as never);
    expect(updated!.duration).toBe(15);
  });

  it("should throw BusinessRuleError when price is negative", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);
    const menu = await createTestMenu(container, tenantId);

    await expect(
      updateMenu({
        container,
        headers,
        input: {
          menuId: menu.id,
          name: "Cut",
          category: "Hair",
          description: "Basic haircut",
          duration: 30,
          price: -100,
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError when name is empty", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);
    const menu = await createTestMenu(container, tenantId);

    await expect(
      updateMenu({
        container,
        headers,
        input: {
          menuId: menu.id,
          name: "",
          category: "Hair",
          description: "Basic haircut",
          duration: 30,
          price: 3000,
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });
});
