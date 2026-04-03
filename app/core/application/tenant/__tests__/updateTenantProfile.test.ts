import { describe, expect, it } from "vitest";
import { ConflictError, NotFoundError } from "@/core/application/error";
import { getTenant } from "@/core/application/tenant/getTenant";
import { updateTenantProfile } from "@/core/application/tenant/updateTenantProfile";
import { BusinessRuleError } from "@/core/domain/error";
import {
  createMockHeaders,
  createTestTenant,
  defaultTenantInput,
  setupTestContainer,
} from "./helpers";

const getContainer = setupTestContainer();

describe("updateTenantProfile", () => {
  it("nameを新しい値に変更して更新できる", async () => {
    const container = getContainer();
    const created = await createTestTenant(container);

    const result = await updateTenantProfile({
      container,
      headers: createMockHeaders(),
      input: {
        tenantId: created.id,
        name: "新しいテナント名",
        category: defaultTenantInput.category,
        urlPath: defaultTenantInput.urlPath,
        postalCode: defaultTenantInput.postalCode,
        address: defaultTenantInput.address,
        phoneNumber: defaultTenantInput.phoneNumber,
        description: null,
        imageUrls: [],
      },
    });

    expect(result.name).toBe("新しいテナント名");
  });

  it("urlPathを新しい値に変更して更新できる", async () => {
    const container = getContainer();
    const created = await createTestTenant(container);

    const result = await updateTenantProfile({
      container,
      headers: createMockHeaders(),
      input: {
        tenantId: created.id,
        name: defaultTenantInput.name,
        category: defaultTenantInput.category,
        urlPath: "new-url-path",
        postalCode: defaultTenantInput.postalCode,
        address: defaultTenantInput.address,
        phoneNumber: defaultTenantInput.phoneNumber,
        description: null,
        imageUrls: [],
      },
    });

    expect(result.urlPath).toBe("new-url-path");
  });

  it("旧urlPathで別のテナントを作成できる（旧urlPathが使用可能になっている）", async () => {
    const container = getContainer();
    const created = await createTestTenant(container);
    const originalUrlPath = defaultTenantInput.urlPath;

    // Change urlPath
    await updateTenantProfile({
      container,
      headers: createMockHeaders(),
      input: {
        tenantId: created.id,
        name: defaultTenantInput.name,
        category: defaultTenantInput.category,
        urlPath: "new-url-path",
        postalCode: defaultTenantInput.postalCode,
        address: defaultTenantInput.address,
        phoneNumber: defaultTenantInput.phoneNumber,
        description: null,
        imageUrls: [],
      },
    });

    // Create a new tenant with the old urlPath
    const newTenant = await createTestTenant(container, {
      authUserId: "auth-user-002",
      creatorEmail: "admin2@example.com",
      urlPath: originalUrlPath,
    });
    expect(newTenant.urlPath).toBe(originalUrlPath);
  });

  it("テナントBが使用中のurlPathに変更しようとするとConflictErrorがスローされる", async () => {
    const container = getContainer();
    const tenantA = await createTestTenant(container);
    await createTestTenant(container, {
      authUserId: "auth-user-002",
      creatorEmail: "admin2@example.com",
      urlPath: "tenant-b-path",
    });

    await expect(
      updateTenantProfile({
        container,
        headers: createMockHeaders(),
        input: {
          tenantId: tenantA.id,
          name: defaultTenantInput.name,
          category: defaultTenantInput.category,
          urlPath: "tenant-b-path",
          postalCode: defaultTenantInput.postalCode,
          address: defaultTenantInput.address,
          phoneNumber: defaultTenantInput.phoneNumber,
          description: null,
          imageUrls: [],
        },
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("descriptionを設定して更新できる", async () => {
    const container = getContainer();
    const created = await createTestTenant(container);

    await updateTenantProfile({
      container,
      headers: createMockHeaders(),
      input: {
        tenantId: created.id,
        name: defaultTenantInput.name,
        category: defaultTenantInput.category,
        urlPath: defaultTenantInput.urlPath,
        postalCode: defaultTenantInput.postalCode,
        address: defaultTenantInput.address,
        phoneNumber: defaultTenantInput.phoneNumber,
        description: "テスト説明文",
        imageUrls: [],
      },
    });

    const tenant = await getTenant({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id },
    });
    expect(tenant.description).toBe("テスト説明文");
  });

  it("descriptionをnullに更新できる", async () => {
    const container = getContainer();
    const created = await createTestTenant(container);

    // First set description
    await updateTenantProfile({
      container,
      headers: createMockHeaders(),
      input: {
        tenantId: created.id,
        name: defaultTenantInput.name,
        category: defaultTenantInput.category,
        urlPath: defaultTenantInput.urlPath,
        postalCode: defaultTenantInput.postalCode,
        address: defaultTenantInput.address,
        phoneNumber: defaultTenantInput.phoneNumber,
        description: "設定済み説明文",
        imageUrls: [],
      },
    });

    // Then set it to null
    await updateTenantProfile({
      container,
      headers: createMockHeaders(),
      input: {
        tenantId: created.id,
        name: defaultTenantInput.name,
        category: defaultTenantInput.category,
        urlPath: defaultTenantInput.urlPath,
        postalCode: defaultTenantInput.postalCode,
        address: defaultTenantInput.address,
        phoneNumber: defaultTenantInput.phoneNumber,
        description: null,
        imageUrls: [],
      },
    });

    const tenant = await getTenant({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id },
    });
    expect(tenant.description).toBeNull();
  });

  it("imageUrlsを10枚以内で設定して正常に更新される", async () => {
    const container = getContainer();
    const created = await createTestTenant(container);

    const imageUrls = Array.from(
      { length: 10 },
      (_, i) => `images/image${i}.jpg`,
    );

    await updateTenantProfile({
      container,
      headers: createMockHeaders(),
      input: {
        tenantId: created.id,
        name: defaultTenantInput.name,
        category: defaultTenantInput.category,
        urlPath: defaultTenantInput.urlPath,
        postalCode: defaultTenantInput.postalCode,
        address: defaultTenantInput.address,
        phoneNumber: defaultTenantInput.phoneNumber,
        description: null,
        imageUrls,
      },
    });

    const tenant = await getTenant({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id },
    });
    expect(tenant.imageUrls).toHaveLength(10);
  });

  it("imageUrlsを11枚以上で設定するとBusinessRuleErrorがスローされる", async () => {
    const container = getContainer();
    const created = await createTestTenant(container);

    const imageUrls = Array.from(
      { length: 11 },
      (_, i) => `images/image${i}.jpg`,
    );

    await expect(
      updateTenantProfile({
        container,
        headers: createMockHeaders(),
        input: {
          tenantId: created.id,
          name: defaultTenantInput.name,
          category: defaultTenantInput.category,
          urlPath: defaultTenantInput.urlPath,
          postalCode: defaultTenantInput.postalCode,
          address: defaultTenantInput.address,
          phoneNumber: defaultTenantInput.phoneNumber,
          description: null,
          imageUrls,
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("imageUrlsを空配列で設定して正常に更新される", async () => {
    const container = getContainer();
    const created = await createTestTenant(container);

    await updateTenantProfile({
      container,
      headers: createMockHeaders(),
      input: {
        tenantId: created.id,
        name: defaultTenantInput.name,
        category: defaultTenantInput.category,
        urlPath: defaultTenantInput.urlPath,
        postalCode: defaultTenantInput.postalCode,
        address: defaultTenantInput.address,
        phoneNumber: defaultTenantInput.phoneNumber,
        description: null,
        imageUrls: [],
      },
    });

    const tenant = await getTenant({
      container,
      headers: createMockHeaders(),
      input: { tenantId: created.id },
    });
    expect(tenant.imageUrls).toHaveLength(0);
  });

  it("存在しないtenantIdを指定するとNotFoundErrorがスローされる", async () => {
    const container = getContainer();

    await expect(
      updateTenantProfile({
        container,
        headers: createMockHeaders(),
        input: {
          tenantId: "non-existent-id",
          name: "test",
          category: "test",
          urlPath: "test-path",
          postalCode: "100-0001",
          address: { prefecture: "東京都", city: "千代田区", street: "1-1" },
          phoneNumber: "03-1234-5678",
          description: null,
          imageUrls: [],
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("nameを空文字に変更するとBusinessRuleErrorがスローされる", async () => {
    const container = getContainer();
    const created = await createTestTenant(container);

    await expect(
      updateTenantProfile({
        container,
        headers: createMockHeaders(),
        input: {
          tenantId: created.id,
          name: "",
          category: defaultTenantInput.category,
          urlPath: defaultTenantInput.urlPath,
          postalCode: defaultTenantInput.postalCode,
          address: defaultTenantInput.address,
          phoneNumber: defaultTenantInput.phoneNumber,
          description: null,
          imageUrls: [],
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("postalCodeを不正な形式に変更するとBusinessRuleErrorがスローされる", async () => {
    const container = getContainer();
    const created = await createTestTenant(container);

    await expect(
      updateTenantProfile({
        container,
        headers: createMockHeaders(),
        input: {
          tenantId: created.id,
          name: defaultTenantInput.name,
          category: defaultTenantInput.category,
          urlPath: defaultTenantInput.urlPath,
          postalCode: "invalid",
          address: defaultTenantInput.address,
          phoneNumber: defaultTenantInput.phoneNumber,
          description: null,
          imageUrls: [],
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("phoneNumberを空文字に変更するとBusinessRuleErrorがスローされる", async () => {
    const container = getContainer();
    const created = await createTestTenant(container);

    await expect(
      updateTenantProfile({
        container,
        headers: createMockHeaders(),
        input: {
          tenantId: created.id,
          name: defaultTenantInput.name,
          category: defaultTenantInput.category,
          urlPath: defaultTenantInput.urlPath,
          postalCode: defaultTenantInput.postalCode,
          address: defaultTenantInput.address,
          phoneNumber: "",
          description: null,
          imageUrls: [],
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("addressのprefectureを空文字に変更するとBusinessRuleErrorがスローされる", async () => {
    const container = getContainer();
    const created = await createTestTenant(container);

    await expect(
      updateTenantProfile({
        container,
        headers: createMockHeaders(),
        input: {
          tenantId: created.id,
          name: defaultTenantInput.name,
          category: defaultTenantInput.category,
          urlPath: defaultTenantInput.urlPath,
          postalCode: defaultTenantInput.postalCode,
          address: { prefecture: "", city: "千代田区", street: "千代田1-1" },
          phoneNumber: defaultTenantInput.phoneNumber,
          description: null,
          imageUrls: [],
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });
});
