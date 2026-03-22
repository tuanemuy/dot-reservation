import { v7 as uuidv7 } from "uuid";
import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { ConflictError, ValidationError } from "@/core/application/error";
import { BusinessRuleError } from "@/core/domain/error";
import { createMockHeaders, setupTestContainer } from "../../__tests__/helpers";
import { createShift } from "../createShift";

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

/**
 * Get a date string for a specific day of the week.
 * dayOfWeek: 0=Sunday, 1=Monday, ..., 6=Saturday
 * Uses 2026-03-23 (Monday) as reference.
 */
function getDateForDayOfWeek(dayOfWeek: number): string {
  // 2026-03-23 is a Monday (day 1)
  const baseDate = new Date(2026, 2, 23); // March 23, 2026 = Monday
  const currentDay = baseDate.getDay(); // 1 (Monday)
  const diff = dayOfWeek - currentDay;
  const target = new Date(baseDate);
  target.setDate(target.getDate() + diff);
  const year = target.getFullYear();
  const month = String(target.getMonth() + 1).padStart(2, "0");
  const day = String(target.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Monday date for tests (business day)
const MONDAY_DATE = getDateForDayOfWeek(1); // 2026-03-23

describe("createShift", () => {
  const headers = createMockHeaders();

  it("should create a single shift with valid date, startTime, endTime, recurring=false", async () => {
    const container = getContainer();
    const { tenantId, staffProfileId } = await setupStaff(container.db);

    const result = await createShift({
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

    expect(result.shiftIds).toHaveLength(1);
    expect(result.shiftIds[0]).toBeDefined();
  });

  it("should create recurring shifts with recurringEndDate 4 weeks later", async () => {
    const container = getContainer();
    const { tenantId, staffProfileId } = await setupStaff(container.db);

    // 4 weeks later from MONDAY_DATE
    const baseDate = new Date(2026, 2, 23);
    const endDate = new Date(baseDate);
    endDate.setDate(endDate.getDate() + 28);
    const recurringEndDate = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;

    const result = await createShift({
      container,
      headers,
      input: {
        tenantId,
        staffProfileId,
        date: MONDAY_DATE,
        startTime: "09:00",
        endTime: "17:00",
        recurring: true,
        recurringEndDate,
      },
    });

    // base + 4 more weeks = 5 shifts
    expect(result.shiftIds.length).toBe(5);
  });

  it("should create 2 shifts when recurringEndDate is 1 week later", async () => {
    const container = getContainer();
    const { tenantId, staffProfileId } = await setupStaff(container.db);

    const baseDate = new Date(2026, 2, 23);
    const endDate = new Date(baseDate);
    endDate.setDate(endDate.getDate() + 7);
    const recurringEndDate = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;

    const result = await createShift({
      container,
      headers,
      input: {
        tenantId,
        staffProfileId,
        date: MONDAY_DATE,
        startTime: "09:00",
        endTime: "17:00",
        recurring: true,
        recurringEndDate,
      },
    });

    expect(result.shiftIds).toHaveLength(2);
  });

  it("should set the same recurringGroupId for all recurring shifts", async () => {
    const container = getContainer();
    const { tenantId, staffProfileId } = await setupStaff(container.db);

    const baseDate = new Date(2026, 2, 23);
    const endDate = new Date(baseDate);
    endDate.setDate(endDate.getDate() + 14);
    const recurringEndDate = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;

    const result = await createShift({
      container,
      headers,
      input: {
        tenantId,
        staffProfileId,
        date: MONDAY_DATE,
        startTime: "09:00",
        endTime: "17:00",
        recurring: true,
        recurringEndDate,
      },
    });

    // Verify all shifts have the same recurringGroupId
    const shifts = await container.db.select().from(schema.shifts);
    const recurringGroupIds = shifts.map((s) => s.recurringGroupId);
    const uniqueGroupIds = new Set(recurringGroupIds);
    expect(uniqueGroupIds.size).toBe(1);
    expect(recurringGroupIds[0]).not.toBeNull();
    expect(result.shiftIds).toHaveLength(3);
  });

  it("should set recurringGroupId to null for a single shift", async () => {
    const container = getContainer();
    const { tenantId, staffProfileId } = await setupStaff(container.db);

    const result = await createShift({
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

    const shifts = await container.db.select().from(schema.shifts);
    expect(shifts).toHaveLength(1);
    expect(shifts[0].recurringGroupId).toBeNull();
    expect(result.shiftIds).toHaveLength(1);
  });

  it("should throw ValidationError when shift time is outside business hours", async () => {
    const container = getContainer();
    const { tenantId, staffProfileId } = await setupStaff(container.db);

    await expect(
      createShift({
        container,
        headers,
        input: {
          tenantId,
          staffProfileId,
          date: MONDAY_DATE,
          startTime: "07:00",
          endTime: "08:00",
          recurring: false,
          recurringEndDate: null,
        },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw ValidationError when startTime is within business hours but endTime is outside", async () => {
    const container = getContainer();
    const { tenantId, staffProfileId } = await setupStaff(container.db);

    await expect(
      createShift({
        container,
        headers,
        input: {
          tenantId,
          staffProfileId,
          date: MONDAY_DATE,
          startTime: "17:00",
          endTime: "19:00",
          recurring: false,
          recurringEndDate: null,
        },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw ConflictError when shift fully overlaps with an existing shift", async () => {
    const container = getContainer();
    const { tenantId, staffProfileId } = await setupStaff(container.db);

    await createShift({
      container,
      headers,
      input: {
        tenantId,
        staffProfileId,
        date: MONDAY_DATE,
        startTime: "10:00",
        endTime: "14:00",
        recurring: false,
        recurringEndDate: null,
      },
    });

    await expect(
      createShift({
        container,
        headers,
        input: {
          tenantId,
          staffProfileId,
          date: MONDAY_DATE,
          startTime: "10:00",
          endTime: "14:00",
          recurring: false,
          recurringEndDate: null,
        },
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("should throw ConflictError when shift partially overlaps with an existing shift", async () => {
    const container = getContainer();
    const { tenantId, staffProfileId } = await setupStaff(container.db);

    await createShift({
      container,
      headers,
      input: {
        tenantId,
        staffProfileId,
        date: MONDAY_DATE,
        startTime: "10:00",
        endTime: "14:00",
        recurring: false,
        recurringEndDate: null,
      },
    });

    await expect(
      createShift({
        container,
        headers,
        input: {
          tenantId,
          staffProfileId,
          date: MONDAY_DATE,
          startTime: "13:00",
          endTime: "17:00",
          recurring: false,
          recurringEndDate: null,
        },
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("should create a shift when time does not overlap with an existing shift on the same day", async () => {
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

    const result = await createShift({
      container,
      headers,
      input: {
        tenantId,
        staffProfileId,
        date: MONDAY_DATE,
        startTime: "14:00",
        endTime: "17:00",
        recurring: false,
        recurringEndDate: null,
      },
    });

    expect(result.shiftIds).toHaveLength(1);
  });

  it("should throw BusinessRuleError when startTime is after endTime", async () => {
    const container = getContainer();
    const { tenantId, staffProfileId } = await setupStaff(container.db);

    await expect(
      createShift({
        container,
        headers,
        input: {
          tenantId,
          staffProfileId,
          date: MONDAY_DATE,
          startTime: "15:00",
          endTime: "10:00",
          recurring: false,
          recurringEndDate: null,
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError when startTime equals endTime", async () => {
    const container = getContainer();
    const { tenantId, staffProfileId } = await setupStaff(container.db);

    await expect(
      createShift({
        container,
        headers,
        input: {
          tenantId,
          staffProfileId,
          date: MONDAY_DATE,
          startTime: "10:00",
          endTime: "10:00",
          recurring: false,
          recurringEndDate: null,
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError when time is not in 15-minute increments", async () => {
    const container = getContainer();
    const { tenantId, staffProfileId } = await setupStaff(container.db);

    await expect(
      createShift({
        container,
        headers,
        input: {
          tenantId,
          staffProfileId,
          date: MONDAY_DATE,
          startTime: "10:07",
          endTime: "12:00",
          recurring: false,
          recurringEndDate: null,
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw ValidationError when recurring=true but recurringEndDate is null", async () => {
    const container = getContainer();
    const { tenantId, staffProfileId } = await setupStaff(container.db);

    await expect(
      createShift({
        container,
        headers,
        input: {
          tenantId,
          staffProfileId,
          date: MONDAY_DATE,
          startTime: "09:00",
          endTime: "17:00",
          recurring: true,
          recurringEndDate: null,
        },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should create only the base date shift when recurring=true and recurringEndDate is before start date", async () => {
    const container = getContainer();
    const { tenantId, staffProfileId } = await setupStaff(container.db);

    // recurringEndDate is before MONDAY_DATE (2026-03-23)
    // The implementation does not throw; it simply creates only the base date shift
    const result = await createShift({
      container,
      headers,
      input: {
        tenantId,
        staffProfileId,
        date: MONDAY_DATE,
        startTime: "09:00",
        endTime: "17:00",
        recurring: true,
        recurringEndDate: "2026-03-16",
      },
    });

    expect(result.shiftIds).toHaveLength(1);
  });

  it("should throw ConflictError and not create any shifts when recurring shifts partially conflict (transaction integrity)", async () => {
    const container = getContainer();
    const { tenantId, staffProfileId } = await setupStaff(container.db);

    // Create an existing shift on the second Monday (2026-03-30)
    const secondMonday = "2026-03-30";
    await createShift({
      container,
      headers,
      input: {
        tenantId,
        staffProfileId,
        date: secondMonday,
        startTime: "10:00",
        endTime: "14:00",
        recurring: false,
        recurringEndDate: null,
      },
    });

    // Now try to create recurring shifts from first Monday to third Monday
    // This should conflict on the second Monday
    await expect(
      createShift({
        container,
        headers,
        input: {
          tenantId,
          staffProfileId,
          date: MONDAY_DATE,
          startTime: "10:00",
          endTime: "14:00",
          recurring: true,
          recurringEndDate: "2026-04-06",
        },
      }),
    ).rejects.toThrow(ConflictError);

    // Verify no new shifts were created (only the original one remains)
    const allShifts = await container.db.select().from(schema.shifts);
    expect(allShifts).toHaveLength(1);
  });

  it("should emit shift.created domain event when shift is created", async () => {
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

    // Verify outbox event was created
    const events = await container.db.select().from(schema.outboxEvents);
    expect(events.length).toBeGreaterThanOrEqual(1);
    const shiftCreatedEvent = events.find(
      (e) => e.eventType === "shift.created",
    );
    expect(shiftCreatedEvent).toBeDefined();
  });
});
