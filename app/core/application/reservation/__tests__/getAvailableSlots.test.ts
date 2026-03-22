import { v7 as uuidv7 } from "uuid";
import { describe, expect, it } from "vitest";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { NotFoundError } from "@/core/application/error";
import { getAvailableSlots } from "../getAvailableSlots";
import {
  formatDate,
  insertReservation,
  setupReservationScenario,
} from "./helpers";

describe("getAvailableSlots", () => {
  const getContainer = setupTestContainer();
  const headers = createMockHeaders();

  // ============================================
  // 正常系
  // ============================================

  it("営業日で予約がない場合、営業時間内のすべての時間枠がavailable: trueで返される", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db, {
      menuDuration: 60,
      slotDurationMinutes: 60,
    });

    const result = await getAvailableSlots({
      container,
      headers,
      input: {
        tenantId: scenario.tenantId,
        menuId: scenario.menuId,
        staffProfileId: null,
        date: formatDate(scenario.reservationDate),
      },
    });

    expect(result.slots.length).toBeGreaterThan(0);
    expect(result.slots.every((s) => s.available)).toBe(true);
  });

  it("一部の時間枠に既存予約がある場合、その枠はavailable: falseで返される", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db, {
      menuDuration: 60,
      slotDurationMinutes: 60,
    });
    const dateStr = formatDate(scenario.reservationDate);

    await insertReservation(container.db, {
      tenantId: scenario.tenantId,
      customerId: scenario.customerId,
      menuId: scenario.menuId,
      staffProfileId: scenario.staffProfileId,
      date: dateStr,
      startTime: "10:00",
      endTime: "11:00",
      status: "confirmed",
      menuName: "Test Menu",
      menuDuration: 60,
      menuPrice: 5000,
      createdBy: "customer",
    });

    const result = await getAvailableSlots({
      container,
      headers,
      input: {
        tenantId: scenario.tenantId,
        menuId: scenario.menuId,
        staffProfileId: scenario.staffProfileId,
        date: dateStr,
      },
    });

    const slot1000 = result.slots.find((s) => s.startTime === "10:00");
    expect(slot1000).toBeDefined();
    expect(slot1000?.available).toBe(false);

    // Other slots should be available
    const slot0900 = result.slots.find((s) => s.startTime === "09:00");
    expect(slot0900).toBeDefined();
    expect(slot0900?.available).toBe(true);
  });

  it("staffProfileIdを指定し、シフト外の時間がある場合、シフト外の枠はavailable: falseになる", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db, {
      menuDuration: 60,
      slotDurationMinutes: 60,
      shiftStartTime: "10:00",
      shiftEndTime: "15:00",
    });

    const result = await getAvailableSlots({
      container,
      headers,
      input: {
        tenantId: scenario.tenantId,
        menuId: scenario.menuId,
        staffProfileId: scenario.staffProfileId,
        date: formatDate(scenario.reservationDate),
      },
    });

    // 09:00 should be false (before shift)
    const slot0900 = result.slots.find((s) => s.startTime === "09:00");
    expect(slot0900).toBeDefined();
    expect(slot0900?.available).toBe(false);

    // 10:00 should be true (within shift)
    const slot1000 = result.slots.find((s) => s.startTime === "10:00");
    expect(slot1000).toBeDefined();
    expect(slot1000?.available).toBe(true);
  });

  it("staffProfileIdがnullで、いずれかのスタッフに空きがある時間枠はavailable: trueで返される", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db, {
      menuDuration: 60,
      slotDurationMinutes: 60,
    });

    const result = await getAvailableSlots({
      container,
      headers,
      input: {
        tenantId: scenario.tenantId,
        menuId: scenario.menuId,
        staffProfileId: null,
        date: formatDate(scenario.reservationDate),
      },
    });

    expect(result.slots.length).toBeGreaterThan(0);
    const availableSlots = result.slots.filter((s) => s.available);
    expect(availableSlots.length).toBeGreaterThan(0);
  });

  it("バッファ時間が設定されている場合、予約前後のバッファが考慮される", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db, {
      menuDuration: 60,
      slotDurationMinutes: 60,
      bufferMinutes: 30,
    });
    const dateStr = formatDate(scenario.reservationDate);

    // Reservation at 10:00-11:00 with 30min buffer
    await insertReservation(container.db, {
      tenantId: scenario.tenantId,
      customerId: scenario.customerId,
      menuId: scenario.menuId,
      staffProfileId: scenario.staffProfileId,
      date: dateStr,
      startTime: "10:00",
      endTime: "11:00",
      status: "confirmed",
      menuName: "Test Menu",
      menuDuration: 60,
      menuPrice: 5000,
      createdBy: "customer",
    });

    const result = await getAvailableSlots({
      container,
      headers,
      input: {
        tenantId: scenario.tenantId,
        menuId: scenario.menuId,
        staffProfileId: scenario.staffProfileId,
        date: dateStr,
      },
    });

    // 11:00 should be unavailable due to buffer (10:00-11:00 + 30min buffer means 11:00-12:00 conflicts)
    const slot1100 = result.slots.find((s) => s.startTime === "11:00");
    if (slot1100) {
      expect(slot1100.available).toBe(false);
    }
  });

  // ============================================
  // 異常系
  // ============================================

  it("休業日の場合、空配列が返される", async () => {
    const container = getContainer();
    // Make the reservation date's day of week a holiday
    const reservationDate = new Date();
    reservationDate.setDate(reservationDate.getDate() + 7);
    reservationDate.setHours(0, 0, 0, 0);
    const dayOfWeek = reservationDate.getDay();

    const scenario = await setupReservationScenario(container.db, {
      regularHolidays: [dayOfWeek],
      daysFromNow: 7,
    });

    const result = await getAvailableSlots({
      container,
      headers,
      input: {
        tenantId: scenario.tenantId,
        menuId: scenario.menuId,
        staffProfileId: null,
        date: formatDate(scenario.reservationDate),
      },
    });

    expect(result.slots).toHaveLength(0);
  });

  it("存在しないtenantIdを指定するとNotFoundErrorが発生する", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db);

    await expect(
      getAvailableSlots({
        container,
        headers,
        input: {
          tenantId: uuidv7(),
          menuId: scenario.menuId,
          staffProfileId: null,
          date: formatDate(scenario.reservationDate),
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("存在しないmenuIdを指定するとNotFoundErrorが発生する", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db);

    await expect(
      getAvailableSlots({
        container,
        headers,
        input: {
          tenantId: scenario.tenantId,
          menuId: uuidv7(),
          staffProfileId: null,
          date: formatDate(scenario.reservationDate),
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  // ============================================
  // 境界値・エッジケース
  // ============================================

  it("メニューの所要時間が営業終了時刻に収まらない最後の枠はavailable: falseで返される", async () => {
    const container = getContainer();
    // Business hours 09:00-18:00, menu 60min, slot 30min
    // Last valid slot: 17:00 (17:00+60=18:00)
    // 17:30 should not appear or be false
    const scenario = await setupReservationScenario(container.db, {
      menuDuration: 60,
      slotDurationMinutes: 30,
    });

    const result = await getAvailableSlots({
      container,
      headers,
      input: {
        tenantId: scenario.tenantId,
        menuId: scenario.menuId,
        staffProfileId: null,
        date: formatDate(scenario.reservationDate),
      },
    });

    // 17:30 should not appear (17:30+60=18:30 exceeds 18:00)
    const slot1730 = result.slots.find((s) => s.startTime === "17:30");
    expect(slot1730).toBeUndefined();

    // 17:00 should be available
    const slot1700 = result.slots.find((s) => s.startTime === "17:00");
    expect(slot1700).toBeDefined();
    expect(slot1700?.available).toBe(true);
  });

  it("営業開始時刻ちょうどの枠が含まれる", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db, {
      menuDuration: 60,
      slotDurationMinutes: 60,
    });

    const result = await getAvailableSlots({
      container,
      headers,
      input: {
        tenantId: scenario.tenantId,
        menuId: scenario.menuId,
        staffProfileId: null,
        date: formatDate(scenario.reservationDate),
      },
    });

    const slot0900 = result.slots.find((s) => s.startTime === "09:00");
    expect(slot0900).toBeDefined();
  });

  it("予約受付期間の最終日の翌日を指定すると空配列が返される", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db, {
      bookingWindowDays: 7,
    });

    // Date beyond booking window
    const farDate = new Date();
    farDate.setDate(farDate.getDate() + 8);
    farDate.setHours(0, 0, 0, 0);

    const result = await getAvailableSlots({
      container,
      headers,
      input: {
        tenantId: scenario.tenantId,
        menuId: scenario.menuId,
        staffProfileId: null,
        date: formatDate(farDate),
      },
    });

    expect(result.slots).toHaveLength(0);
  });
});
