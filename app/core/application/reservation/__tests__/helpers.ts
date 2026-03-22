import { v7 as uuidv7 } from "uuid";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import type { TestContainer } from "@/core/application/__tests__/helpers";

// ============================================
// Date helpers
// ============================================

/**
 * Format a Date to YYYY-MM-DD string.
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get a future date N days from now.
 */
export function futureDate(daysFromNow: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Get a past date N days ago.
 */
export function pastDate(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(0, 0, 0, 0);
  return date;
}

// ============================================
// DB Insert helpers
// ============================================

type TenantOverrides = Partial<typeof schema.tenants.$inferInsert>;

export async function insertTenant(
  db: TestContainer["db"],
  overrides: TenantOverrides = {},
) {
  const id = overrides.id ?? uuidv7();
  await db.insert(schema.tenants).values({
    id,
    name: "Test Salon",
    category: "salon",
    urlPath: `test-${id}`,
    postalCode: "100-0001",
    addressPrefecture: "Tokyo",
    addressCity: "Chiyoda",
    addressStreet: "1-1-1",
    phoneNumber: "03-1234-5678",
    businessHours: JSON.stringify({
      0: { open: "09:00", close: "18:00" },
      1: { open: "09:00", close: "18:00" },
      2: { open: "09:00", close: "18:00" },
      3: { open: "09:00", close: "18:00" },
      4: { open: "09:00", close: "18:00" },
      5: { open: "09:00", close: "18:00" },
      6: { open: "09:00", close: "18:00" },
    }),
    regularHolidays: JSON.stringify([]),
    reservationBookingWindowDays: 30,
    reservationBookingDeadlineHours: 2,
    reservationCancellationDeadlineHours: 24,
    reservationSlotDurationMinutes: 30,
    reservationBufferMinutes: 0,
    reservationApprovalMethod: "auto",
    status: "active",
    ...overrides,
  });
  return id;
}

export async function insertCustomer(
  db: TestContainer["db"],
  overrides: Partial<typeof schema.customers.$inferInsert> = {},
) {
  const id = overrides.id ?? uuidv7();
  await db.insert(schema.customers).values({
    id,
    authUserId: overrides.authUserId ?? `auth-${id}`,
    displayName: "Test Customer",
    email: `customer-${id}@example.com`,
    phoneNumber: "090-1234-5678",
    status: "active",
    ...overrides,
  });
  return id;
}

export async function insertMember(
  db: TestContainer["db"],
  tenantId: string,
  overrides: Partial<typeof schema.members.$inferInsert> = {},
) {
  const id = overrides.id ?? uuidv7();
  await db.insert(schema.members).values({
    id,
    tenantId,
    authUserId: overrides.authUserId ?? `auth-member-${id}`,
    name: "Test Member",
    email: `member-${id}@example.com`,
    role: "staff",
    joinedAt: new Date(),
    ...overrides,
  });
  return id;
}

export async function insertMenu(
  db: TestContainer["db"],
  tenantId: string,
  overrides: Partial<typeof schema.menus.$inferInsert> = {},
) {
  const id = overrides.id ?? uuidv7();
  await db.insert(schema.menus).values({
    id,
    tenantId,
    name: overrides.name ?? "Test Menu",
    category: "General",
    duration: 60,
    price: 5000,
    sortOrder: 1,
    ...overrides,
  });
  return id;
}

export async function insertStaffProfile(
  db: TestContainer["db"],
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
    ...overrides,
  });
  return id;
}

export async function assignMenuToStaff(
  db: TestContainer["db"],
  staffProfileId: string,
  menuId: string,
) {
  await db.insert(schema.staffAssignedMenus).values({
    staffProfileId,
    menuId,
  });
}

export async function insertShift(
  db: TestContainer["db"],
  tenantId: string,
  staffProfileId: string,
  date: Date,
  startTime = "09:00",
  endTime = "18:00",
  overrides: Partial<typeof schema.shifts.$inferInsert> = {},
) {
  const id = overrides.id ?? uuidv7();
  await db.insert(schema.shifts).values({
    id,
    tenantId,
    staffProfileId,
    date: formatDate(date),
    startTime,
    endTime,
    ...overrides,
  });
  return id;
}

export async function insertReservation(
  db: TestContainer["db"],
  overrides: Partial<typeof schema.reservations.$inferInsert> & {
    tenantId: string;
    menuId: string;
    date: string;
    startTime: string;
    endTime: string;
    menuName: string;
    menuDuration: number;
    menuPrice: number;
    createdBy: string;
  },
) {
  const id = overrides.id ?? uuidv7();
  await db.insert(schema.reservations).values({
    id,
    status: "confirmed",
    ...overrides,
  });
  return id;
}

// ============================================
// Full test scenario setup
// ============================================

export type TestScenario = {
  tenantId: string;
  customerId: string;
  menuId: string;
  memberId: string;
  staffProfileId: string;
  reservationDate: Date;
};

/**
 * Setup a complete test scenario with all required data:
 * tenant, customer, member, staff profile, menu, staff-menu assignment, and shift.
 */
export async function setupReservationScenario(
  db: TestContainer["db"],
  options: {
    approvalMethod?: "auto" | "manual";
    bufferMinutes?: number;
    bookingWindowDays?: number;
    bookingDeadlineHours?: number;
    cancellationDeadlineHours?: number;
    slotDurationMinutes?: number;
    tenantStatus?: "active" | "suspended";
    menuDuration?: number;
    menuPrice?: number;
    shiftStartTime?: string;
    shiftEndTime?: string;
    daysFromNow?: number;
    businessHours?: Record<number, { open: string; close: string } | null>;
    regularHolidays?: number[];
  } = {},
): Promise<TestScenario> {
  const daysFromNow = options.daysFromNow ?? 7;
  const reservationDate = futureDate(daysFromNow);

  const tenantId = await insertTenant(db, {
    reservationApprovalMethod: options.approvalMethod ?? "auto",
    reservationBufferMinutes: options.bufferMinutes ?? 0,
    reservationBookingWindowDays: options.bookingWindowDays ?? 30,
    reservationBookingDeadlineHours: options.bookingDeadlineHours ?? 2,
    reservationCancellationDeadlineHours:
      options.cancellationDeadlineHours ?? 24,
    reservationSlotDurationMinutes: options.slotDurationMinutes ?? 30,
    status: options.tenantStatus ?? "active",
    ...(options.businessHours
      ? { businessHours: JSON.stringify(options.businessHours) }
      : {}),
    ...(options.regularHolidays
      ? { regularHolidays: JSON.stringify(options.regularHolidays) }
      : {}),
  });

  const customerId = await insertCustomer(db);

  const menuId = await insertMenu(db, tenantId, {
    duration: options.menuDuration ?? 60,
    price: options.menuPrice ?? 5000,
  });

  const memberId = await insertMember(db, tenantId);

  const staffProfileId = await insertStaffProfile(db, tenantId, memberId);

  await assignMenuToStaff(db, staffProfileId, menuId);

  await insertShift(
    db,
    tenantId,
    staffProfileId,
    reservationDate,
    options.shiftStartTime ?? "09:00",
    options.shiftEndTime ?? "18:00",
  );

  return {
    tenantId,
    customerId,
    menuId,
    memberId,
    staffProfileId,
    reservationDate,
  };
}
