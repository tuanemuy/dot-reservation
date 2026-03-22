import { v7 as uuidv7 } from "uuid";
import { describe, expect, it } from "vitest";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { ConflictError, NotFoundError } from "@/core/application/error";
import { getReservation } from "../getReservation";
import { updateReservation } from "../updateReservation";
import {
  assignMenuToStaff,
  formatDate,
  insertMember,
  insertMenu,
  insertReservation,
  insertShift,
  insertStaffProfile,
  setupReservationScenario,
} from "./helpers";

describe("updateReservation", () => {
  const getContainer = setupTestContainer();
  const headers = createMockHeaders();

  // ============================================
  // 正常系
  // ============================================

  it("confirmedステータスの予約日時を変更すると予約日時が更新される", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db);
    const dateStr = formatDate(scenario.reservationDate);

    const reservationId = await insertReservation(container.db, {
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

    const result = await updateReservation({
      container,
      headers,
      input: {
        reservationId,
        menuId: scenario.menuId,
        staffProfileId: scenario.staffProfileId,
        date: dateStr,
        startTime: "14:00",
        note: null,
      },
    });

    expect(result.id).toBe(reservationId);

    const reservation = await getReservation({
      container,
      headers,
      input: { reservationId },
    });
    expect(reservation.startTime).toBe("14:00");
    expect(reservation.endTime).toBe("15:00");
  });

  it("pendingステータスの予約日時を変更すると予約日時が更新される", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db);
    const dateStr = formatDate(scenario.reservationDate);

    const reservationId = await insertReservation(container.db, {
      tenantId: scenario.tenantId,
      customerId: scenario.customerId,
      menuId: scenario.menuId,
      staffProfileId: scenario.staffProfileId,
      date: dateStr,
      startTime: "10:00",
      endTime: "11:00",
      status: "pending",
      menuName: "Test Menu",
      menuDuration: 60,
      menuPrice: 5000,
      createdBy: "customer",
    });

    const result = await updateReservation({
      container,
      headers,
      input: {
        reservationId,
        menuId: scenario.menuId,
        staffProfileId: scenario.staffProfileId,
        date: dateStr,
        startTime: "14:00",
        note: null,
      },
    });

    expect(result.id).toBe(reservationId);
  });

  it("メニューを変更するとスナップショットが更新される", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db);
    const dateStr = formatDate(scenario.reservationDate);

    // Create another menu
    const newMenuId = await insertMenu(container.db, scenario.tenantId, {
      name: "New Menu",
      duration: 30,
      price: 3000,
    });
    await assignMenuToStaff(container.db, scenario.staffProfileId, newMenuId);

    const reservationId = await insertReservation(container.db, {
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

    await updateReservation({
      container,
      headers,
      input: {
        reservationId,
        menuId: newMenuId,
        staffProfileId: scenario.staffProfileId,
        date: dateStr,
        startTime: "10:00",
        note: null,
      },
    });

    const reservation = await getReservation({
      container,
      headers,
      input: { reservationId },
    });
    expect(reservation.menuName).toBe("New Menu");
    expect(reservation.menuDuration).toBe(30);
    expect(reservation.menuPrice).toBe(3000);
  });

  it("別のスタッフに変更すると担当スタッフが変更される", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db);
    const dateStr = formatDate(scenario.reservationDate);

    // Create another staff
    const newMemberId = await insertMember(container.db, scenario.tenantId);
    const newStaffProfileId = await insertStaffProfile(
      container.db,
      scenario.tenantId,
      newMemberId,
      { displayName: "New Staff" },
    );
    await assignMenuToStaff(container.db, newStaffProfileId, scenario.menuId);
    await insertShift(
      container.db,
      scenario.tenantId,
      newStaffProfileId,
      scenario.reservationDate,
    );

    const reservationId = await insertReservation(container.db, {
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
      staffName: "Test Staff",
      createdBy: "customer",
    });

    await updateReservation({
      container,
      headers,
      input: {
        reservationId,
        menuId: scenario.menuId,
        staffProfileId: newStaffProfileId,
        date: dateStr,
        startTime: "10:00",
        note: null,
      },
    });

    const reservation = await getReservation({
      container,
      headers,
      input: { reservationId },
    });
    expect(reservation.staffName).toBe("New Staff");
  });

  it("staffProfileIdをnullに変更すると空きスタッフが自動割り当てされる", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db);
    const dateStr = formatDate(scenario.reservationDate);

    const reservationId = await insertReservation(container.db, {
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

    await updateReservation({
      container,
      headers,
      input: {
        reservationId,
        menuId: scenario.menuId,
        staffProfileId: null,
        date: dateStr,
        startTime: "10:00",
        note: null,
      },
    });

    const reservation = await getReservation({
      container,
      headers,
      input: { reservationId },
    });
    expect(reservation.staffName).toBe("Test Staff");
  });

  it("noteを変更すると備考が更新される", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db);
    const dateStr = formatDate(scenario.reservationDate);

    const reservationId = await insertReservation(container.db, {
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
      note: "Old note",
      createdBy: "customer",
    });

    await updateReservation({
      container,
      headers,
      input: {
        reservationId,
        menuId: scenario.menuId,
        staffProfileId: scenario.staffProfileId,
        date: dateStr,
        startTime: "10:00",
        note: "New note",
      },
    });

    const reservation = await getReservation({
      container,
      headers,
      input: { reservationId },
    });
    expect(reservation.note).toBe("New note");
  });

  // ============================================
  // 異常系
  // ============================================

  it("completedステータスの予約を変更するとConflictErrorが発生する", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db);
    const dateStr = formatDate(scenario.reservationDate);

    const reservationId = await insertReservation(container.db, {
      tenantId: scenario.tenantId,
      customerId: scenario.customerId,
      menuId: scenario.menuId,
      staffProfileId: scenario.staffProfileId,
      date: dateStr,
      startTime: "10:00",
      endTime: "11:00",
      status: "completed",
      menuName: "Test Menu",
      menuDuration: 60,
      menuPrice: 5000,
      createdBy: "customer",
    });

    await expect(
      updateReservation({
        container,
        headers,
        input: {
          reservationId,
          menuId: scenario.menuId,
          staffProfileId: scenario.staffProfileId,
          date: dateStr,
          startTime: "14:00",
          note: null,
        },
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("cancelledステータスの予約を変更するとConflictErrorが発生する", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db);
    const dateStr = formatDate(scenario.reservationDate);

    const reservationId = await insertReservation(container.db, {
      tenantId: scenario.tenantId,
      customerId: scenario.customerId,
      menuId: scenario.menuId,
      staffProfileId: scenario.staffProfileId,
      date: dateStr,
      startTime: "10:00",
      endTime: "11:00",
      status: "cancelled",
      menuName: "Test Menu",
      menuDuration: 60,
      menuPrice: 5000,
      createdBy: "customer",
    });

    await expect(
      updateReservation({
        container,
        headers,
        input: {
          reservationId,
          menuId: scenario.menuId,
          staffProfileId: scenario.staffProfileId,
          date: dateStr,
          startTime: "14:00",
          note: null,
        },
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("rejectedステータスの予約を変更するとConflictErrorが発生する", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db);
    const dateStr = formatDate(scenario.reservationDate);

    const reservationId = await insertReservation(container.db, {
      tenantId: scenario.tenantId,
      customerId: scenario.customerId,
      menuId: scenario.menuId,
      staffProfileId: scenario.staffProfileId,
      date: dateStr,
      startTime: "10:00",
      endTime: "11:00",
      status: "rejected",
      menuName: "Test Menu",
      menuDuration: 60,
      menuPrice: 5000,
      createdBy: "customer",
    });

    await expect(
      updateReservation({
        container,
        headers,
        input: {
          reservationId,
          menuId: scenario.menuId,
          staffProfileId: scenario.staffProfileId,
          date: dateStr,
          startTime: "14:00",
          note: null,
        },
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("変更先の時間枠に既に予約が入っている場合ConflictErrorが発生する", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db);
    const dateStr = formatDate(scenario.reservationDate);

    // Existing reservation at 14:00
    await insertReservation(container.db, {
      tenantId: scenario.tenantId,
      customerId: scenario.customerId,
      menuId: scenario.menuId,
      staffProfileId: scenario.staffProfileId,
      date: dateStr,
      startTime: "14:00",
      endTime: "15:00",
      status: "confirmed",
      menuName: "Test Menu",
      menuDuration: 60,
      menuPrice: 5000,
      createdBy: "customer",
    });

    // Reservation to update
    const reservationId = await insertReservation(container.db, {
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

    // Try to move to 14:00 which is taken
    await expect(
      updateReservation({
        container,
        headers,
        input: {
          reservationId,
          menuId: scenario.menuId,
          staffProfileId: scenario.staffProfileId,
          date: dateStr,
          startTime: "14:00",
          note: null,
        },
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("存在しないreservationIdを指定するとNotFoundErrorが発生する", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db);

    await expect(
      updateReservation({
        container,
        headers,
        input: {
          reservationId: uuidv7(),
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
    const dateStr = formatDate(scenario.reservationDate);

    const reservationId = await insertReservation(container.db, {
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
      updateReservation({
        container,
        headers,
        input: {
          reservationId,
          menuId: uuidv7(),
          staffProfileId: scenario.staffProfileId,
          date: dateStr,
          startTime: "10:00",
          note: null,
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("変更先の日時がスタッフのシフト外である場合ConflictErrorが発生する", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db, {
      shiftStartTime: "09:00",
      shiftEndTime: "12:00",
    });
    const dateStr = formatDate(scenario.reservationDate);

    const reservationId = await insertReservation(container.db, {
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
      updateReservation({
        container,
        headers,
        input: {
          reservationId,
          menuId: scenario.menuId,
          staffProfileId: scenario.staffProfileId,
          date: dateStr,
          startTime: "14:00",
          note: null,
        },
      }),
    ).rejects.toThrow(ConflictError);
  });

  // ============================================
  // 境界値・エッジケース
  // ============================================

  it("同一の時間枠・メニュー・スタッフで変更する場合、エラーにならない", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db);
    const dateStr = formatDate(scenario.reservationDate);

    const reservationId = await insertReservation(container.db, {
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

    const result = await updateReservation({
      container,
      headers,
      input: {
        reservationId,
        menuId: scenario.menuId,
        staffProfileId: scenario.staffProfileId,
        date: dateStr,
        startTime: "10:00",
        note: null,
      },
    });

    expect(result.id).toBe(reservationId);
  });
});
