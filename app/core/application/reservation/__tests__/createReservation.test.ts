import { v7 as uuidv7 } from "uuid";
import { describe, expect, it } from "vitest";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/core/application/error";
import { createReservation } from "../createReservation";
import { getReservation } from "../getReservation";
import {
  formatDate,
  insertReservation,
  insertShift,
  setupReservationScenario,
} from "./helpers";

describe("createReservation", () => {
  const getContainer = setupTestContainer();
  const headers = createMockHeaders();

  // ============================================
  // 正常系
  // ============================================

  it("自動承認テナントで予約を作成するとconfirmedステータスの予約が作成される", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db, {
      approvalMethod: "auto",
    });

    const result = await createReservation({
      container,
      headers,
      input: {
        tenantId: scenario.tenantId,
        customerId: scenario.customerId,
        menuId: scenario.menuId,
        staffProfileId: scenario.staffProfileId,
        date: formatDate(scenario.reservationDate),
        startTime: "10:00",
        note: null,
      },
    });

    expect(result.id).toBeDefined();
    expect(result.status).toBe("confirmed");
  });

  it("手動承認テナントで予約を作成するとpendingステータスの予約が作成される", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db, {
      approvalMethod: "manual",
    });

    const result = await createReservation({
      container,
      headers,
      input: {
        tenantId: scenario.tenantId,
        customerId: scenario.customerId,
        menuId: scenario.menuId,
        staffProfileId: scenario.staffProfileId,
        date: formatDate(scenario.reservationDate),
        startTime: "10:00",
        note: null,
      },
    });

    expect(result.id).toBeDefined();
    expect(result.status).toBe("pending");
  });

  it("指名なしで予約すると空きスタッフが自動的に割り当てられる", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db);

    const result = await createReservation({
      container,
      headers,
      input: {
        tenantId: scenario.tenantId,
        customerId: scenario.customerId,
        menuId: scenario.menuId,
        staffProfileId: null,
        date: formatDate(scenario.reservationDate),
        startTime: "10:00",
        note: null,
      },
    });

    expect(result.id).toBeDefined();

    const reservation = await getReservation({
      container,
      headers,
      input: { reservationId: result.id },
    });
    expect(reservation.staffName).toBe("Test Staff");
  });

  it("メニュー名、所要時間、料金がスナップショットとして保存される", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db, {
      menuDuration: 60,
      menuPrice: 5000,
    });

    const result = await createReservation({
      container,
      headers,
      input: {
        tenantId: scenario.tenantId,
        customerId: scenario.customerId,
        menuId: scenario.menuId,
        staffProfileId: scenario.staffProfileId,
        date: formatDate(scenario.reservationDate),
        startTime: "10:00",
        note: null,
      },
    });

    const reservation = await getReservation({
      container,
      headers,
      input: { reservationId: result.id },
    });
    expect(reservation.menuName).toBe("Test Menu");
    expect(reservation.menuDuration).toBe(60);
    expect(reservation.menuPrice).toBe(5000);
  });

  it("noteにテキストを指定すると備考が保存される", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db);

    const result = await createReservation({
      container,
      headers,
      input: {
        tenantId: scenario.tenantId,
        customerId: scenario.customerId,
        menuId: scenario.menuId,
        staffProfileId: scenario.staffProfileId,
        date: formatDate(scenario.reservationDate),
        startTime: "10:00",
        note: "Window seat please",
      },
    });

    const reservation = await getReservation({
      container,
      headers,
      input: { reservationId: result.id },
    });
    expect(reservation.note).toBe("Window seat please");
  });

  it("noteがnullの場合、備考なしで予約が作成される", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db);

    const result = await createReservation({
      container,
      headers,
      input: {
        tenantId: scenario.tenantId,
        customerId: scenario.customerId,
        menuId: scenario.menuId,
        staffProfileId: scenario.staffProfileId,
        date: formatDate(scenario.reservationDate),
        startTime: "10:00",
        note: null,
      },
    });

    const reservation = await getReservation({
      container,
      headers,
      input: { reservationId: result.id },
    });
    expect(reservation.note).toBeNull();
  });

  // ============================================
  // 異常系
  // ============================================

  it("指定した時間枠に既に予約が入っている場合ConflictErrorが発生する", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db);
    const dateStr = formatDate(scenario.reservationDate);

    // Insert existing reservation
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

    await expect(
      createReservation({
        container,
        headers,
        input: {
          tenantId: scenario.tenantId,
          customerId: scenario.customerId,
          menuId: scenario.menuId,
          staffProfileId: scenario.staffProfileId,
          date: dateStr,
          startTime: "10:00",
          note: null,
        },
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("テナントが停止中の場合ForbiddenErrorが発生する", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db, {
      tenantStatus: "suspended",
    });

    await expect(
      createReservation({
        container,
        headers,
        input: {
          tenantId: scenario.tenantId,
          customerId: scenario.customerId,
          menuId: scenario.menuId,
          staffProfileId: scenario.staffProfileId,
          date: formatDate(scenario.reservationDate),
          startTime: "10:00",
          note: null,
        },
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("指名なしで空きスタッフが存在しない場合ConflictErrorが発生する", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db);
    const dateStr = formatDate(scenario.reservationDate);

    // Fill the only staff's slot
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

    await expect(
      createReservation({
        container,
        headers,
        input: {
          tenantId: scenario.tenantId,
          customerId: scenario.customerId,
          menuId: scenario.menuId,
          staffProfileId: null,
          date: dateStr,
          startTime: "10:00",
          note: null,
        },
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("存在しないtenantIdを指定するとNotFoundErrorが発生する", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db);

    await expect(
      createReservation({
        container,
        headers,
        input: {
          tenantId: uuidv7(),
          customerId: scenario.customerId,
          menuId: scenario.menuId,
          staffProfileId: scenario.staffProfileId,
          date: formatDate(scenario.reservationDate),
          startTime: "10:00",
          note: null,
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("存在しないmenuIdを指定するとNotFoundErrorが発生する", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db);

    await expect(
      createReservation({
        container,
        headers,
        input: {
          tenantId: scenario.tenantId,
          customerId: scenario.customerId,
          menuId: uuidv7(),
          staffProfileId: scenario.staffProfileId,
          date: formatDate(scenario.reservationDate),
          startTime: "10:00",
          note: null,
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("予約受付終了日より後の日付を指定するとValidationErrorが発生する", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db, {
      bookingWindowDays: 7,
      daysFromNow: 7,
    });

    // 7+1 = 8 days from now exceeds 7-day window
    const farDate = new Date();
    farDate.setDate(farDate.getDate() + 8);
    farDate.setHours(0, 0, 0, 0);

    // Need shift for that date
    await insertShift(
      container.db,
      scenario.tenantId,
      scenario.staffProfileId,
      farDate,
    );

    await expect(
      createReservation({
        container,
        headers,
        input: {
          tenantId: scenario.tenantId,
          customerId: scenario.customerId,
          menuId: scenario.menuId,
          staffProfileId: scenario.staffProfileId,
          date: formatDate(farDate),
          startTime: "10:00",
          note: null,
        },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("指定した日時がスタッフのシフト外である場合ConflictErrorが発生する", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db, {
      shiftStartTime: "09:00",
      shiftEndTime: "12:00",
    });

    await expect(
      createReservation({
        container,
        headers,
        input: {
          tenantId: scenario.tenantId,
          customerId: scenario.customerId,
          menuId: scenario.menuId,
          staffProfileId: scenario.staffProfileId,
          date: formatDate(scenario.reservationDate),
          startTime: "14:00",
          note: null,
        },
      }),
    ).rejects.toThrow(ConflictError);
  });

  // ============================================
  // 境界値・エッジケース
  // ============================================

  it("営業開始時刻ちょうどに予約できる", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db);

    const result = await createReservation({
      container,
      headers,
      input: {
        tenantId: scenario.tenantId,
        customerId: scenario.customerId,
        menuId: scenario.menuId,
        staffProfileId: scenario.staffProfileId,
        date: formatDate(scenario.reservationDate),
        startTime: "09:00",
        note: null,
      },
    });

    expect(result.id).toBeDefined();
  });

  it("営業終了時刻にメニューの所要時間が収まるギリギリの時刻に予約できる", async () => {
    const container = getContainer();
    // Menu duration 60min, business closes at 18:00
    // So 17:00 start -> 18:00 end is the last possible slot
    const scenario = await setupReservationScenario(container.db, {
      menuDuration: 60,
    });

    const result = await createReservation({
      container,
      headers,
      input: {
        tenantId: scenario.tenantId,
        customerId: scenario.customerId,
        menuId: scenario.menuId,
        staffProfileId: scenario.staffProfileId,
        date: formatDate(scenario.reservationDate),
        startTime: "17:00",
        note: null,
      },
    });

    expect(result.id).toBeDefined();
  });

  it("同一スタッフに連続する時間枠で予約が入っておりバッファ時間と重なる場合ConflictErrorが発生する", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db, {
      bufferMinutes: 30,
      menuDuration: 60,
    });
    const dateStr = formatDate(scenario.reservationDate);

    // Existing reservation: 10:00-11:00 + 30min buffer = 11:30 effective end
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

    // Try 11:00-12:00 which overlaps with buffer (11:00 < 11:30)
    await expect(
      createReservation({
        container,
        headers,
        input: {
          tenantId: scenario.tenantId,
          customerId: scenario.customerId,
          menuId: scenario.menuId,
          staffProfileId: scenario.staffProfileId,
          date: dateStr,
          startTime: "11:00",
          note: null,
        },
      }),
    ).rejects.toThrow(ConflictError);
  });
});
