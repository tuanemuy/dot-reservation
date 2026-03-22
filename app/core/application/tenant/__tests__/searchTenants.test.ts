import { describe, expect, it } from "vitest";
import { deleteTenant } from "@/core/application/tenant/deleteTenant";
import { searchTenants } from "@/core/application/tenant/searchTenants";
import { suspendTenant } from "@/core/application/tenant/suspendTenant";
import {
  createMockHeaders,
  createTestTenant,
  setupTestContainer,
} from "./helpers";

const getContainer = setupTestContainer();

describe("searchTenants", () => {
  it("フィルターなしで全アクティブテナントの一覧とtotalCountが返却される", async () => {
    const container = getContainer();
    await createTestTenant(container, {
      urlPath: "tenant-a01",
      authUserId: "auth-1",
      creatorEmail: "a1@example.com",
    });
    await createTestTenant(container, {
      urlPath: "tenant-a02",
      authUserId: "auth-2",
      creatorEmail: "a2@example.com",
    });

    const result = await searchTenants({
      container,
      headers: createMockHeaders(),
      input: { keyword: null, area: null, category: null, page: 1, limit: 10 },
    });

    expect(result.items.length).toBe(2);
    expect(result.totalCount).toBe(2);
  });

  it("テナントが0件の場合、空の一覧とtotalCount: 0が返却される", async () => {
    const container = getContainer();

    const result = await searchTenants({
      container,
      headers: createMockHeaders(),
      input: { keyword: null, area: null, category: null, page: 1, limit: 10 },
    });

    expect(result.items.length).toBe(0);
    expect(result.totalCount).toBe(0);
  });

  it("名前に'美容'を含むテナントがkeywordで検索される", async () => {
    const container = getContainer();
    await createTestTenant(container, {
      name: "美容院テスト",
      urlPath: "beauty-salon",
      authUserId: "auth-1",
      creatorEmail: "a1@example.com",
    });
    await createTestTenant(container, {
      name: "レストラン",
      urlPath: "restaurant",
      authUserId: "auth-2",
      creatorEmail: "a2@example.com",
    });

    const result = await searchTenants({
      container,
      headers: createMockHeaders(),
      input: {
        keyword: "美容",
        area: null,
        category: null,
        page: 1,
        limit: 10,
      },
    });

    expect(result.items.length).toBe(1);
    expect(result.items[0].name).toBe("美容院テスト");
  });

  it("キーワードに一致するテナントが存在しない場合、空の一覧が返却される", async () => {
    const container = getContainer();
    await createTestTenant(container);

    const result = await searchTenants({
      container,
      headers: createMockHeaders(),
      input: {
        keyword: "存在しないキーワード",
        area: null,
        category: null,
        page: 1,
        limit: 10,
      },
    });

    expect(result.items.length).toBe(0);
  });

  it("カテゴリーで検索できる", async () => {
    const container = getContainer();
    await createTestTenant(container, {
      name: "テナントA",
      category: "美容室",
      urlPath: "tenant-cat1",
      authUserId: "auth-1",
      creatorEmail: "a1@example.com",
    });
    await createTestTenant(container, {
      name: "テナントB",
      category: "飲食店",
      urlPath: "tenant-cat2",
      authUserId: "auth-2",
      creatorEmail: "a2@example.com",
    });

    const result = await searchTenants({
      container,
      headers: createMockHeaders(),
      input: {
        keyword: null,
        area: null,
        category: "美容室",
        page: 1,
        limit: 10,
      },
    });

    expect(result.items.length).toBe(1);
    expect(result.items[0].category).toBe("美容室");
  });

  it("停止中のテナントは検索結果に含まれない", async () => {
    const container = getContainer();
    const active = await createTestTenant(container, {
      name: "アクティブテナント",
      urlPath: "active-tenant",
      authUserId: "auth-1",
      creatorEmail: "a1@example.com",
    });
    const toSuspend = await createTestTenant(container, {
      name: "停止テナント",
      urlPath: "suspended-one",
      authUserId: "auth-2",
      creatorEmail: "a2@example.com",
    });

    await suspendTenant({
      container,
      headers: createMockHeaders(),
      input: { tenantId: toSuspend.id },
    });

    const result = await searchTenants({
      container,
      headers: createMockHeaders(),
      input: { keyword: null, area: null, category: null, page: 1, limit: 10 },
    });

    expect(result.items.length).toBe(1);
    expect(result.items[0].id).toBe(active.id);
  });

  it("ページネーション: page: 1, limit: 10で10件返却される（15件中）", async () => {
    const container = getContainer();
    for (let i = 0; i < 15; i++) {
      await createTestTenant(container, {
        name: `テナント${i}`,
        urlPath: `tenant-pg-${i}`,
        authUserId: `auth-${i}`,
        creatorEmail: `a${i}@example.com`,
      });
    }

    const result = await searchTenants({
      container,
      headers: createMockHeaders(),
      input: { keyword: null, area: null, category: null, page: 1, limit: 10 },
    });

    expect(result.items.length).toBe(10);
    expect(result.totalCount).toBe(15);
  });

  it("ページネーション: page: 2, limit: 10で5件返却される（15件中）", async () => {
    const container = getContainer();
    for (let i = 0; i < 15; i++) {
      await createTestTenant(container, {
        name: `テナント${i}`,
        urlPath: `tenant-pg-${i}`,
        authUserId: `auth-${i}`,
        creatorEmail: `a${i}@example.com`,
      });
    }

    const result = await searchTenants({
      container,
      headers: createMockHeaders(),
      input: { keyword: null, area: null, category: null, page: 2, limit: 10 },
    });

    expect(result.items.length).toBe(5);
    expect(result.totalCount).toBe(15);
  });

  it("ページネーション: page: 2, limit: 10で空の一覧が返却される（5件中）", async () => {
    const container = getContainer();
    for (let i = 0; i < 5; i++) {
      await createTestTenant(container, {
        name: `テナント${i}`,
        urlPath: `tenant-pg-${i}`,
        authUserId: `auth-${i}`,
        creatorEmail: `a${i}@example.com`,
      });
    }

    const result = await searchTenants({
      container,
      headers: createMockHeaders(),
      input: { keyword: null, area: null, category: null, page: 2, limit: 10 },
    });

    expect(result.items.length).toBe(0);
    expect(result.totalCount).toBe(5);
  });

  it("複数条件を組み合わせて検索できる", async () => {
    const container = getContainer();
    await createTestTenant(container, {
      name: "美容院A",
      category: "美容室",
      urlPath: "beauty-multi1",
      authUserId: "auth-1",
      creatorEmail: "a1@example.com",
    });
    await createTestTenant(container, {
      name: "美容院B",
      category: "飲食店",
      urlPath: "beauty-multi2",
      authUserId: "auth-2",
      creatorEmail: "a2@example.com",
    });
    await createTestTenant(container, {
      name: "レストランC",
      category: "美容室",
      urlPath: "rest-multi3",
      authUserId: "auth-3",
      creatorEmail: "a3@example.com",
    });

    const result = await searchTenants({
      container,
      headers: createMockHeaders(),
      input: {
        keyword: "美容院",
        area: null,
        category: "美容室",
        page: 1,
        limit: 10,
      },
    });

    expect(result.items.length).toBe(1);
    expect(result.items[0].name).toBe("美容院A");
  });

  it("削除済みテナントは結果に含まれない", async () => {
    const container = getContainer();
    const active = await createTestTenant(container, {
      name: "残るテナント",
      urlPath: "remaining-one",
      authUserId: "auth-1",
      creatorEmail: "a1@example.com",
    });
    const toDelete = await createTestTenant(container, {
      name: "削除テナント",
      urlPath: "to-delete-one",
      authUserId: "auth-2",
      creatorEmail: "a2@example.com",
    });

    await deleteTenant({
      container,
      headers: createMockHeaders(),
      input: { tenantId: toDelete.id },
    });

    const result = await searchTenants({
      container,
      headers: createMockHeaders(),
      input: { keyword: null, area: null, category: null, page: 1, limit: 10 },
    });

    expect(result.items.length).toBe(1);
    expect(result.items[0].id).toBe(active.id);
  });
});
