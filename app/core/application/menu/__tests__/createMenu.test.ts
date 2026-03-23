import { v7 as uuidv7 } from "uuid";
import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { ConflictError } from "@/core/application/error";
import { BusinessRuleError } from "@/core/domain/error";
import { createMockHeaders, setupTestContainer } from "../../__tests__/helpers";
import { createMenu } from "../createMenu";

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
 * Helper: Default valid input for createMenu.
 */
function validInput(tenantId: string) {
  return {
    tenantId,
    name: "Cut",
    category: "Hair",
    description: "Basic haircut",
    duration: 30,
    price: 3000,
  };
}

describe("createMenu", () => {
  const headers = createMockHeaders();

  it("should create a menu with valid tenantId, name, duration, and price", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);

    const result = await createMenu({
      container,
      headers,
      input: validInput(tenantId),
    });

    expect(result.id).toBeDefined();
    expect(result.name).toBe("Cut");
  });

  it("should create a menu with category and description", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);

    const result = await createMenu({
      container,
      headers,
      input: {
        ...validInput(tenantId),
        category: "Hair",
        description: "Premium haircut service",
      },
    });

    expect(result.id).toBeDefined();

    // Verify by reading from DB
    const menus = await container.menuRepository.findByTenantId(
      tenantId as never,
    );
    expect(menus).toHaveLength(1);
    expect(menus[0].category).toBe("Hair");
    expect(menus[0].description).toBe("Premium haircut service");
  });

  it("should create a menu with null category and description", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);

    const result = await createMenu({
      container,
      headers,
      input: {
        ...validInput(tenantId),
        category: null,
        description: null,
      },
    });

    expect(result.id).toBeDefined();

    const menus = await container.menuRepository.findByTenantId(
      tenantId as never,
    );
    expect(menus).toHaveLength(1);
    expect(menus[0].category).toBeNull();
    expect(menus[0].description).toBeNull();
  });

  it("should throw ConflictError when a menu with the same name exists in the same tenant", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);

    await createMenu({
      container,
      headers,
      input: validInput(tenantId),
    });

    await expect(
      createMenu({
        container,
        headers,
        input: validInput(tenantId),
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("should allow the same menu name in different tenants", async () => {
    const container = getContainer();
    const tenantId1 = await insertTenant(container.db);
    const tenantId2 = await insertTenant(container.db);

    await createMenu({
      container,
      headers,
      input: validInput(tenantId1),
    });

    const result = await createMenu({
      container,
      headers,
      input: validInput(tenantId2),
    });

    expect(result.id).toBeDefined();
    expect(result.name).toBe("Cut");
  });

  it("should throw BusinessRuleError when duration is 14 (less than 15)", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);

    await expect(
      createMenu({
        container,
        headers,
        input: { ...validInput(tenantId), duration: 14 },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should create a menu with duration of 15 (boundary value)", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);

    const result = await createMenu({
      container,
      headers,
      input: { ...validInput(tenantId), duration: 15 },
    });

    expect(result.id).toBeDefined();
  });

  it("should throw BusinessRuleError when duration is 0", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);

    await expect(
      createMenu({
        container,
        headers,
        input: { ...validInput(tenantId), duration: 0 },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError when duration is negative", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);

    await expect(
      createMenu({
        container,
        headers,
        input: { ...validInput(tenantId), duration: -30 },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should set sortOrder to end when tenant has existing menus", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);

    await createMenu({
      container,
      headers,
      input: { ...validInput(tenantId), name: "Menu A" },
    });
    await createMenu({
      container,
      headers,
      input: { ...validInput(tenantId), name: "Menu B" },
    });
    const result = await createMenu({
      container,
      headers,
      input: { ...validInput(tenantId), name: "Menu C" },
    });

    const menus = await container.menuRepository.findByTenantId(
      tenantId as never,
    );
    const createdMenu = menus.find((m) => m.id === result.id);
    expect(createdMenu).toBeDefined();
    expect(createdMenu?.sortOrder).toBe(3);
  });

  it("should set sortOrder to 1 when tenant has no menus", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);

    const result = await createMenu({
      container,
      headers,
      input: validInput(tenantId),
    });

    const menus = await container.menuRepository.findByTenantId(
      tenantId as never,
    );
    const createdMenu = menus.find((m) => m.id === result.id);
    expect(createdMenu).toBeDefined();
    expect(createdMenu?.sortOrder).toBe(1);
  });

  it("should create a menu with price 0 (free menu)", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);

    const result = await createMenu({
      container,
      headers,
      input: { ...validInput(tenantId), price: 0 },
    });

    expect(result.id).toBeDefined();

    const menus = await container.menuRepository.findByTenantId(
      tenantId as never,
    );
    expect(menus[0].price).toBe(0);
  });

  it("should throw BusinessRuleError when price is negative", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);

    await expect(
      createMenu({
        container,
        headers,
        input: { ...validInput(tenantId), price: -100 },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError when name is empty", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);

    await expect(
      createMenu({
        container,
        headers,
        input: { ...validInput(tenantId), name: "" },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw an error when tenantId does not exist", async () => {
    const container = getContainer();
    const nonExistentTenantId = uuidv7();

    // The menu is created in the application layer but should fail at the DB level
    // because of the foreign key constraint on tenantId
    await expect(
      createMenu({
        container,
        headers,
        input: validInput(nonExistentTenantId),
      }),
    ).rejects.toThrow();
  });
});
