import { v7 as uuidv7 } from "uuid";
import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { NotFoundError } from "@/core/application/error";
import { createMockHeaders, setupTestContainer } from "../../__tests__/helpers";
import { getStaffProfile } from "../getStaffProfile";
import { updateAssignedMenus } from "../updateAssignedMenus";

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

describe("updateAssignedMenus", () => {
  const headers = createMockHeaders();

  it("should assign multiple menus to a staff profile", async () => {
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

    await updateAssignedMenus({
      container,
      headers,
      input: { staffProfileId, menuIds: [menuId1, menuId2] },
    });

    const profile = await getStaffProfile({
      container,
      headers,
      input: { staffProfileId },
    });
    expect(profile.assignedMenus).toHaveLength(2);
    const menuNames = profile.assignedMenus.map((m) => m.name);
    expect(menuNames).toContain("Cut");
    expect(menuNames).toContain("Color");
  });

  it("should set assigned menus to empty when menuIds is empty array", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);
    const memberId = await insertMember(container.db, tenantId);
    const staffProfileId = await insertStaffProfile(
      container.db,
      tenantId,
      memberId,
    );
    const menuId = await insertMenu(container.db, tenantId, { name: "Cut" });
    await assignMenus(container.db, staffProfileId, [menuId]);

    await updateAssignedMenus({
      container,
      headers,
      input: { staffProfileId, menuIds: [] },
    });

    const profile = await getStaffProfile({
      container,
      headers,
      input: { staffProfileId },
    });
    expect(profile.assignedMenus).toEqual([]);
  });

  it("should overwrite previous assignments with new ones", async () => {
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

    // Initially assign Cut and Color
    await updateAssignedMenus({
      container,
      headers,
      input: { staffProfileId, menuIds: [menuId1, menuId2] },
    });

    // Re-assign to Perm only
    await updateAssignedMenus({
      container,
      headers,
      input: { staffProfileId, menuIds: [menuId3] },
    });

    const profile = await getStaffProfile({
      container,
      headers,
      input: { staffProfileId },
    });
    expect(profile.assignedMenus).toHaveLength(1);
    expect(profile.assignedMenus[0].name).toBe("Perm");
  });

  it("should throw NotFoundError when menuIds contains a non-existent menu", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);
    const memberId = await insertMember(container.db, tenantId);
    const staffProfileId = await insertStaffProfile(
      container.db,
      tenantId,
      memberId,
    );
    const validMenuId = await insertMenu(container.db, tenantId, {
      name: "Cut",
    });
    const nonExistentMenuId = uuidv7();

    await expect(
      updateAssignedMenus({
        container,
        headers,
        input: {
          staffProfileId,
          menuIds: [validMenuId, nonExistentMenuId],
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw NotFoundError when all menuIds are non-existent", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);
    const memberId = await insertMember(container.db, tenantId);
    const staffProfileId = await insertStaffProfile(
      container.db,
      tenantId,
      memberId,
    );

    await expect(
      updateAssignedMenus({
        container,
        headers,
        input: {
          staffProfileId,
          menuIds: [uuidv7(), uuidv7()],
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw NotFoundError when staffProfileId does not exist", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);
    const menuId = await insertMenu(container.db, tenantId, { name: "Cut" });
    const nonExistentStaffProfileId = uuidv7();

    await expect(
      updateAssignedMenus({
        container,
        headers,
        input: {
          staffProfileId: nonExistentStaffProfileId,
          menuIds: [menuId],
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should assign a single menu correctly", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);
    const memberId = await insertMember(container.db, tenantId);
    const staffProfileId = await insertStaffProfile(
      container.db,
      tenantId,
      memberId,
    );
    const menuId = await insertMenu(container.db, tenantId, { name: "Cut" });

    await updateAssignedMenus({
      container,
      headers,
      input: { staffProfileId, menuIds: [menuId] },
    });

    const profile = await getStaffProfile({
      container,
      headers,
      input: { staffProfileId },
    });
    expect(profile.assignedMenus).toHaveLength(1);
    expect(profile.assignedMenus[0].name).toBe("Cut");
  });

  it("should be idempotent when setting the same menus again", async () => {
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

    // Set menus
    await updateAssignedMenus({
      container,
      headers,
      input: { staffProfileId, menuIds: [menuId1, menuId2] },
    });

    // Set the same menus again
    await updateAssignedMenus({
      container,
      headers,
      input: { staffProfileId, menuIds: [menuId1, menuId2] },
    });

    const profile = await getStaffProfile({
      container,
      headers,
      input: { staffProfileId },
    });
    expect(profile.assignedMenus).toHaveLength(2);
  });

  it("should throw an error when menuIds contains duplicates", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);
    const memberId = await insertMember(container.db, tenantId);
    const staffProfileId = await insertStaffProfile(
      container.db,
      tenantId,
      memberId,
    );
    const menuId = await insertMenu(container.db, tenantId, { name: "Cut" });

    // Pass the same menuId twice - should throw due to UNIQUE constraint
    await expect(
      updateAssignedMenus({
        container,
        headers,
        input: { staffProfileId, menuIds: [menuId, menuId] },
      }),
    ).rejects.toThrow();
  });
});
