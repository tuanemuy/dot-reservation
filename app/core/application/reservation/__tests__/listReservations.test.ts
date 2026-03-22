import { describe, expect, it } from "vitest";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { listReservations } from "../listReservations";
import {
  formatDate,
  futureDate,
  insertCustomer,
  insertReservation,
  setupReservationScenario,
} from "./helpers";

describe("listReservations", () => {
  const getContainer = setupTestContainer();
  const headers = createMockHeaders();

  // ============================================
  // 正常系
  // ============================================

  it("tenantIdを指定してテナント全体の予約一覧が返される", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db);
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

    await insertReservation(container.db, {
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

    const result = await listReservations({
      container,
      headers,
      input: {
        tenantId: scenario.tenantId,
        status: null,
        startDate: null,
        endDate: null,
        page: 1,
        limit: 10,
      },
    });

    expect(result.items).toHaveLength(2);
    expect(result.totalCount).toBe(2);
  });

  it("customerIdを指定して顧客の予約一覧が返される", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db);
    const dateStr = formatDate(scenario.reservationDate);

    // Another customer
    const otherCustomerId = await insertCustomer(container.db);

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

    await insertReservation(container.db, {
      tenantId: scenario.tenantId,
      customerId: otherCustomerId,
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

    const result = await listReservations({
      container,
      headers,
      input: {
        customerId: scenario.customerId,
        status: null,
        startDate: null,
        endDate: null,
        page: 1,
        limit: 10,
      },
    });

    expect(result.items).toHaveLength(1);
    expect(result.totalCount).toBe(1);
    expect(result.items[0].customerId).toBe(scenario.customerId);
  });

  it("staffProfileIdを指定してスタッフの担当予約一覧が返される", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db);
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

    const result = await listReservations({
      container,
      headers,
      input: {
        staffProfileId: scenario.staffProfileId,
        status: null,
        startDate: null,
        endDate: null,
        page: 1,
        limit: 10,
      },
    });

    expect(result.items).toHaveLength(1);
    expect(result.totalCount).toBe(1);
  });

  it("statusにconfirmedを指定するとconfirmedステータスのみ返される", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db);
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

    await insertReservation(container.db, {
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

    const result = await listReservations({
      container,
      headers,
      input: {
        tenantId: scenario.tenantId,
        status: "confirmed",
        startDate: null,
        endDate: null,
        page: 1,
        limit: 10,
      },
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].status).toBe("confirmed");
  });

  it("statusにpendingを指定するとpendingステータスのみ返される", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db);
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

    await insertReservation(container.db, {
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

    const result = await listReservations({
      container,
      headers,
      input: {
        tenantId: scenario.tenantId,
        status: "pending",
        startDate: null,
        endDate: null,
        page: 1,
        limit: 10,
      },
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].status).toBe("pending");
  });

  it("startDateとendDateを指定すると指定日付範囲内の予約のみ返される", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db, {
      daysFromNow: 7,
    });
    const dateStr = formatDate(scenario.reservationDate);

    // Create a reservation on the reservation date
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

    // Create a reservation on a different date
    const otherDate = futureDate(14);
    await insertReservation(container.db, {
      tenantId: scenario.tenantId,
      customerId: scenario.customerId,
      menuId: scenario.menuId,
      staffProfileId: scenario.staffProfileId,
      date: formatDate(otherDate),
      startTime: "10:00",
      endTime: "11:00",
      status: "confirmed",
      menuName: "Test Menu",
      menuDuration: 60,
      menuPrice: 5000,
      createdBy: "customer",
    });

    const result = await listReservations({
      container,
      headers,
      input: {
        tenantId: scenario.tenantId,
        status: null,
        startDate: dateStr,
        endDate: dateStr,
        page: 1,
        limit: 10,
      },
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].date).toBe(dateStr);
  });

  it("ページネーション: page=1でlimit件が返される", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db);
    const dateStr = formatDate(scenario.reservationDate);

    for (let i = 0; i < 15; i++) {
      const hours = 9 + Math.floor(i / 2);
      const mins = (i % 2) * 30;
      const startTime = `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
      const endH = mins + 30 >= 60 ? hours + 1 : hours;
      const endM = (mins + 30) % 60;
      const endTime = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
      await insertReservation(container.db, {
        tenantId: scenario.tenantId,
        customerId: scenario.customerId,
        menuId: scenario.menuId,
        staffProfileId: scenario.staffProfileId,
        date: dateStr,
        startTime,
        endTime,
        status: "confirmed",
        menuName: "Test Menu",
        menuDuration: 30,
        menuPrice: 5000,
        createdBy: "customer",
      });
    }

    const result = await listReservations({
      container,
      headers,
      input: {
        tenantId: scenario.tenantId,
        status: null,
        startDate: null,
        endDate: null,
        page: 1,
        limit: 10,
      },
    });

    expect(result.items).toHaveLength(10);
    expect(result.totalCount).toBe(15);
  });

  it("ページネーション: page=2で残りの件数が返される", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db);
    const dateStr = formatDate(scenario.reservationDate);

    for (let i = 0; i < 15; i++) {
      const hours = 9 + Math.floor(i / 2);
      const mins = (i % 2) * 30;
      const startTime = `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
      const endH = mins + 30 >= 60 ? hours + 1 : hours;
      const endM = (mins + 30) % 60;
      const endTime = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
      await insertReservation(container.db, {
        tenantId: scenario.tenantId,
        customerId: scenario.customerId,
        menuId: scenario.menuId,
        staffProfileId: scenario.staffProfileId,
        date: dateStr,
        startTime,
        endTime,
        status: "confirmed",
        menuName: "Test Menu",
        menuDuration: 30,
        menuPrice: 5000,
        createdBy: "customer",
      });
    }

    const result = await listReservations({
      container,
      headers,
      input: {
        tenantId: scenario.tenantId,
        status: null,
        startDate: null,
        endDate: null,
        page: 2,
        limit: 10,
      },
    });

    expect(result.items).toHaveLength(5);
    expect(result.totalCount).toBe(15);
  });

  // ============================================
  // 異常系
  // ============================================

  it("該当する予約が存在しない場合、空配列とtotalCount=0が返される", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db);

    const result = await listReservations({
      container,
      headers,
      input: {
        tenantId: scenario.tenantId,
        status: null,
        startDate: null,
        endDate: null,
        page: 1,
        limit: 10,
      },
    });

    expect(result.items).toHaveLength(0);
    expect(result.totalCount).toBe(0);
  });

  // ============================================
  // 境界値・エッジケース
  // ============================================

  it("page=2で予約件数がlimitちょうどの場合、空配列が返される", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db);
    const dateStr = formatDate(scenario.reservationDate);

    for (let i = 0; i < 10; i++) {
      const hours = 9 + Math.floor(i / 2);
      const mins = (i % 2) * 30;
      const startTime = `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
      const endH = mins + 30 >= 60 ? hours + 1 : hours;
      const endM = (mins + 30) % 60;
      const endTime = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
      await insertReservation(container.db, {
        tenantId: scenario.tenantId,
        customerId: scenario.customerId,
        menuId: scenario.menuId,
        staffProfileId: scenario.staffProfileId,
        date: dateStr,
        startTime,
        endTime,
        status: "confirmed",
        menuName: "Test Menu",
        menuDuration: 30,
        menuPrice: 5000,
        createdBy: "customer",
      });
    }

    const result = await listReservations({
      container,
      headers,
      input: {
        tenantId: scenario.tenantId,
        status: null,
        startDate: null,
        endDate: null,
        page: 2,
        limit: 10,
      },
    });

    expect(result.items).toHaveLength(0);
    expect(result.totalCount).toBe(10);
  });

  it("statusがnullの場合、すべてのステータスの予約が返される", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db);
    const dateStr = formatDate(scenario.reservationDate);

    const statuses = [
      "confirmed",
      "pending",
      "cancelled",
      "completed",
      "rejected",
    ];
    for (let i = 0; i < statuses.length; i++) {
      await insertReservation(container.db, {
        tenantId: scenario.tenantId,
        customerId: scenario.customerId,
        menuId: scenario.menuId,
        staffProfileId: scenario.staffProfileId,
        date: dateStr,
        startTime: `${String(10 + i).padStart(2, "0")}:00`,
        endTime: `${String(11 + i).padStart(2, "0")}:00`,
        status: statuses[i],
        menuName: "Test Menu",
        menuDuration: 60,
        menuPrice: 5000,
        createdBy: "customer",
      });
    }

    const result = await listReservations({
      container,
      headers,
      input: {
        tenantId: scenario.tenantId,
        status: null,
        startDate: null,
        endDate: null,
        page: 1,
        limit: 10,
      },
    });

    expect(result.items).toHaveLength(5);
    expect(result.totalCount).toBe(5);
  });
});
