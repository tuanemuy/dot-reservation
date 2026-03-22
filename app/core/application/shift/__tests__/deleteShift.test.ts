import { v7 as uuidv7 } from "uuid";
import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { NotFoundError } from "@/core/application/error";
import { createMockHeaders, setupTestContainer } from "../../__tests__/helpers";
import { createShift } from "../createShift";
import { deleteShift } from "../deleteShift";

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
    email: "staff@example.com",
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

const MONDAY_DATE = "2026-03-23";

describe("deleteShift", () => {
  const headers = createMockHeaders();

  it("should delete a single shift with deleteScope=single", async () => {
    const container = getContainer();
    const { tenantId, staffProfileId } = await setupStaff(container.db);

    const created = await createShift({
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

    await deleteShift({
      container,
      headers,
      input: {
        shiftId: created.shiftIds[0],
        deleteScope: "single",
      },
    });

    const shifts = await container.db.select().from(schema.shifts);
    expect(shifts).toHaveLength(0);
  });

  it("should delete only a single shift from recurring shifts when deleteScope=single", async () => {
    const container = getContainer();
    const { tenantId, staffProfileId } = await setupStaff(container.db);

    const created = await createShift({
      container,
      headers,
      input: {
        tenantId,
        staffProfileId,
        date: MONDAY_DATE,
        startTime: "09:00",
        endTime: "17:00",
        recurring: true,
        recurringEndDate: "2026-04-06",
      },
    });

    await deleteShift({
      container,
      headers,
      input: {
        shiftId: created.shiftIds[1],
        deleteScope: "single",
      },
    });

    const shifts = await container.db.select().from(schema.shifts);
    expect(shifts).toHaveLength(created.shiftIds.length - 1);
    const deletedShift = shifts.find((s) => s.id === created.shiftIds[1]);
    expect(deletedShift).toBeUndefined();
  });

  it("should delete all future shifts when deleteScope=future", async () => {
    const container = getContainer();
    const { tenantId, staffProfileId } = await setupStaff(container.db);

    const created = await createShift({
      container,
      headers,
      input: {
        tenantId,
        staffProfileId,
        date: MONDAY_DATE,
        startTime: "09:00",
        endTime: "17:00",
        recurring: true,
        recurringEndDate: "2026-04-13",
      },
    });

    // Delete from the second shift onwards
    await deleteShift({
      container,
      headers,
      input: {
        shiftId: created.shiftIds[1],
        deleteScope: "future",
      },
    });

    const shifts = await container.db.select().from(schema.shifts);
    // Only the first shift should remain
    expect(shifts).toHaveLength(1);
    expect(shifts[0].id).toBe(created.shiftIds[0]);
  });

  it("should delete all shifts when deleteScope=future is applied to the first shift", async () => {
    const container = getContainer();
    const { tenantId, staffProfileId } = await setupStaff(container.db);

    const created = await createShift({
      container,
      headers,
      input: {
        tenantId,
        staffProfileId,
        date: MONDAY_DATE,
        startTime: "09:00",
        endTime: "17:00",
        recurring: true,
        recurringEndDate: "2026-04-06",
      },
    });

    await deleteShift({
      container,
      headers,
      input: {
        shiftId: created.shiftIds[0],
        deleteScope: "future",
      },
    });

    const shifts = await container.db.select().from(schema.shifts);
    expect(shifts).toHaveLength(0);
  });

  it("should delete only the last shift when deleteScope=future is applied to the last shift", async () => {
    const container = getContainer();
    const { tenantId, staffProfileId } = await setupStaff(container.db);

    const created = await createShift({
      container,
      headers,
      input: {
        tenantId,
        staffProfileId,
        date: MONDAY_DATE,
        startTime: "09:00",
        endTime: "17:00",
        recurring: true,
        recurringEndDate: "2026-04-06",
      },
    });

    const lastId = created.shiftIds[created.shiftIds.length - 1];
    await deleteShift({
      container,
      headers,
      input: {
        shiftId: lastId,
        deleteScope: "future",
      },
    });

    const shifts = await container.db.select().from(schema.shifts);
    expect(shifts).toHaveLength(created.shiftIds.length - 1);
    const lastShift = shifts.find((s) => s.id === lastId);
    expect(lastShift).toBeUndefined();
  });

  it("should throw NotFoundError when shiftId does not exist", async () => {
    const container = getContainer();
    await setupStaff(container.db);

    await expect(
      deleteShift({
        container,
        headers,
        input: {
          shiftId: uuidv7(),
          deleteScope: "single",
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should delete only the single shift when deleteScope=future is applied to a non-recurring shift", async () => {
    const container = getContainer();
    const { tenantId, staffProfileId } = await setupStaff(container.db);

    const created = await createShift({
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

    await deleteShift({
      container,
      headers,
      input: {
        shiftId: created.shiftIds[0],
        deleteScope: "future",
      },
    });

    const shifts = await container.db.select().from(schema.shifts);
    expect(shifts).toHaveLength(0);
  });
});
