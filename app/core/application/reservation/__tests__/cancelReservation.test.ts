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
} from "@/core/application/error";
import { cancelReservation } from "../cancelReservation";
import { getReservation } from "../getReservation";
import {
  formatDate,
  insertReservation,
  setupReservationScenario,
} from "./helpers";

describe("cancelReservation", () => {
  const getContainer = setupTestContainer();
  const headers = createMockHeaders();

  // ============================================
  // 正常系
  // ============================================

  it("confirmedステータスの予約を顧客がキャンセルするとcancelledに遷移する", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db, {
      cancellationDeadlineHours: 24,
      daysFromNow: 14,
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

    await cancelReservation({
      container,
      headers,
      input: {
        reservationId,
        reason: null,
        cancelledBy: "customer",
      },
    });

    const reservation = await getReservation({
      container,
      headers,
      input: { reservationId },
    });
    expect(reservation.status).toBe("cancelled");
  });

  it("pendingステータスの予約を顧客がキャンセルするとcancelledに遷移する", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db, {
      cancellationDeadlineHours: 24,
      daysFromNow: 14,
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
      status: "pending",
      menuName: "Test Menu",
      menuDuration: 60,
      menuPrice: 5000,
      createdBy: "customer",
    });

    await cancelReservation({
      container,
      headers,
      input: {
        reservationId,
        reason: null,
        cancelledBy: "customer",
      },
    });

    const reservation = await getReservation({
      container,
      headers,
      input: { reservationId },
    });
    expect(reservation.status).toBe("cancelled");
  });

  it("キャンセル理由を指定するとキャンセル理由が保存される", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db, {
      cancellationDeadlineHours: 24,
      daysFromNow: 14,
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

    await cancelReservation({
      container,
      headers,
      input: {
        reservationId,
        reason: "Change of plans",
        cancelledBy: "customer",
      },
    });

    const reservation = await getReservation({
      container,
      headers,
      input: { reservationId },
    });
    expect(reservation.cancellationReason).toBe("Change of plans");
  });

  it("キャンセル理由がnullの場合、キャンセル理由なしでcancelledに遷移する", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db, {
      cancellationDeadlineHours: 24,
      daysFromNow: 14,
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

    await cancelReservation({
      container,
      headers,
      input: {
        reservationId,
        reason: null,
        cancelledBy: "customer",
      },
    });

    const reservation = await getReservation({
      container,
      headers,
      input: { reservationId },
    });
    expect(reservation.cancellationReason).toBeNull();
  });

  it("管理者はキャンセル期限に関係なくキャンセルできる", async () => {
    const container = getContainer();
    // Deadline is 24 hours, but reservation is tomorrow at 10:00
    // If "now" is within 24 hours of reservation, customer can't cancel, but admin can
    const scenario = await setupReservationScenario(container.db, {
      cancellationDeadlineHours: 24 * 30, // Very long deadline
      daysFromNow: 1,
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

    await cancelReservation({
      container,
      headers,
      input: {
        reservationId,
        reason: null,
        cancelledBy: "admin",
      },
    });

    const reservation = await getReservation({
      container,
      headers,
      input: { reservationId },
    });
    expect(reservation.status).toBe("cancelled");
  });

  it("スタッフはキャンセル期限に関係なくキャンセルできる", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db, {
      cancellationDeadlineHours: 24 * 30,
      daysFromNow: 1,
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

    await cancelReservation({
      container,
      headers,
      input: {
        reservationId,
        reason: null,
        cancelledBy: "staff",
      },
    });

    const reservation = await getReservation({
      container,
      headers,
      input: { reservationId },
    });
    expect(reservation.status).toBe("cancelled");
  });

  // ============================================
  // 異常系
  // ============================================

  it("顧客がキャンセル期限を過ぎた予約をキャンセルするとForbiddenErrorが発生する", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db, {
      cancellationDeadlineHours: 24 * 30, // Very long deadline makes current time past it
      daysFromNow: 1,
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
      cancelReservation({
        container,
        headers,
        input: {
          reservationId,
          reason: null,
          cancelledBy: "customer",
        },
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("completedステータスの予約をキャンセルするとConflictErrorが発生する", async () => {
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
      cancelReservation({
        container,
        headers,
        input: {
          reservationId,
          reason: null,
          cancelledBy: "admin",
        },
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("cancelledステータスの予約をキャンセルするとConflictErrorが発生する", async () => {
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
      cancelReservation({
        container,
        headers,
        input: {
          reservationId,
          reason: null,
          cancelledBy: "admin",
        },
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("rejectedステータスの予約をキャンセルするとConflictErrorが発生する", async () => {
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
      cancelReservation({
        container,
        headers,
        input: {
          reservationId,
          reason: null,
          cancelledBy: "admin",
        },
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("存在しないreservationIdを指定するとNotFoundErrorが発生する", async () => {
    const container = getContainer();

    await expect(
      cancelReservation({
        container,
        headers,
        input: {
          reservationId: uuidv7(),
          reason: null,
          cancelledBy: "customer",
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
