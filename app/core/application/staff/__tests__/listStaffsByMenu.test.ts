import { v7 as uuidv7 } from "uuid";
import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { createMockHeaders, setupTestContainer } from "../../__tests__/helpers";
import { listStaffsByMenu } from "../listStaffsByMenu";

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

describe("listStaffsByMenu", () => {
  const headers = createMockHeaders();

  it("should return multiple staff who handle the specified menu", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);
    const menuId = await insertMenu(container.db, tenantId, { name: "Cut" });

    const member1 = await insertMember(container.db, tenantId);
    const member2 = await insertMember(container.db, tenantId);
    const staff1 = await insertStaffProfile(container.db, tenantId, member1, {
      displayName: "Alice",
    });
    const staff2 = await insertStaffProfile(container.db, tenantId, member2, {
      displayName: "Bob",
    });
    await assignMenus(container.db, staff1, [menuId]);
    await assignMenus(container.db, staff2, [menuId]);

    const result = await listStaffsByMenu({
      container,
      headers,
      input: { tenantId, menuId },
    });

    expect(result.items).toHaveLength(2);
    const names = result.items.map((item) => item.displayName);
    expect(names).toContain("Alice");
    expect(names).toContain("Bob");
  });

  it("should return empty items when no staff handle the specified menu", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);
    const menuId = await insertMenu(container.db, tenantId, { name: "Cut" });
    const otherMenuId = await insertMenu(container.db, tenantId, {
      name: "Color",
      sortOrder: 2,
    });

    const member1 = await insertMember(container.db, tenantId);
    const staff1 = await insertStaffProfile(container.db, tenantId, member1);
    // Staff only handles "Color", not "Cut"
    await assignMenus(container.db, staff1, [otherMenuId]);

    const result = await listStaffsByMenu({
      container,
      headers,
      input: { tenantId, menuId },
    });

    expect(result.items).toEqual([]);
  });

  it("should return a single staff when only one handles the menu", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);
    const menuId = await insertMenu(container.db, tenantId, { name: "Cut" });

    const member1 = await insertMember(container.db, tenantId);
    const staff1 = await insertStaffProfile(container.db, tenantId, member1, {
      displayName: "Alice",
    });
    await assignMenus(container.db, staff1, [menuId]);

    const result = await listStaffsByMenu({
      container,
      headers,
      input: { tenantId, menuId },
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].displayName).toBe("Alice");
  });

  it("should return only staff who handle the specified menu, not others", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);
    const menuCut = await insertMenu(container.db, tenantId, {
      name: "Cut",
      sortOrder: 1,
    });
    const menuColor = await insertMenu(container.db, tenantId, {
      name: "Color",
      sortOrder: 2,
    });

    const member1 = await insertMember(container.db, tenantId);
    const member2 = await insertMember(container.db, tenantId);
    const member3 = await insertMember(container.db, tenantId);
    const staff1 = await insertStaffProfile(container.db, tenantId, member1, {
      displayName: "Alice",
    });
    const staff2 = await insertStaffProfile(container.db, tenantId, member2, {
      displayName: "Bob",
    });
    const staff3 = await insertStaffProfile(container.db, tenantId, member3, {
      displayName: "Charlie",
    });

    // Alice handles Cut and Color
    await assignMenus(container.db, staff1, [menuCut, menuColor]);
    // Bob handles only Color
    await assignMenus(container.db, staff2, [menuColor]);
    // Charlie handles only Cut
    await assignMenus(container.db, staff3, [menuCut]);

    const result = await listStaffsByMenu({
      container,
      headers,
      input: { tenantId, menuId: menuCut },
    });

    expect(result.items).toHaveLength(2);
    const names = result.items.map((item) => item.displayName);
    expect(names).toContain("Alice");
    expect(names).toContain("Charlie");
    expect(names).not.toContain("Bob");
  });

  it("should return only staff from the specified tenant", async () => {
    const container = getContainer();
    const tenantIdA = await insertTenant(container.db);
    const tenantIdB = await insertTenant(container.db);
    const menuIdA = await insertMenu(container.db, tenantIdA, { name: "Cut" });
    const menuIdB = await insertMenu(container.db, tenantIdB, { name: "Cut" });

    const memberA = await insertMember(container.db, tenantIdA);
    const memberB = await insertMember(container.db, tenantIdB);
    const staffA = await insertStaffProfile(container.db, tenantIdA, memberA, {
      displayName: "Tenant A Staff",
    });
    const staffB = await insertStaffProfile(container.db, tenantIdB, memberB, {
      displayName: "Tenant B Staff",
    });
    await assignMenus(container.db, staffA, [menuIdA]);
    await assignMenus(container.db, staffB, [menuIdB]);

    const result = await listStaffsByMenu({
      container,
      headers,
      input: { tenantId: tenantIdA, menuId: menuIdA },
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].displayName).toBe("Tenant A Staff");
  });

  it("should return empty items when staff have no assigned menus", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);
    const menuId = await insertMenu(container.db, tenantId, { name: "Cut" });

    const member1 = await insertMember(container.db, tenantId);
    // Staff exists but has no assigned menus
    await insertStaffProfile(container.db, tenantId, member1, {
      displayName: "Alice",
    });

    const result = await listStaffsByMenu({
      container,
      headers,
      input: { tenantId, menuId },
    });

    expect(result.items).toEqual([]);
  });
});
