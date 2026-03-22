import { v7 as uuidv7 } from "uuid";
import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { NotFoundError } from "@/core/application/error";
import { createMockHeaders, setupTestContainer } from "../../__tests__/helpers";
import { getStaffProfile } from "../getStaffProfile";

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
 * Helper: Insert a member directly into the database.
 */
async function insertMember(
  db: ReturnType<typeof getContainer>["db"],
  tenantId: string,
  overrides: Partial<typeof schema.members.$inferInsert> = {},
) {
  const id = overrides.id ?? uuidv7();
  await db.insert(schema.members).values({
    id,
    tenantId,
    authUserId: overrides.authUserId ?? uuidv7(),
    name: overrides.name ?? "Test Staff",
    email: overrides.email ?? `staff-${id}@example.com`,
    phoneNumber: overrides.phoneNumber ?? null,
    role: overrides.role ?? "staff",
    joinedAt: overrides.joinedAt ?? new Date(),
    ...overrides,
  });
  return id;
}

/**
 * Helper: Insert a staff profile directly into the database.
 */
async function insertStaffProfile(
  db: ReturnType<typeof getContainer>["db"],
  tenantId: string,
  memberId: string,
  overrides: Partial<typeof schema.staffProfiles.$inferInsert> = {},
) {
  const id = overrides.id ?? uuidv7();
  await db.insert(schema.staffProfiles).values({
    id,
    tenantId,
    memberId,
    displayName: overrides.displayName ?? "Test Staff",
    imageUrl: overrides.imageUrl ?? null,
    bio: overrides.bio ?? null,
    ...overrides,
  });
  return id;
}

/**
 * Helper: Insert a menu directly into the database.
 */
async function insertMenu(
  db: ReturnType<typeof getContainer>["db"],
  tenantId: string,
  overrides: Partial<typeof schema.menus.$inferInsert> = {},
) {
  const id = overrides.id ?? uuidv7();
  await db.insert(schema.menus).values({
    id,
    tenantId,
    name: overrides.name ?? "Test Menu",
    category: overrides.category ?? "Hair",
    description: overrides.description ?? null,
    duration: overrides.duration ?? 30,
    price: overrides.price ?? 3000,
    sortOrder: overrides.sortOrder ?? 1,
    ...overrides,
  });
  return id;
}

/**
 * Helper: Assign menus to a staff profile.
 */
async function assignMenus(
  db: ReturnType<typeof getContainer>["db"],
  staffProfileId: string,
  menuIds: string[],
) {
  for (const menuId of menuIds) {
    await db.insert(schema.staffAssignedMenus).values({
      staffProfileId,
      menuId,
    });
  }
}

describe("getStaffProfile", () => {
  const headers = createMockHeaders();

  it("should return staff profile with assigned menus", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);
    const memberId = await insertMember(container.db, tenantId);
    const staffProfileId = await insertStaffProfile(
      container.db,
      tenantId,
      memberId,
      {
        displayName: "Alice",
        imageUrl: "https://example.com/alice.jpg",
        bio: "Experienced stylist",
      },
    );
    const menuId = await insertMenu(container.db, tenantId, { name: "Cut" });
    await assignMenus(container.db, staffProfileId, [menuId]);

    const result = await getStaffProfile({
      container,
      headers,
      input: { staffProfileId },
    });

    expect(result.id).toBe(staffProfileId);
    expect(result.displayName).toBe("Alice");
    expect(result.imageUrl).toBe("https://example.com/alice.jpg");
    expect(result.bio).toBe("Experienced stylist");
    expect(result.assignedMenus).toHaveLength(1);
    expect(result.assignedMenus[0].id).toBe(menuId);
    expect(result.assignedMenus[0].name).toBe("Cut");
  });

  it("should return empty assignedMenus when no menus are assigned", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);
    const memberId = await insertMember(container.db, tenantId);
    const staffProfileId = await insertStaffProfile(
      container.db,
      tenantId,
      memberId,
    );

    const result = await getStaffProfile({
      container,
      headers,
      input: { staffProfileId },
    });

    expect(result.id).toBe(staffProfileId);
    expect(result.assignedMenus).toEqual([]);
  });

  it("should return null imageUrl when not set", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);
    const memberId = await insertMember(container.db, tenantId);
    const staffProfileId = await insertStaffProfile(
      container.db,
      tenantId,
      memberId,
      { imageUrl: null },
    );

    const result = await getStaffProfile({
      container,
      headers,
      input: { staffProfileId },
    });

    expect(result.imageUrl).toBeNull();
  });

  it("should return null bio when not set", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);
    const memberId = await insertMember(container.db, tenantId);
    const staffProfileId = await insertStaffProfile(
      container.db,
      tenantId,
      memberId,
      { bio: null },
    );

    const result = await getStaffProfile({
      container,
      headers,
      input: { staffProfileId },
    });

    expect(result.bio).toBeNull();
  });

  it("should throw NotFoundError when staffProfileId does not exist", async () => {
    const container = getContainer();
    const nonExistentId = uuidv7();

    await expect(
      getStaffProfile({
        container,
        headers,
        input: { staffProfileId: nonExistentId },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should return multiple assigned menus correctly", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);
    const memberId = await insertMember(container.db, tenantId);
    const staffProfileId = await insertStaffProfile(
      container.db,
      tenantId,
      memberId,
    );
    const menuId1 = await insertMenu(container.db, tenantId, {
      name: "Cut",
      sortOrder: 1,
    });
    const menuId2 = await insertMenu(container.db, tenantId, {
      name: "Color",
      sortOrder: 2,
    });
    const menuId3 = await insertMenu(container.db, tenantId, {
      name: "Perm",
      sortOrder: 3,
    });
    await assignMenus(container.db, staffProfileId, [
      menuId1,
      menuId2,
      menuId3,
    ]);

    const result = await getStaffProfile({
      container,
      headers,
      input: { staffProfileId },
    });

    expect(result.assignedMenus).toHaveLength(3);
    const menuNames = result.assignedMenus.map((m) => m.name);
    expect(menuNames).toContain("Cut");
    expect(menuNames).toContain("Color");
    expect(menuNames).toContain("Perm");
  });
});
