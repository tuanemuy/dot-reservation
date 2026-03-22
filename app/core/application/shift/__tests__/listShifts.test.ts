import { v7 as uuidv7 } from "uuid";
import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { createMockHeaders, setupTestContainer } from "../../__tests__/helpers";
import { createShift } from "../createShift";
import { listShifts } from "../listShifts";

const getContainer = setupTestContainer();

// ============================================
// Helpers
// ============================================

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
    name: "Test Staff",
    email: `staff-${id}@example.com`,
    role: "staff",
    joinedAt: new Date(),
    ...overrides,
  });
  return id;
}

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
    displayName: "Test Staff",
    ...overrides,
  });
  return id;
}

async function setupStaff(db: ReturnType<typeof getContainer>["db"]) {
  const tenantId = await insertTenant(db);
  const memberId = await insertMember(db, tenantId);
  const staffProfileId = await insertStaffProfile(db, tenantId, memberId);
  return { tenantId, memberId, staffProfileId };
}

async function setupMultipleStaff(
  db: ReturnType<typeof getContainer>["db"],
  tenantId: string,
) {
  const memberId1 = await insertMember(db, tenantId);
  const staffProfileId1 = await insertStaffProfile(db, tenantId, memberId1);
  const memberId2 = await insertMember(db, tenantId);
  const staffProfileId2 = await insertStaffProfile(db, tenantId, memberId2);
  return { staffProfileId1, staffProfileId2 };
}

const MONDAY_DATE = "2026-03-23";
const TUESDAY_DATE = "2026-03-24";
const WEDNESDAY_DATE = "2026-03-25";

describe("listShifts", () => {
  const headers = createMockHeaders();

  it("should return all shifts within the date range for a tenant", async () => {
    const container = getContainer();
    const { tenantId } = await setupStaff(container.db);
    const { staffProfileId1, staffProfileId2 } = await setupMultipleStaff(
      container.db,
      tenantId,
    );

    await createShift({
      container,
      headers,
      input: {
        tenantId,
        staffProfileId: staffProfileId1,
        date: MONDAY_DATE,
        startTime: "09:00",
        endTime: "12:00",
        recurring: false,
        recurringEndDate: null,
      },
    });

    await createShift({
      container,
      headers,
      input: {
        tenantId,
        staffProfileId: staffProfileId2,
        date: TUESDAY_DATE,
        startTime: "10:00",
        endTime: "15:00",
        recurring: false,
        recurringEndDate: null,
      },
    });

    const result = await listShifts({
      container,
      headers,
      input: {
        tenantId,
        startDate: MONDAY_DATE,
        endDate: WEDNESDAY_DATE,
        staffProfileId: null,
      },
    });

    expect(result.items).toHaveLength(2);
  });

  it("should filter shifts by staffProfileId", async () => {
    const container = getContainer();
    const { tenantId } = await setupStaff(container.db);
    const { staffProfileId1, staffProfileId2 } = await setupMultipleStaff(
      container.db,
      tenantId,
    );

    await createShift({
      container,
      headers,
      input: {
        tenantId,
        staffProfileId: staffProfileId1,
        date: MONDAY_DATE,
        startTime: "09:00",
        endTime: "12:00",
        recurring: false,
        recurringEndDate: null,
      },
    });

    await createShift({
      container,
      headers,
      input: {
        tenantId,
        staffProfileId: staffProfileId2,
        date: TUESDAY_DATE,
        startTime: "10:00",
        endTime: "15:00",
        recurring: false,
        recurringEndDate: null,
      },
    });

    const result = await listShifts({
      container,
      headers,
      input: {
        tenantId,
        startDate: MONDAY_DATE,
        endDate: WEDNESDAY_DATE,
        staffProfileId: staffProfileId1,
      },
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].staffProfileId).toBe(staffProfileId1);
  });

  it("should return empty array when shifts are outside the date range", async () => {
    const container = getContainer();
    const { tenantId, staffProfileId } = await setupStaff(container.db);

    await createShift({
      container,
      headers,
      input: {
        tenantId,
        staffProfileId,
        date: MONDAY_DATE,
        startTime: "09:00",
        endTime: "12:00",
        recurring: false,
        recurringEndDate: null,
      },
    });

    const result = await listShifts({
      container,
      headers,
      input: {
        tenantId,
        startDate: "2026-04-01",
        endDate: "2026-04-30",
        staffProfileId: null,
      },
    });

    expect(result.items).toHaveLength(0);
  });

  it("should return empty array when no shifts are registered", async () => {
    const container = getContainer();
    const { tenantId } = await setupStaff(container.db);

    const result = await listShifts({
      container,
      headers,
      input: {
        tenantId,
        startDate: MONDAY_DATE,
        endDate: WEDNESDAY_DATE,
        staffProfileId: null,
      },
    });

    expect(result.items).toHaveLength(0);
  });

  it("should return all staff shifts when staffProfileId is null", async () => {
    const container = getContainer();
    const { tenantId } = await setupStaff(container.db);
    const { staffProfileId1, staffProfileId2 } = await setupMultipleStaff(
      container.db,
      tenantId,
    );

    await createShift({
      container,
      headers,
      input: {
        tenantId,
        staffProfileId: staffProfileId1,
        date: MONDAY_DATE,
        startTime: "09:00",
        endTime: "12:00",
        recurring: false,
        recurringEndDate: null,
      },
    });

    await createShift({
      container,
      headers,
      input: {
        tenantId,
        staffProfileId: staffProfileId2,
        date: TUESDAY_DATE,
        startTime: "10:00",
        endTime: "15:00",
        recurring: false,
        recurringEndDate: null,
      },
    });

    const result = await listShifts({
      container,
      headers,
      input: {
        tenantId,
        startDate: MONDAY_DATE,
        endDate: WEDNESDAY_DATE,
        staffProfileId: null,
      },
    });

    expect(result.items).toHaveLength(2);
  });

  it("should include boundary date shifts (startDate and endDate)", async () => {
    const container = getContainer();
    const { tenantId, staffProfileId } = await setupStaff(container.db);

    await createShift({
      container,
      headers,
      input: {
        tenantId,
        staffProfileId,
        date: MONDAY_DATE,
        startTime: "09:00",
        endTime: "12:00",
        recurring: false,
        recurringEndDate: null,
      },
    });

    await createShift({
      container,
      headers,
      input: {
        tenantId,
        staffProfileId,
        date: WEDNESDAY_DATE,
        startTime: "09:00",
        endTime: "12:00",
        recurring: false,
        recurringEndDate: null,
      },
    });

    const result = await listShifts({
      container,
      headers,
      input: {
        tenantId,
        startDate: MONDAY_DATE,
        endDate: WEDNESDAY_DATE,
        staffProfileId: null,
      },
    });

    expect(result.items).toHaveLength(2);
    const dates = result.items.map((i) => i.date);
    expect(dates).toContain(MONDAY_DATE);
    expect(dates).toContain(WEDNESDAY_DATE);
  });

  it("should only return shifts for the specified tenant", async () => {
    const container = getContainer();
    const { tenantId: tenantIdA, staffProfileId: spA } = await setupStaff(
      container.db,
    );
    const { tenantId: tenantIdB, staffProfileId: spB } = await setupStaff(
      container.db,
    );

    await createShift({
      container,
      headers,
      input: {
        tenantId: tenantIdA,
        staffProfileId: spA,
        date: MONDAY_DATE,
        startTime: "09:00",
        endTime: "12:00",
        recurring: false,
        recurringEndDate: null,
      },
    });

    await createShift({
      container,
      headers,
      input: {
        tenantId: tenantIdB,
        staffProfileId: spB,
        date: MONDAY_DATE,
        startTime: "09:00",
        endTime: "12:00",
        recurring: false,
        recurringEndDate: null,
      },
    });

    const result = await listShifts({
      container,
      headers,
      input: {
        tenantId: tenantIdA,
        startDate: MONDAY_DATE,
        endDate: WEDNESDAY_DATE,
        staffProfileId: null,
      },
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].tenantId).toBe(tenantIdA);
  });

  it("should return shifts in ShiftDetail format", async () => {
    const container = getContainer();
    const { tenantId, staffProfileId } = await setupStaff(container.db);

    await createShift({
      container,
      headers,
      input: {
        tenantId,
        staffProfileId,
        date: MONDAY_DATE,
        startTime: "09:00",
        endTime: "17:00",
        recurring: false,
        recurringEndDate: null,
      },
    });

    const result = await listShifts({
      container,
      headers,
      input: {
        tenantId,
        startDate: MONDAY_DATE,
        endDate: MONDAY_DATE,
        staffProfileId: null,
      },
    });

    expect(result.items).toHaveLength(1);
    const item = result.items[0];
    expect(item.id).toBeDefined();
    expect(item.tenantId).toBe(tenantId);
    expect(item.staffProfileId).toBe(staffProfileId);
    expect(item.date).toBe(MONDAY_DATE);
    expect(item.startTime).toBe("09:00");
    expect(item.endTime).toBe("17:00");
    expect(item.recurringGroupId).toBeNull();
    expect(item.createdAt).toBeInstanceOf(Date);
    expect(item.updatedAt).toBeInstanceOf(Date);
  });

  it("should include both recurring and single shifts in the list", async () => {
    const container = getContainer();
    const { tenantId, staffProfileId } = await setupStaff(container.db);

    // Create a recurring shift on Monday (2 weeks)
    await createShift({
      container,
      headers,
      input: {
        tenantId,
        staffProfileId,
        date: MONDAY_DATE,
        startTime: "09:00",
        endTime: "12:00",
        recurring: true,
        recurringEndDate: "2026-03-30",
      },
    });

    // Create a single shift on Tuesday
    await createShift({
      container,
      headers,
      input: {
        tenantId,
        staffProfileId,
        date: TUESDAY_DATE,
        startTime: "14:00",
        endTime: "17:00",
        recurring: false,
        recurringEndDate: null,
      },
    });

    const result = await listShifts({
      container,
      headers,
      input: {
        tenantId,
        startDate: MONDAY_DATE,
        endDate: "2026-03-31",
        staffProfileId: null,
      },
    });

    expect(result.items).toHaveLength(3);
    const recurringShifts = result.items.filter(
      (i) => i.recurringGroupId !== null,
    );
    const singleShifts = result.items.filter(
      (i) => i.recurringGroupId === null,
    );
    expect(recurringShifts).toHaveLength(2);
    expect(singleShifts).toHaveLength(1);
  });
});
