import { v7 as uuidv7 } from "uuid";
import { describe, expect, it } from "vitest";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { ConflictError, NotFoundError } from "@/core/application/error";
import { rejectReservation } from "../rejectReservation";
import {
  formatDate,
  insertReservation,
  setupReservationScenario,
} from "./helpers";

describe("rejectReservation", () => {
  const getContainer = setupTestContainer();
  const headers = createMockHeaders();

  // ============================================
  // 正常系
  // ============================================

  it("pendingステータスの予約を却下するとrejectedに遷移する", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db, {
      approvalMethod: "manual",
    });

    const reservationId = await insertReservation(container.db, {
      tenantId: scenario.tenantId,
      customerId: scenario.customerId,
      menuId: scenario.menuId,
      staffProfileId: scenario.staffProfileId,
      date: formatDate(scenario.reservationDate),
      startTime: "10:00",
      endTime: "11:00",
      status: "pending",
      menuName: "Test Menu",
      menuDuration: 60,
      menuPrice: 5000,
      createdBy: "customer",
    });

    await rejectReservation({
      container,
      headers,
      input: { reservationId, reason: null },
    });

    const { getReservation } = await import("../getReservation");
    const result = await getReservation({
      container,
      headers,
      input: { reservationId },
    });
    expect(result.status).toBe("rejected");
  });

  it("却下理由を指定すると却下理由が保存される", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db, {
      approvalMethod: "manual",
    });

    const reservationId = await insertReservation(container.db, {
      tenantId: scenario.tenantId,
      customerId: scenario.customerId,
      menuId: scenario.menuId,
      staffProfileId: scenario.staffProfileId,
      date: formatDate(scenario.reservationDate),
      startTime: "10:00",
      endTime: "11:00",
      status: "pending",
      menuName: "Test Menu",
      menuDuration: 60,
      menuPrice: 5000,
      createdBy: "customer",
    });

    await rejectReservation({
      container,
      headers,
      input: { reservationId, reason: "Fully booked" },
    });

    const { getReservation } = await import("../getReservation");
    const result = await getReservation({
      container,
      headers,
      input: { reservationId },
    });
    expect(result.status).toBe("rejected");
    expect(result.rejectionReason).toBe("Fully booked");
  });

  it("却下理由がnullの場合、却下理由なしでrejectedに遷移する", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db, {
      approvalMethod: "manual",
    });

    const reservationId = await insertReservation(container.db, {
      tenantId: scenario.tenantId,
      customerId: scenario.customerId,
      menuId: scenario.menuId,
      staffProfileId: scenario.staffProfileId,
      date: formatDate(scenario.reservationDate),
      startTime: "10:00",
      endTime: "11:00",
      status: "pending",
      menuName: "Test Menu",
      menuDuration: 60,
      menuPrice: 5000,
      createdBy: "customer",
    });

    await rejectReservation({
      container,
      headers,
      input: { reservationId, reason: null },
    });

    const { getReservation } = await import("../getReservation");
    const result = await getReservation({
      container,
      headers,
      input: { reservationId },
    });
    expect(result.status).toBe("rejected");
    expect(result.rejectionReason).toBeNull();
  });

  // ============================================
  // 異常系
  // ============================================

  it("confirmedステータスの予約を却下するとConflictErrorが発生する", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db);

    const reservationId = await insertReservation(container.db, {
      tenantId: scenario.tenantId,
      customerId: scenario.customerId,
      menuId: scenario.menuId,
      staffProfileId: scenario.staffProfileId,
      date: formatDate(scenario.reservationDate),
      startTime: "10:00",
      endTime: "11:00",
      status: "confirmed",
      menuName: "Test Menu",
      menuDuration: 60,
      menuPrice: 5000,
      createdBy: "customer",
    });

    await expect(
      rejectReservation({
        container,
        headers,
        input: { reservationId, reason: null },
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("cancelledステータスの予約を却下するとConflictErrorが発生する", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db);

    const reservationId = await insertReservation(container.db, {
      tenantId: scenario.tenantId,
      customerId: scenario.customerId,
      menuId: scenario.menuId,
      staffProfileId: scenario.staffProfileId,
      date: formatDate(scenario.reservationDate),
      startTime: "10:00",
      endTime: "11:00",
      status: "cancelled",
      menuName: "Test Menu",
      menuDuration: 60,
      menuPrice: 5000,
      createdBy: "customer",
    });

    await expect(
      rejectReservation({
        container,
        headers,
        input: { reservationId, reason: null },
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("completedステータスの予約を却下するとConflictErrorが発生する", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db);

    const reservationId = await insertReservation(container.db, {
      tenantId: scenario.tenantId,
      customerId: scenario.customerId,
      menuId: scenario.menuId,
      staffProfileId: scenario.staffProfileId,
      date: formatDate(scenario.reservationDate),
      startTime: "10:00",
      endTime: "11:00",
      status: "completed",
      menuName: "Test Menu",
      menuDuration: 60,
      menuPrice: 5000,
      createdBy: "customer",
    });

    await expect(
      rejectReservation({
        container,
        headers,
        input: { reservationId, reason: null },
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("rejectedステータスの予約を却下するとConflictErrorが発生する", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db);

    const reservationId = await insertReservation(container.db, {
      tenantId: scenario.tenantId,
      customerId: scenario.customerId,
      menuId: scenario.menuId,
      staffProfileId: scenario.staffProfileId,
      date: formatDate(scenario.reservationDate),
      startTime: "10:00",
      endTime: "11:00",
      status: "rejected",
      menuName: "Test Menu",
      menuDuration: 60,
      menuPrice: 5000,
      createdBy: "customer",
    });

    await expect(
      rejectReservation({
        container,
        headers,
        input: { reservationId, reason: null },
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("存在しないreservationIdを指定するとNotFoundErrorが発生する", async () => {
    const container = getContainer();

    await expect(
      rejectReservation({
        container,
        headers,
        input: { reservationId: uuidv7(), reason: null },
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
