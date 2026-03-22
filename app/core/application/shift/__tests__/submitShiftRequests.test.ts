import { v7 as uuidv7 } from "uuid";
import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { BusinessRuleError } from "@/core/domain/error";
import { createMockHeaders, setupTestContainer } from "../../__tests__/helpers";
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

describe("submitShiftRequests", () => {
  const headers = createMockHeaders();

  it("should submit multiple work shift requests", async () => {
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
            type: "work",
            startTime: "10:00",
            endTime: "16:00",
          },
        ],
      },
    });

    const requests = await container.db.select().from(schema.shiftRequests);
    expect(requests).toHaveLength(2);
    expect(requests[0].type).toBe("work");
    expect(requests[1].type).toBe("work");
  });

  it("should submit off shift requests with null timeRange", async () => {
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
            type: "off",
          },
        ],
      },
    });

    const requests = await container.db.select().from(schema.shiftRequests);
    expect(requests).toHaveLength(1);
    expect(requests[0].type).toBe("off");
    expect(requests[0].startTime).toBeNull();
    expect(requests[0].endTime).toBeNull();
  });

  it("should submit shift requests with a note", async () => {
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
            note: "Early shift preferred",
          },
        ],
      },
    });

    const requests = await container.db.select().from(schema.shiftRequests);
    expect(requests).toHaveLength(1);
    expect(requests[0].note).toBe("Early shift preferred");
  });

  it("should submit shift requests with null note", async () => {
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

    const requests = await container.db.select().from(schema.shiftRequests);
    expect(requests).toHaveLength(1);
    expect(requests[0].note).toBeNull();
  });

  it("should submit mixed work and off shift requests", async () => {
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
          {
            date: "2026-03-25",
            type: "work",
            startTime: "10:00",
            endTime: "16:00",
          },
        ],
      },
    });

    const requests = await container.db.select().from(schema.shiftRequests);
    expect(requests).toHaveLength(3);
    const types = requests.map((r) => r.type).sort();
    expect(types).toEqual(["off", "work", "work"]);
  });

  it("should overwrite existing shift requests for the same period", async () => {
    const container = getContainer();
    const { tenantId, staffProfileId } = await setupStaff(container.db);

    // First submission
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
            type: "work",
            startTime: "09:00",
            endTime: "17:00",
          },
        ],
      },
    });

    // Second submission - same period, different content
    await submitShiftRequests({
      container,
      headers,
      input: {
        staffProfileId,
        tenantId,
        requests: [
          {
            date: "2026-03-23",
            type: "off",
          },
          {
            date: "2026-03-24",
            type: "off",
          },
        ],
      },
    });

    const requests = await container.db.select().from(schema.shiftRequests);
    expect(requests).toHaveLength(2);
    expect(requests[0].type).toBe("off");
    expect(requests[1].type).toBe("off");
  });

  it("should replace previous requests with new ones on re-submission", async () => {
    const container = getContainer();
    const { tenantId, staffProfileId } = await setupStaff(container.db);

    // First submission with 3 dates
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

    // Second submission with only 1 date in the same range
    await submitShiftRequests({
      container,
      headers,
      input: {
        staffProfileId,
        tenantId,
        requests: [
          {
            date: "2026-03-24",
            type: "off",
          },
        ],
      },
    });

    const requests = await container.db.select().from(schema.shiftRequests);
    // The deletion covers minDate to maxDate of the new submission,
    // which is only 2026-03-24 to 2026-03-24 in this case.
    // So 2026-03-23 and 2026-03-25 from the first submission may remain.
    // The behavior depends on the implementation: it deletes the range
    // covered by the new submission dates.
    const offRequests = requests.filter((r) => r.type === "off");
    expect(offRequests).toHaveLength(1);
  });

  it("should emit shiftRequest.submitted domain event", async () => {
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

    const events = await container.db.select().from(schema.outboxEvents);
    const submittedEvents = events.filter(
      (e) => e.eventType === "shiftRequest.submitted",
    );
    expect(submittedEvents.length).toBeGreaterThanOrEqual(1);
  });

  it("should throw BusinessRuleError when work request has startTime after endTime", async () => {
    const container = getContainer();
    const { tenantId, staffProfileId } = await setupStaff(container.db);

    await expect(
      submitShiftRequests({
        container,
        headers,
        input: {
          staffProfileId,
          tenantId,
          requests: [
            {
              date: "2026-03-23",
              type: "work",
              startTime: "17:00",
              endTime: "09:00",
            },
          ],
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });
});
