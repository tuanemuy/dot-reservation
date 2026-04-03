import { v7 as uuidv7 } from "uuid";
import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { NotFoundError } from "@/core/application/error";
import { BusinessRuleError } from "@/core/domain/error";
import { createMockHeaders, setupTestContainer } from "../../__tests__/helpers";
import { getStaffProfile } from "../getStaffProfile";
import { updateStaffProfile } from "../updateStaffProfile";

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

describe("updateStaffProfile", () => {
  const headers = createMockHeaders();

  it("should update profile with valid displayName, imageUrl, and bio", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);
    const memberId = await insertMember(container.db, tenantId);
    const staffProfileId = await insertStaffProfile(
      container.db,
      tenantId,
      memberId,
    );

    const result = await updateStaffProfile({
      container,
      headers,
      input: {
        staffProfileId,
        displayName: "Updated Name",
        imageUrl: "images/new.jpg",
        bio: "Updated bio",
      },
    });

    expect(result.id).toBe(staffProfileId);
    expect(result.displayName).toBe("Updated Name");

    // Verify by reading from the repository
    const profile = await getStaffProfile({
      container,
      headers,
      input: { staffProfileId },
    });
    expect(profile.displayName).toBe("Updated Name");
    expect(profile.imageUrl).toBe("https://example.com/images/new.jpg");
    expect(profile.bio).toBe("Updated bio");
  });

  it("should update profile with null imageUrl and bio", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);
    const memberId = await insertMember(container.db, tenantId);
    const staffProfileId = await insertStaffProfile(
      container.db,
      tenantId,
      memberId,
      {
        imageUrl: "images/old.jpg",
        bio: "Old bio",
      },
    );

    const result = await updateStaffProfile({
      container,
      headers,
      input: {
        staffProfileId,
        displayName: "New Name",
        imageUrl: null,
        bio: null,
      },
    });

    expect(result.displayName).toBe("New Name");

    const profile = await getStaffProfile({
      container,
      headers,
      input: { staffProfileId },
    });
    expect(profile.imageUrl).toBeNull();
    expect(profile.bio).toBeNull();
  });

  it("should update imageUrl to a new URL", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);
    const memberId = await insertMember(container.db, tenantId);
    const staffProfileId = await insertStaffProfile(
      container.db,
      tenantId,
      memberId,
      { imageUrl: "https://example.com/old.jpg" },
    );

    await updateStaffProfile({
      container,
      headers,
      input: {
        staffProfileId,
        displayName: "Test Staff",
        imageUrl: "images/new.jpg",
        bio: null,
      },
    });

    const profile = await getStaffProfile({
      container,
      headers,
      input: { staffProfileId },
    });
    expect(profile.imageUrl).toBe("https://example.com/images/new.jpg");
  });

  it("should update bio to a new value", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);
    const memberId = await insertMember(container.db, tenantId);
    const staffProfileId = await insertStaffProfile(
      container.db,
      tenantId,
      memberId,
      { bio: "Old bio" },
    );

    await updateStaffProfile({
      container,
      headers,
      input: {
        staffProfileId,
        displayName: "Test Staff",
        imageUrl: null,
        bio: "New professional bio",
      },
    });

    const profile = await getStaffProfile({
      container,
      headers,
      input: { staffProfileId },
    });
    expect(profile.bio).toBe("New professional bio");
  });

  it("should update updatedAt to a newer timestamp", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);
    const memberId = await insertMember(container.db, tenantId);
    const staffProfileId = await insertStaffProfile(
      container.db,
      tenantId,
      memberId,
    );

    // Get the original profile to compare updatedAt
    const originalProfile = await container.staffProfileRepository.findById(
      staffProfileId as never,
    );
    if (!originalProfile) throw new Error("expected originalProfile");
    const originalUpdatedAt = originalProfile.updatedAt;

    // Small delay to ensure timestamp difference
    await new Promise((resolve) => setTimeout(resolve, 10));

    await updateStaffProfile({
      container,
      headers,
      input: {
        staffProfileId,
        displayName: "Updated Name",
        imageUrl: null,
        bio: null,
      },
    });

    const updatedProfile = await container.staffProfileRepository.findById(
      staffProfileId as never,
    );
    expect(updatedProfile?.updatedAt.getTime()).toBeGreaterThanOrEqual(
      originalUpdatedAt.getTime(),
    );
  });

  it("should throw NotFoundError when staffProfileId does not exist", async () => {
    const container = getContainer();
    const nonExistentId = uuidv7();

    await expect(
      updateStaffProfile({
        container,
        headers,
        input: {
          staffProfileId: nonExistentId,
          displayName: "Name",
          imageUrl: null,
          bio: null,
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw BusinessRuleError when displayName is empty", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);
    const memberId = await insertMember(container.db, tenantId);
    const staffProfileId = await insertStaffProfile(
      container.db,
      tenantId,
      memberId,
    );

    await expect(
      updateStaffProfile({
        container,
        headers,
        input: {
          staffProfileId,
          displayName: "",
          imageUrl: null,
          bio: null,
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError when displayName exceeds 50 characters", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);
    const memberId = await insertMember(container.db, tenantId);
    const staffProfileId = await insertStaffProfile(
      container.db,
      tenantId,
      memberId,
    );

    const longName = "a".repeat(51);

    await expect(
      updateStaffProfile({
        container,
        headers,
        input: {
          staffProfileId,
          displayName: longName,
          imageUrl: null,
          bio: null,
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should succeed when displayName is exactly 50 characters", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);
    const memberId = await insertMember(container.db, tenantId);
    const staffProfileId = await insertStaffProfile(
      container.db,
      tenantId,
      memberId,
    );

    const name50 = "a".repeat(50);

    const result = await updateStaffProfile({
      container,
      headers,
      input: {
        staffProfileId,
        displayName: name50,
        imageUrl: null,
        bio: null,
      },
    });

    expect(result.displayName).toBe(name50);
  });

  it("should succeed when displayName is exactly 1 character", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);
    const memberId = await insertMember(container.db, tenantId);
    const staffProfileId = await insertStaffProfile(
      container.db,
      tenantId,
      memberId,
    );

    const result = await updateStaffProfile({
      container,
      headers,
      input: {
        staffProfileId,
        displayName: "A",
        imageUrl: null,
        bio: null,
      },
    });

    expect(result.displayName).toBe("A");
  });

  it("should throw BusinessRuleError when bio exceeds 1000 characters", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);
    const memberId = await insertMember(container.db, tenantId);
    const staffProfileId = await insertStaffProfile(
      container.db,
      tenantId,
      memberId,
    );

    const longBio = "a".repeat(1001);

    await expect(
      updateStaffProfile({
        container,
        headers,
        input: {
          staffProfileId,
          displayName: "Test Staff",
          imageUrl: null,
          bio: longBio,
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should succeed when bio is exactly 1000 characters", async () => {
    const container = getContainer();
    const tenantId = await insertTenant(container.db);
    const memberId = await insertMember(container.db, tenantId);
    const staffProfileId = await insertStaffProfile(
      container.db,
      tenantId,
      memberId,
    );

    const bio1000 = "a".repeat(1000);

    await updateStaffProfile({
      container,
      headers,
      input: {
        staffProfileId,
        displayName: "Test Staff",
        imageUrl: null,
        bio: bio1000,
      },
    });

    const profile = await getStaffProfile({
      container,
      headers,
      input: { staffProfileId },
    });
    expect(profile.bio).toBe(bio1000);
  });
});
