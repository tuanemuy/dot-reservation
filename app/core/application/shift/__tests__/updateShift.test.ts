import { v7 as uuidv7 } from "uuid";
import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { ConflictError, NotFoundError } from "@/core/application/error";
import { BusinessRuleError } from "@/core/domain/error";
import { createMockHeaders, setupTestContainer } from "../../__tests__/helpers";
import { createShift } from "../createShift";
import { updateShift } from "../updateShift";

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

describe("updateShift", () => {
  const headers = createMockHeaders();

  it("should update a single shift time range with updateScope=single", async () => {
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

    await updateShift({
      container,
      headers,
      input: {
        shiftId: created.shiftIds[0],
        startTime: "10:00",
        endTime: "16:00",
        updateScope: "single",
      },
    });

    const shifts = await container.db.select().from(schema.shifts);
    expect(shifts).toHaveLength(1);
    expect(shifts[0].startTime).toBe("10:00");
    expect(shifts[0].endTime).toBe("16:00");
  });

  it("should update only a single shift when updateScope=single for recurring shifts", async () => {
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

    // Update only the first shift
    await updateShift({
      container,
      headers,
      input: {
        shiftId: created.shiftIds[0],
        startTime: "10:00",
        endTime: "16:00",
        updateScope: "single",
      },
    });

    const shifts = await container.db.select().from(schema.shifts);
    const updatedShift = shifts.find((s) => s.id === created.shiftIds[0]);
    const otherShifts = shifts.filter((s) => s.id !== created.shiftIds[0]);

    expect(updatedShift?.startTime).toBe("10:00");
    expect(updatedShift?.endTime).toBe("16:00");
    for (const s of otherShifts) {
      expect(s.startTime).toBe("09:00");
      expect(s.endTime).toBe("17:00");
    }
  });

  it("should update all future shifts when updateScope=future for recurring shifts", async () => {
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

    // Update from the second shift onwards (future scope)
    await updateShift({
      container,
      headers,
      input: {
        shiftId: created.shiftIds[1],
        startTime: "10:00",
        endTime: "16:00",
        updateScope: "future",
      },
    });

    const shifts = await container.db.select().from(schema.shifts);
    const firstShift = shifts.find((s) => s.id === created.shiftIds[0]);
    expect(firstShift?.startTime).toBe("09:00");
    expect(firstShift?.endTime).toBe("17:00");

    for (let i = 1; i < created.shiftIds.length; i++) {
      const s = shifts.find((sh) => sh.id === created.shiftIds[i]);
      expect(s?.startTime).toBe("10:00");
      expect(s?.endTime).toBe("16:00");
    }
  });

  it("should update all shifts when updateScope=future is applied to the first shift", async () => {
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

    await updateShift({
      container,
      headers,
      input: {
        shiftId: created.shiftIds[0],
        startTime: "10:00",
        endTime: "16:00",
        updateScope: "future",
      },
    });

    const shifts = await container.db.select().from(schema.shifts);
    for (const s of shifts) {
      expect(s.startTime).toBe("10:00");
      expect(s.endTime).toBe("16:00");
    }
  });

  it("should update only the last shift when updateScope=future is applied to the last shift", async () => {
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
    await updateShift({
      container,
      headers,
      input: {
        shiftId: lastId,
        startTime: "10:00",
        endTime: "16:00",
        updateScope: "future",
      },
    });

    const shifts = await container.db.select().from(schema.shifts);
    const lastShift = shifts.find((s) => s.id === lastId);
    const otherShifts = shifts.filter((s) => s.id !== lastId);

    expect(lastShift?.startTime).toBe("10:00");
    expect(lastShift?.endTime).toBe("16:00");
    for (const s of otherShifts) {
      expect(s.startTime).toBe("09:00");
      expect(s.endTime).toBe("17:00");
    }
  });

  it("should throw ConflictError when updated time overlaps with another shift", async () => {
    const container = getContainer();
    const { tenantId, staffProfileId } = await setupStaff(container.db);

    // Create two non-overlapping shifts
    const shift1 = await createShift({
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
        date: MONDAY_DATE,
        startTime: "14:00",
        endTime: "17:00",
        recurring: false,
        recurringEndDate: null,
      },
    });

    // Try to update first shift to overlap with second
    await expect(
      updateShift({
        container,
        headers,
        input: {
          shiftId: shift1.shiftIds[0],
          startTime: "13:00",
          endTime: "15:00",
          updateScope: "single",
        },
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("should update successfully when time does not overlap with another shift", async () => {
    const container = getContainer();
    const { tenantId, staffProfileId } = await setupStaff(container.db);

    const shift1 = await createShift({
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
        date: MONDAY_DATE,
        startTime: "14:00",
        endTime: "17:00",
        recurring: false,
        recurringEndDate: null,
      },
    });

    // Update first shift to a non-overlapping time
    await updateShift({
      container,
      headers,
      input: {
        shiftId: shift1.shiftIds[0],
        startTime: "09:00",
        endTime: "13:00",
        updateScope: "single",
      },
    });

    const shifts = await container.db.select().from(schema.shifts);
    const updated = shifts.find((s) => s.id === shift1.shiftIds[0]);
    expect(updated?.startTime).toBe("09:00");
    expect(updated?.endTime).toBe("13:00");
  });

  it("should throw NotFoundError when shiftId does not exist", async () => {
    const container = getContainer();
    await setupStaff(container.db);

    await expect(
      updateShift({
        container,
        headers,
        input: {
          shiftId: uuidv7(),
          startTime: "10:00",
          endTime: "14:00",
          updateScope: "single",
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw BusinessRuleError when startTime is after endTime", async () => {
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

    await expect(
      updateShift({
        container,
        headers,
        input: {
          shiftId: created.shiftIds[0],
          startTime: "15:00",
          endTime: "10:00",
          updateScope: "single",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError when startTime equals endTime", async () => {
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

    await expect(
      updateShift({
        container,
        headers,
        input: {
          shiftId: created.shiftIds[0],
          startTime: "10:00",
          endTime: "10:00",
          updateScope: "single",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError when time is not in 15-minute increments", async () => {
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

    await expect(
      updateShift({
        container,
        headers,
        input: {
          shiftId: created.shiftIds[0],
          startTime: "10:07",
          endTime: "14:00",
          updateScope: "single",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw ConflictError and not update any shifts when updateScope=future has partial conflicts (transaction integrity)", async () => {
    const container = getContainer();
    const { tenantId, staffProfileId } = await setupStaff(container.db);

    // Create a recurring shift (3 weeks)
    const created = await createShift({
      container,
      headers,
      input: {
        tenantId,
        staffProfileId,
        date: MONDAY_DATE,
        startTime: "09:00",
        endTime: "12:00",
        recurring: true,
        recurringEndDate: "2026-04-06",
      },
    });

    // Create a conflicting shift on the third Monday
    await createShift({
      container,
      headers,
      input: {
        tenantId,
        staffProfileId,
        date: "2026-04-06",
        startTime: "13:00",
        endTime: "16:00",
        recurring: false,
        recurringEndDate: null,
      },
    });

    // Try to update all future shifts from the first to a conflicting time
    await expect(
      updateShift({
        container,
        headers,
        input: {
          shiftId: created.shiftIds[0],
          startTime: "13:00",
          endTime: "16:00",
          updateScope: "future",
        },
      }),
    ).rejects.toThrow(ConflictError);

    // Verify none of the recurring shifts were updated
    const shifts = await container.db.select().from(schema.shifts);
    const recurringShifts = shifts.filter(
      (s) => s.recurringGroupId !== null && s.startTime === "09:00",
    );
    expect(recurringShifts).toHaveLength(3);
  });
});
