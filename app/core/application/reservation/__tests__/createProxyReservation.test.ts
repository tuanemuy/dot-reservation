import { v7 as uuidv7 } from "uuid";
import { describe, expect, it } from "vitest";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { ConflictError, NotFoundError } from "@/core/application/error";
import { createProxyReservation } from "../createProxyReservation";
import { getReservation } from "../getReservation";
import {
  formatDate,
  insertReservation,
  setupReservationScenario,
} from "./helpers";

describe("createProxyReservation", () => {
  const getContainer = setupTestContainer();
  const headers = createMockHeaders();

  // ============================================
  // 正常系
  // ============================================

  it("管理者が有効な入力で代理登録するとconfirmedステータスで作成される", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db);

    const result = await createProxyReservation({
      container,
      headers,
      input: {
        tenantId: scenario.tenantId,
        customerId: scenario.customerId,
        customerName: "Test Customer",
        customerEmail: "customer@example.com",
        customerPhoneNumber: "090-1234-5678",
        menuId: scenario.menuId,
        staffProfileId: scenario.staffProfileId,
        date: formatDate(scenario.reservationDate),
        startTime: "10:00",
        note: null,
        createdBy: "admin",
      },
    });

    expect(result.id).toBeDefined();

    const reservation = await getReservation({
      container,
      headers,
      input: { reservationId: result.id },
    });
    expect(reservation.status).toBe("confirmed");
  });

  it("スタッフが代理登録するとconfirmedステータスで作成される", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db);

    const result = await createProxyReservation({
      container,
      headers,
      input: {
        tenantId: scenario.tenantId,
        customerId: scenario.customerId,
        customerName: "Test Customer",
        customerEmail: "customer@example.com",
        customerPhoneNumber: "090-1234-5678",
        menuId: scenario.menuId,
        staffProfileId: scenario.staffProfileId,
        date: formatDate(scenario.reservationDate),
        startTime: "10:00",
        note: null,
        createdBy: "staff",
      },
    });

    expect(result.id).toBeDefined();

    const reservation = await getReservation({
      container,
      headers,
      input: { reservationId: result.id },
    });
    expect(reservation.status).toBe("confirmed");
  });

  it("既存顧客のcustomerIdを指定すると既存顧客に紐づいた予約が作成される", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db);

    const result = await createProxyReservation({
      container,
      headers,
      input: {
        tenantId: scenario.tenantId,
        customerId: scenario.customerId,
        customerName: "Test Customer",
        customerEmail: "customer@example.com",
        customerPhoneNumber: null,
        menuId: scenario.menuId,
        staffProfileId: scenario.staffProfileId,
        date: formatDate(scenario.reservationDate),
        startTime: "10:00",
        note: null,
        createdBy: "admin",
      },
    });

    const reservation = await getReservation({
      container,
      headers,
      input: { reservationId: result.id },
    });
    expect(reservation.customerId).toBe(scenario.customerId);
  });

  it("customerIdがnullの場合、顧客名等が予約に保存される", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db);

    const result = await createProxyReservation({
      container,
      headers,
      input: {
        tenantId: scenario.tenantId,
        customerId: null,
        customerName: "Walk-in Customer",
        customerEmail: "walkin@example.com",
        customerPhoneNumber: "090-9999-8888",
        menuId: scenario.menuId,
        staffProfileId: scenario.staffProfileId,
        date: formatDate(scenario.reservationDate),
        startTime: "10:00",
        note: null,
        createdBy: "admin",
      },
    });

    const reservation = await getReservation({
      container,
      headers,
      input: { reservationId: result.id },
    });
    expect(reservation.customerId).toBeNull();
    expect(reservation.customerName).toBe("Walk-in Customer");
    expect(reservation.customerEmail).toBe("walkin@example.com");
    expect(reservation.customerPhoneNumber).toBe("090-9999-8888");
  });

  it("createdByがadminとして記録される", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db);

    const result = await createProxyReservation({
      container,
      headers,
      input: {
        tenantId: scenario.tenantId,
        customerId: null,
        customerName: "Customer",
        customerEmail: null,
        customerPhoneNumber: null,
        menuId: scenario.menuId,
        staffProfileId: scenario.staffProfileId,
        date: formatDate(scenario.reservationDate),
        startTime: "10:00",
        note: null,
        createdBy: "admin",
      },
    });

    const reservation = await getReservation({
      container,
      headers,
      input: { reservationId: result.id },
    });
    expect(reservation.createdBy).toBe("admin");
  });

  it("createdByがstaffとして記録される", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db);

    const result = await createProxyReservation({
      container,
      headers,
      input: {
        tenantId: scenario.tenantId,
        customerId: null,
        customerName: "Customer",
        customerEmail: null,
        customerPhoneNumber: null,
        menuId: scenario.menuId,
        staffProfileId: scenario.staffProfileId,
        date: formatDate(scenario.reservationDate),
        startTime: "10:00",
        note: null,
        createdBy: "staff",
      },
    });

    const reservation = await getReservation({
      container,
      headers,
      input: { reservationId: result.id },
    });
    expect(reservation.createdBy).toBe("staff");
  });

  it("noteにテキストを指定すると備考が保存される", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db);

    const result = await createProxyReservation({
      container,
      headers,
      input: {
        tenantId: scenario.tenantId,
        customerId: null,
        customerName: "Customer",
        customerEmail: null,
        customerPhoneNumber: null,
        menuId: scenario.menuId,
        staffProfileId: scenario.staffProfileId,
        date: formatDate(scenario.reservationDate),
        startTime: "10:00",
        note: "VIP customer",
        createdBy: "admin",
      },
    });

    const reservation = await getReservation({
      container,
      headers,
      input: { reservationId: result.id },
    });
    expect(reservation.note).toBe("VIP customer");
  });

  it("手動承認テナントでも代理登録はconfirmedステータスで作成される", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db, {
      approvalMethod: "manual",
    });

    const result = await createProxyReservation({
      container,
      headers,
      input: {
        tenantId: scenario.tenantId,
        customerId: null,
        customerName: "Customer",
        customerEmail: null,
        customerPhoneNumber: null,
        menuId: scenario.menuId,
        staffProfileId: scenario.staffProfileId,
        date: formatDate(scenario.reservationDate),
        startTime: "10:00",
        note: null,
        createdBy: "admin",
      },
    });

    const reservation = await getReservation({
      container,
      headers,
      input: { reservationId: result.id },
    });
    expect(reservation.status).toBe("confirmed");
  });

  // ============================================
  // 異常系
  // ============================================

  it("指定した時間枠に既に予約が入っている場合ConflictErrorが発生する", async () => {
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

    await expect(
      createProxyReservation({
        container,
        headers,
        input: {
          tenantId: scenario.tenantId,
          customerId: null,
          customerName: "Customer",
          customerEmail: null,
          customerPhoneNumber: null,
          menuId: scenario.menuId,
          staffProfileId: scenario.staffProfileId,
          date: dateStr,
          startTime: "10:00",
          note: null,
          createdBy: "admin",
        },
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("存在しないtenantIdを指定するとNotFoundErrorが発生する", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db);

    await expect(
      createProxyReservation({
        container,
        headers,
        input: {
          tenantId: uuidv7(),
          customerId: null,
          customerName: "Customer",
          customerEmail: null,
          customerPhoneNumber: null,
          menuId: scenario.menuId,
          staffProfileId: scenario.staffProfileId,
          date: formatDate(scenario.reservationDate),
          startTime: "10:00",
          note: null,
          createdBy: "admin",
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("存在しないmenuIdを指定するとNotFoundErrorが発生する", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db);

    await expect(
      createProxyReservation({
        container,
        headers,
        input: {
          tenantId: scenario.tenantId,
          customerId: null,
          customerName: "Customer",
          customerEmail: null,
          customerPhoneNumber: null,
          menuId: uuidv7(),
          staffProfileId: scenario.staffProfileId,
          date: formatDate(scenario.reservationDate),
          startTime: "10:00",
          note: null,
          createdBy: "admin",
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("存在しないstaffProfileIdを指定するとNotFoundErrorが発生する", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db);

    await expect(
      createProxyReservation({
        container,
        headers,
        input: {
          tenantId: scenario.tenantId,
          customerId: null,
          customerName: "Customer",
          customerEmail: null,
          customerPhoneNumber: null,
          menuId: scenario.menuId,
          staffProfileId: uuidv7(),
          date: formatDate(scenario.reservationDate),
          startTime: "10:00",
          note: null,
          createdBy: "admin",
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  // ============================================
  // 境界値・エッジケース
  // ============================================

  it("customerIdとcustomerEmailの両方がnullの場合、メール送信なしで予約が作成される", async () => {
    const container = getContainer();
    const scenario = await setupReservationScenario(container.db);

    const result = await createProxyReservation({
      container,
      headers,
      input: {
        tenantId: scenario.tenantId,
        customerId: null,
        customerName: "No-email Customer",
        customerEmail: null,
        customerPhoneNumber: null,
        menuId: scenario.menuId,
        staffProfileId: scenario.staffProfileId,
        date: formatDate(scenario.reservationDate),
        startTime: "10:00",
        note: null,
        createdBy: "admin",
      },
    });

    expect(result.id).toBeDefined();

    const reservation = await getReservation({
      container,
      headers,
      input: { reservationId: result.id },
    });
    expect(reservation.customerId).toBeNull();
    expect(reservation.customerEmail).toBeNull();
  });
});
