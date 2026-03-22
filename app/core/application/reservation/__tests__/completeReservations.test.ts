import { describe, expect, it } from "vitest";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { completeReservations } from "../completeReservations";
import { getReservation } from "../getReservation";
import {
  formatDate,
  insertReservation,
  setupReservationScenario,
} from "./helpers";

describe("completeReservations", () => {
  const getContainer = setupTestContainer();
  const headers = createMockHeaders();

  // ============================================
  // 正常系
  // ============================================

  it("終了時刻を過ぎたconfirmedの予約1件がcompletedに遷移し、completedCountが1で返される", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db, {
      daysFromNow: -1,
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

    const now = new Date();
    const result = await completeReservations({
      container,
      headers,
      input: { now },
    });

    expect(result.completedCount).toBe(1);

    const reservation = await getReservation({
      container,
      headers,
      input: { reservationId },
    });
    expect(reservation.status).toBe("completed");
  });

  it("終了時刻を過ぎたconfirmedの予約が複数件ある場合、すべてcompletedに遷移する", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db, {
      daysFromNow: -1,
    });
    const dateStr = formatDate(scenario.reservationDate);

    const id1 = await insertReservation(container.db, {
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

    const id2 = await insertReservation(container.db, {
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

    const now = new Date();
    const result = await completeReservations({
      container,
      headers,
      input: { now },
    });

    expect(result.completedCount).toBe(2);

    const r1 = await getReservation({
      container,
      headers,
      input: { reservationId: id1 },
    });
    const r2 = await getReservation({
      container,
      headers,
      input: { reservationId: id2 },
    });
    expect(r1.status).toBe("completed");
    expect(r2.status).toBe("completed");
  });

  it("対象となる予約が存在しない場合、completedCountが0で返される", async () => {
    const container = getContainer();

    const now = new Date();
    const result = await completeReservations({
      container,
      headers,
      input: { now },
    });

    expect(result.completedCount).toBe(0);
  });

  // ============================================
  // 異常系
  // ============================================

  it("pendingステータスの予約は対象外でcompletedに遷移しない", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db, {
      daysFromNow: -1,
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

    const now = new Date();
    const result = await completeReservations({
      container,
      headers,
      input: { now },
    });

    expect(result.completedCount).toBe(0);

    const reservation = await getReservation({
      container,
      headers,
      input: { reservationId },
    });
    expect(reservation.status).toBe("pending");
  });

  it("cancelledステータスの予約は対象外でcompletedに遷移しない", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db, {
      daysFromNow: -1,
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
      status: "cancelled",
      menuName: "Test Menu",
      menuDuration: 60,
      menuPrice: 5000,
      createdBy: "customer",
    });

    const now = new Date();
    const result = await completeReservations({
      container,
      headers,
      input: { now },
    });

    expect(result.completedCount).toBe(0);
  });

  it("rejectedステータスの予約は対象外でcompletedに遷移しない", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db, {
      daysFromNow: -1,
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
      status: "rejected",
      menuName: "Test Menu",
      menuDuration: 60,
      menuPrice: 5000,
      createdBy: "customer",
    });

    const now = new Date();
    const result = await completeReservations({
      container,
      headers,
      input: { now },
    });

    expect(result.completedCount).toBe(0);
  });

  it("既にcompletedステータスの予約は対象外で二重処理されない", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db, {
      daysFromNow: -1,
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
      status: "completed",
      menuName: "Test Menu",
      menuDuration: 60,
      menuPrice: 5000,
      createdBy: "customer",
    });

    const now = new Date();
    const result = await completeReservations({
      container,
      headers,
      input: { now },
    });

    expect(result.completedCount).toBe(0);
  });

  // ============================================
  // 境界値・エッジケース
  // ============================================

  it("confirmedとpendingが混在しており両方とも終了時刻を過ぎている場合、confirmedのみcompletedに遷移する", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db, {
      daysFromNow: -1,
    });
    const dateStr = formatDate(scenario.reservationDate);

    const confirmedId = await insertReservation(container.db, {
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

    const pendingId = await insertReservation(container.db, {
      tenantId: scenario.tenantId,
      customerId: scenario.customerId,
      menuId: scenario.menuId,
      staffProfileId: scenario.staffProfileId,
      date: dateStr,
      startTime: "14:00",
      endTime: "15:00",
      status: "pending",
      menuName: "Test Menu",
      menuDuration: 60,
      menuPrice: 5000,
      createdBy: "customer",
    });

    const now = new Date();
    const result = await completeReservations({
      container,
      headers,
      input: { now },
    });

    expect(result.completedCount).toBe(1);

    const confirmed = await getReservation({
      container,
      headers,
      input: { reservationId: confirmedId },
    });
    const pending = await getReservation({
      container,
      headers,
      input: { reservationId: pendingId },
    });
    expect(confirmed.status).toBe("completed");
    expect(pending.status).toBe("pending");
  });
});
