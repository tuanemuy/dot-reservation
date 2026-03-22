import { v7 as uuidv7 } from "uuid";
import { describe, expect, it } from "vitest";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { NotFoundError } from "@/core/application/error";
import { getReservation } from "../getReservation";
import {
  formatDate,
  insertReservation,
  setupReservationScenario,
} from "./helpers";

describe("getReservation", () => {
  const getContainer = setupTestContainer();
  const headers = createMockHeaders();

  // ============================================
  // 正常系
  // ============================================

  it("有効な予約の全フィールドが返される", async () => {
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
      staffName: "Test Staff",
      customerName: "Test Customer",
      customerEmail: "customer@example.com",
      customerPhoneNumber: "090-1234-5678",
      note: "Test note",
      createdBy: "customer",
    });

    const result = await getReservation({
      container,
      headers,
      input: { reservationId },
    });

    expect(result.id).toBe(reservationId);
    expect(result.tenantId).toBe(scenario.tenantId);
    expect(result.customerId).toBe(scenario.customerId);
    expect(result.menuName).toBe("Test Menu");
    expect(result.menuDuration).toBe(60);
    expect(result.menuPrice).toBe(5000);
    expect(result.staffName).toBe("Test Staff");
    expect(result.date).toBe(dateStr);
    expect(result.startTime).toBe("10:00");
    expect(result.endTime).toBe("11:00");
    expect(result.status).toBe("confirmed");
    expect(result.customerName).toBe("Test Customer");
    expect(result.customerEmail).toBe("customer@example.com");
    expect(result.customerPhoneNumber).toBe("090-1234-5678");
    expect(result.note).toBe("Test note");
    expect(result.createdBy).toBe("customer");
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it("customerIdがnullの予約でもcustomerIdがnullで返される", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db);
    const dateStr = formatDate(scenario.reservationDate);

    const reservationId = await insertReservation(container.db, {
      tenantId: scenario.tenantId,
      customerId: null,
      menuId: scenario.menuId,
      staffProfileId: scenario.staffProfileId,
      date: dateStr,
      startTime: "10:00",
      endTime: "11:00",
      status: "confirmed",
      menuName: "Test Menu",
      menuDuration: 60,
      menuPrice: 5000,
      customerName: "Walk-in Customer",
      createdBy: "admin",
    });

    const result = await getReservation({
      container,
      headers,
      input: { reservationId },
    });

    expect(result.customerId).toBeNull();
    expect(result.customerName).toBe("Walk-in Customer");
  });

  it("キャンセル済みでキャンセル理由がある予約のcancellationReasonが返される", async () => {
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
      cancellationReason: "Schedule conflict",
      createdBy: "customer",
    });

    const result = await getReservation({
      container,
      headers,
      input: { reservationId },
    });

    expect(result.status).toBe("cancelled");
    expect(result.cancellationReason).toBe("Schedule conflict");
  });

  it("却下済みで却下理由がある予約のrejectionReasonが返される", async () => {
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
      rejectionReason: "Fully booked",
      createdBy: "customer",
    });

    const result = await getReservation({
      container,
      headers,
      input: { reservationId },
    });

    expect(result.status).toBe("rejected");
    expect(result.rejectionReason).toBe("Fully booked");
  });

  it("メニューのスナップショットが保存されている予約のスナップショットが返される", async () => {
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
      menuName: "Snapshot Menu Name",
      menuDuration: 90,
      menuPrice: 8000,
      createdBy: "customer",
    });

    const result = await getReservation({
      container,
      headers,
      input: { reservationId },
    });

    expect(result.menuName).toBe("Snapshot Menu Name");
    expect(result.menuDuration).toBe(90);
    expect(result.menuPrice).toBe(8000);
  });

  // ============================================
  // 異常系
  // ============================================

  it("存在しないreservationIdを指定するとNotFoundErrorが発生する", async () => {
    const container = getContainer();

    await expect(
      getReservation({
        container,
        headers,
        input: { reservationId: uuidv7() },
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
