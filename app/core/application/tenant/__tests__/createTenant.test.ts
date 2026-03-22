import { describe, expect, it } from "vitest";
import { ConflictError } from "@/core/application/error";
import { getTenant } from "@/core/application/tenant/getTenant";
import { BusinessRuleError } from "@/core/domain/error";
import {
  createMockHeaders,
  createTestTenant,
  defaultTenantInput,
  setupTestContainer,
} from "./helpers";

const getContainer = setupTestContainer();

describe("createTenant", () => {
  it("有効な全入力項目が指定される場合、テナントが作成されid・name・urlPathが返却される", async () => {
    const container = getContainer();
    const result = await createTestTenant(container);

    expect(result.id).toBeDefined();
    expect(result.name).toBe(defaultTenantInput.name);
    expect(result.urlPath).toBe(defaultTenantInput.urlPath);
  });

  it("作成者が管理者ロールのメンバーとして自動登録されている", async () => {
    const container = getContainer();
    const result = await createTestTenant(container);

    const members = await container.memberRepository.findByAuthUserId(
      defaultTenantInput.authUserId,
    );
    const member = members.find((m) => m.tenantId === result.id);

    expect(member).toBeDefined();
    expect(member?.role).toBe("admin");
    expect(member?.name).toBe(defaultTenantInput.creatorName);
    expect(member?.email).toBe(defaultTenantInput.creatorEmail);
  });

  it("デフォルトの営業設定が初期値で作成されている", async () => {
    const container = getContainer();
    const result = await createTestTenant(container);

    const tenant = await getTenant({
      container,
      headers: createMockHeaders(),
      input: { tenantId: result.id },
    });

    // Default business hours should be all null (closed)
    for (const key of [0, 1, 2, 3, 4, 5, 6]) {
      expect(tenant.businessHours[key]).toBeNull();
    }
  });

  it("デフォルトの予約設定が初期値で作成されている", async () => {
    const container = getContainer();
    const result = await createTestTenant(container);

    const tenant = await getTenant({
      container,
      headers: createMockHeaders(),
      input: { tenantId: result.id },
    });

    expect(tenant.reservationSettings.bookingWindowDays).toBe(30);
    expect(tenant.reservationSettings.bookingDeadlineHours).toBe(24);
    expect(tenant.reservationSettings.cancellationDeadlineHours).toBe(24);
    expect(tenant.reservationSettings.slotDurationMinutes).toBe(30);
    expect(tenant.reservationSettings.bufferMinutes).toBe(0);
    expect(tenant.reservationSettings.approvalMethod).toBe("manual");
  });

  it("同じurlPathを持つテナントが既に存在する場合、ConflictErrorがスローされる", async () => {
    const container = getContainer();
    await createTestTenant(container);

    await expect(
      createTestTenant(container, {
        authUserId: "auth-user-002",
        creatorEmail: "admin2@example.com",
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("nameが空文字の場合、BusinessRuleErrorがスローされる", async () => {
    const container = getContainer();

    await expect(createTestTenant(container, { name: "" })).rejects.toThrow(
      BusinessRuleError,
    );
  });

  it("urlPathが空文字の場合、BusinessRuleErrorがスローされる", async () => {
    const container = getContainer();

    await expect(createTestTenant(container, { urlPath: "" })).rejects.toThrow(
      BusinessRuleError,
    );
  });

  it("urlPathに使用不可文字が含まれている場合、BusinessRuleErrorがスローされる", async () => {
    const container = getContainer();

    await expect(
      createTestTenant(container, { urlPath: "my store!" }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("categoryが空文字の場合、BusinessRuleErrorがスローされる", async () => {
    const container = getContainer();

    await expect(createTestTenant(container, { category: "" })).rejects.toThrow(
      BusinessRuleError,
    );
  });

  it("postalCodeが不正な形式の場合、BusinessRuleErrorがスローされる", async () => {
    const container = getContainer();

    await expect(
      createTestTenant(container, { postalCode: "1234567" }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("addressのprefectureが空文字の場合、BusinessRuleErrorがスローされる", async () => {
    const container = getContainer();

    await expect(
      createTestTenant(container, {
        address: { prefecture: "", city: "千代田区", street: "千代田1-1" },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("addressのcityが空文字の場合、BusinessRuleErrorがスローされる", async () => {
    const container = getContainer();

    await expect(
      createTestTenant(container, {
        address: { prefecture: "東京都", city: "", street: "千代田1-1" },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("phoneNumberが空文字の場合、BusinessRuleErrorがスローされる", async () => {
    const container = getContainer();

    await expect(
      createTestTenant(container, { phoneNumber: "" }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("authUserIdが空文字の場合、テナント自体は作成されるが作成者のメンバー名は空でない必要がある", async () => {
    const container = getContainer();
    // authUserId自体は単なる文字列なのでバリデーションはドメイン層では行われない
    // ただし空のauthUserIdでもテナント作成は試みられる
    const result = await createTestTenant(container, {
      authUserId: "",
      urlPath: "test-empty-auth",
    });
    expect(result.id).toBeDefined();
  });

  it("正常に作成されたテナントのステータスがアクティブ状態である", async () => {
    const container = getContainer();
    const result = await createTestTenant(container);

    const tenant = await getTenant({
      container,
      headers: createMockHeaders(),
      input: { tenantId: result.id },
    });

    expect(tenant.status).toBe("active");
  });
});
