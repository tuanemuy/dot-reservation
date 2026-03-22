import { v7 as uuidv7 } from "uuid";
import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { createMockHeaders, setupTestContainer } from "../../__tests__/helpers";
import { listShiftRequests } from "../listShiftRequests";
import { submitShiftRequests } from "../submitShiftRequests";

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

describe("listShiftRequests", () => {
  const headers = createMockHeaders();

  it("should return all shift requests within the date range for a tenant", async () => {
    const container = getContainer();
    const { tenantId } = await setupStaff(container.db);
    const { staffProfileId1, staffProfileId2 } = await setupMultipleStaff(
      container.db,
      tenantId,
    );

    await submitShiftRequests({
      container,
      headers,
      input: {
        staffProfileId: staffProfileId1,
        tenantId,
        requests: [
          {
            date: "2026-03-23",
            type: "work",
            startTime: "09:00",
            endTime: "17:00",
          },
        ],
      },
    });

    await submitShiftRequests({
      container,
      headers,
      input: {
        staffProfileId: staffProfileId2,
        tenantId,
        requests: [
          {
            date: "2026-03-24",
            type: "work",
            startTime: "10:00",
            endTime: "16:00",
          },
        ],
      },
    });

    const result = await listShiftRequests({
      container,
      headers,
      input: {
        tenantId,
        startDate: "2026-03-23",
        endDate: "2026-03-25",
        staffProfileId: null,
      },
    });

    expect(result.items).toHaveLength(2);
  });

  it("should filter shift requests by staffProfileId", async () => {
    const container = getContainer();
    const { tenantId } = await setupStaff(container.db);
    const { staffProfileId1, staffProfileId2 } = await setupMultipleStaff(
      container.db,
      tenantId,
    );

    await submitShiftRequests({
      container,
      headers,
      input: {
        staffProfileId: staffProfileId1,
        tenantId,
        requests: [
          {
            date: "2026-03-23",
            type: "work",
            startTime: "09:00",
            endTime: "17:00",
          },
        ],
      },
    });

    await submitShiftRequests({
      container,
      headers,
      input: {
        staffProfileId: staffProfileId2,
        tenantId,
        requests: [
          {
            date: "2026-03-24",
            type: "work",
            startTime: "10:00",
            endTime: "16:00",
          },
        ],
      },
    });

    const result = await listShiftRequests({
      container,
      headers,
      input: {
        tenantId,
        startDate: "2026-03-23",
        endDate: "2026-03-25",
        staffProfileId: staffProfileId1,
      },
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].staffProfileId).toBe(staffProfileId1);
  });

  it("should return empty array when shift requests are outside the date range", async () => {
    const container = getContainer();
    const { tenantId, staffProfileId } = await setupStaff(container.db);

    await submitShiftRequests({
      container,
      headers,
      input: {
        staffProfileId,
        tenantId,
        requests: [
          {
            date: "2026-03-23",
            type: "work",
            startTime: "09:00",
            endTime: "17:00",
          },
        ],
      },
    });

    const result = await listShiftRequests({
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

  it("should return empty array when no shift requests are submitted", async () => {
    const container = getContainer();
    const { tenantId } = await setupStaff(container.db);

    const result = await listShiftRequests({
      container,
      headers,
      input: {
        tenantId,
        startDate: "2026-03-23",
        endDate: "2026-03-25",
        staffProfileId: null,
      },
    });

    expect(result.items).toHaveLength(0);
  });

  it("should return all staff shift requests when staffProfileId is null", async () => {
    const container = getContainer();
    const { tenantId } = await setupStaff(container.db);
    const { staffProfileId1, staffProfileId2 } = await setupMultipleStaff(
      container.db,
      tenantId,
    );

    await submitShiftRequests({
      container,
      headers,
      input: {
        staffProfileId: staffProfileId1,
        tenantId,
        requests: [
          {
            date: "2026-03-23",
            type: "work",
            startTime: "09:00",
            endTime: "17:00",
          },
        ],
      },
    });

    await submitShiftRequests({
      container,
      headers,
      input: {
        staffProfileId: staffProfileId2,
        tenantId,
        requests: [
          {
            date: "2026-03-24",
            type: "off",
          },
        ],
      },
    });

    const result = await listShiftRequests({
      container,
      headers,
      input: {
        tenantId,
        startDate: "2026-03-23",
        endDate: "2026-03-25",
        staffProfileId: null,
      },
    });

    expect(result.items).toHaveLength(2);
  });

  it("should include boundary date shift requests", async () => {
    const container = getContainer();
    const { tenantId, staffProfileId } = await setupStaff(container.db);

    await submitShiftRequests({
      container,
      headers,
      input: {
        staffProfileId,
        tenantId,
        requests: [
          {
            date: "2026-03-23",
            type: "work",
            startTime: "09:00",
            endTime: "17:00",
          },
          {
            date: "2026-03-25",
            type: "work",
            startTime: "09:00",
            endTime: "17:00",
          },
        ],
      },
    });

    const result = await listShiftRequests({
      container,
      headers,
      input: {
        tenantId,
        startDate: "2026-03-23",
        endDate: "2026-03-25",
        staffProfileId: null,
      },
    });

    expect(result.items).toHaveLength(2);
    const dates = result.items.map((i) => i.date);
    expect(dates).toContain("2026-03-23");
    expect(dates).toContain("2026-03-25");
  });

  it("should only return shift requests for the specified tenant", async () => {
    const container = getContainer();
    const { tenantId: tenantIdA, staffProfileId: spA } = await setupStaff(
      container.db,
    );
    const { tenantId: tenantIdB, staffProfileId: spB } = await setupStaff(
      container.db,
    );

    await submitShiftRequests({
      container,
      headers,
      input: {
        staffProfileId: spA,
        tenantId: tenantIdA,
        requests: [
          {
            date: "2026-03-23",
            type: "work",
            startTime: "09:00",
            endTime: "17:00",
          },
        ],
      },
    });

    await submitShiftRequests({
      container,
      headers,
      input: {
        staffProfileId: spB,
        tenantId: tenantIdB,
        requests: [
          {
            date: "2026-03-23",
            type: "work",
            startTime: "09:00",
            endTime: "17:00",
          },
        ],
      },
    });

    const result = await listShiftRequests({
      container,
      headers,
      input: {
        tenantId: tenantIdA,
        startDate: "2026-03-23",
        endDate: "2026-03-25",
        staffProfileId: null,
      },
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].tenantId).toBe(tenantIdA);
  });

  it("should include both work and off shift requests", async () => {
    const container = getContainer();
    const { tenantId, staffProfileId } = await setupStaff(container.db);

    await submitShiftRequests({
      container,
      headers,
      input: {
        staffProfileId,
        tenantId,
        requests: [
          {
            date: "2026-03-23",
            type: "work",
            startTime: "09:00",
            endTime: "17:00",
          },
          {
            date: "2026-03-24",
            type: "off",
          },
        ],
      },
    });

    const result = await listShiftRequests({
      container,
      headers,
      input: {
        tenantId,
        startDate: "2026-03-23",
        endDate: "2026-03-25",
        staffProfileId: null,
      },
    });

    expect(result.items).toHaveLength(2);
    const types = result.items.map((i) => i.type).sort();
    expect(types).toEqual(["off", "work"]);
  });

  it("should return shift requests in ShiftRequestDetail format", async () => {
    const container = getContainer();
    const { tenantId, staffProfileId } = await setupStaff(container.db);

    await submitShiftRequests({
      container,
      headers,
      input: {
        staffProfileId,
        tenantId,
        requests: [
          {
            date: "2026-03-23",
            type: "work",
            startTime: "09:00",
            endTime: "17:00",
            note: "Test note",
          },
        ],
      },
    });

    const result = await listShiftRequests({
      container,
      headers,
      input: {
        tenantId,
        startDate: "2026-03-23",
        endDate: "2026-03-23",
        staffProfileId: null,
      },
    });

    expect(result.items).toHaveLength(1);
    const item = result.items[0];
    expect(item.id).toBeDefined();
    expect(item.tenantId).toBe(tenantId);
    expect(item.staffProfileId).toBe(staffProfileId);
    expect(item.date).toBe("2026-03-23");
    expect(item.type).toBe("work");
    expect(item.startTime).toBe("09:00");
    expect(item.endTime).toBe("17:00");
    expect(item.note).toBe("Test note");
    expect(item.createdAt).toBeInstanceOf(Date);
    expect(item.updatedAt).toBeInstanceOf(Date);
  });
});
