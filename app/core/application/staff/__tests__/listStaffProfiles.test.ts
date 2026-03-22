import { v7 as uuidv7 } from "uuid";
import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { createMockHeaders, setupTestContainer } from "../../__tests__/helpers";
import { listStaffProfiles } from "../listStaffProfiles";

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

describe("listStaffProfiles", () => {
  const headers = createMockHeaders();

  it("should return multiple staff profiles for a tenant", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);
    const memberId1 = await insertMember(container.db, tenantId);
    const memberId2 = await insertMember(container.db, tenantId);
    const memberId3 = await insertMember(container.db, tenantId);
    await insertStaffProfile(container.db, tenantId, memberId1, {
      displayName: "Alice",
    });
    await insertStaffProfile(container.db, tenantId, memberId2, {
      displayName: "Bob",
    });
    await insertStaffProfile(container.db, tenantId, memberId3, {
      displayName: "Charlie",
    });

    const result = await listStaffProfiles({
      container,
      headers,
      input: { tenantId },
    });

    expect(result.items).toHaveLength(3);
    const names = result.items.map((item) => item.displayName);
    expect(names).toContain("Alice");
    expect(names).toContain("Bob");
    expect(names).toContain("Charlie");
  });

  it("should return empty items when tenant has no staff", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);

    const result = await listStaffProfiles({
      container,
      headers,
      input: { tenantId },
    });

    expect(result.items).toEqual([]);
  });

  it("should return a single staff profile when tenant has one staff", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);
    const memberId = await insertMember(container.db, tenantId);
    await insertStaffProfile(container.db, tenantId, memberId, {
      displayName: "Alice",
    });

    const result = await listStaffProfiles({
      container,
      headers,
      input: { tenantId },
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].displayName).toBe("Alice");
  });

  it("should return only staff from the specified tenant", async () => {
    const container = getContainer();
    const tenantIdA = await insertTenant(container.db);
    const tenantIdB = await insertTenant(container.db);
    const memberA1 = await insertMember(container.db, tenantIdA);
    const memberA2 = await insertMember(container.db, tenantIdA);
    const memberB1 = await insertMember(container.db, tenantIdB);
    await insertStaffProfile(container.db, tenantIdA, memberA1, {
      displayName: "Tenant A Staff 1",
    });
    await insertStaffProfile(container.db, tenantIdA, memberA2, {
      displayName: "Tenant A Staff 2",
    });
    await insertStaffProfile(container.db, tenantIdB, memberB1, {
      displayName: "Tenant B Staff 1",
    });

    const resultA = await listStaffProfiles({
      container,
      headers,
      input: { tenantId: tenantIdA },
    });

    expect(resultA.items).toHaveLength(2);
    for (const item of resultA.items) {
      expect(["Tenant A Staff 1", "Tenant A Staff 2"]).toContain(
        item.displayName,
      );
    }

    const resultB = await listStaffProfiles({
      container,
      headers,
      input: { tenantId: tenantIdB },
    });

    expect(resultB.items).toHaveLength(1);
    expect(resultB.items[0].displayName).toBe("Tenant B Staff 1");
  });

  it("should return StaffProfileSummary with correct fields", async () => {
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
      },
    );

    const result = await listStaffProfiles({
      container,
      headers,
      input: { tenantId },
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe(staffProfileId);
    expect(result.items[0].displayName).toBe("Alice");
    expect(result.items[0].imageUrl).toBe("https://example.com/alice.jpg");
  });
});
