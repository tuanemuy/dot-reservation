import { v7 as uuidv7 } from "uuid";
import { describe, expect, it } from "vitest";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { ConflictError, NotFoundError } from "@/core/application/error";
import { approveReservation } from "../approveReservation";
import {
  formatDate,
  insertReservation,
  setupReservationScenario,
} from "./helpers";

describe("approveReservation", () => {
  const getContainer = setupTestContainer();
  const headers = createMockHeaders();

  // ============================================
  // 正常系
  // ============================================

  it("pendingステータスの予約を承認するとconfirmedに遷移する", async () => {
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

    await approveReservation({
      container,
      headers,
      input: { reservationId },
    });

    const { getReservation } = await import("../getReservation");
    const result = await getReservation({
      container,
      headers,
      input: { reservationId },
    });
    expect(result.status).toBe("confirmed");
  });

  // ============================================
  // 異常系
  // ============================================

  it("confirmedステータスの予約を承認するとConflictErrorが発生する", async () => {
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
      approveReservation({
        container,
        headers,
        input: { reservationId },
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("cancelledステータスの予約を承認するとConflictErrorが発生する", async () => {
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
      approveReservation({
        container,
        headers,
        input: { reservationId },
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("completedステータスの予約を承認するとConflictErrorが発生する", async () => {
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
      approveReservation({
        container,
        headers,
        input: { reservationId },
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("rejectedステータスの予約を承認するとConflictErrorが発生する", async () => {
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
      approveReservation({
        container,
        headers,
        input: { reservationId },
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("存在しないreservationIdを指定するとNotFoundErrorが発生する", async () => {
    const container = getContainer();

    await expect(
      approveReservation({
        container,
        headers,
        input: { reservationId: uuidv7() },
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
