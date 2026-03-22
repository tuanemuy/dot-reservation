import { describe, expect, it } from "vitest";
import { listTenants } from "@/core/application/tenant/listTenants";
import { suspendTenant } from "@/core/application/tenant/suspendTenant";
import {
  createMockHeaders,
  createTestTenant,
  setupTestContainer,
} from "./helpers";

const getContainer = setupTestContainer();

describe("listTenants", () => {
  it("フィルターなしで全テナントの一覧とtotalCountが返却される", async () => {
    const container = getContainer();
    await createTestTenant(container, {
      urlPath: "list-t01",
      authUserId: "auth-1",
      creatorEmail: "a1@example.com",
    });
    await createTestTenant(container, {
      urlPath: "list-t02",
      authUserId: "auth-2",
      creatorEmail: "a2@example.com",
    });

    const result = await listTenants({
      container,
      headers: createMockHeaders(),
      input: {
        keyword: null,
        status: null,
        category: null,
        page: 1,
        limit: 10,
      },
    });

    expect(result.items.length).toBe(2);
    expect(result.totalCount).toBe(2);
  });

  it("テナントが0件の場合、空の一覧とtotalCount: 0が返却される", async () => {
    const container = getContainer();

    const result = await listTenants({
      container,
      headers: createMockHeaders(),
      input: {
        keyword: null,
        status: null,
        category: null,
        page: 1,
        limit: 10,
      },
    });

    expect(result.items.length).toBe(0);
    expect(result.totalCount).toBe(0);
  });

  it("名前に'美容'を含むテナントがkeywordで検索される", async () => {
    const container = getContainer();
    await createTestTenant(container, {
      name: "美容院テスト",
      urlPath: "beauty-list",
      authUserId: "auth-1",
      creatorEmail: "a1@example.com",
    });
    await createTestTenant(container, {
      name: "レストラン",
      urlPath: "restaurant-list",
      authUserId: "auth-2",
      creatorEmail: "a2@example.com",
    });

    const result = await listTenants({
      container,
      headers: createMockHeaders(),
      input: {
        keyword: "美容",
        status: null,
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

    const result = await listTenants({
      container,
      headers: createMockHeaders(),
      input: {
        keyword: "存在しないキーワード",
        status: null,
        category: null,
        page: 1,
        limit: 10,
      },
    });

    expect(result.items.length).toBe(0);
  });

  it("status: 'active'でアクティブなテナントのみ返却される", async () => {
    const container = getContainer();
    await createTestTenant(container, {
      name: "アクティブ",
      urlPath: "active-list",
      authUserId: "auth-1",
      creatorEmail: "a1@example.com",
    });
    const toSuspend = await createTestTenant(container, {
      name: "停止予定",
      urlPath: "suspend-list",
      authUserId: "auth-2",
      creatorEmail: "a2@example.com",
    });

    await suspendTenant({
      container,
      headers: createMockHeaders(),
      input: { tenantId: toSuspend.id },
    });

    const result = await listTenants({
      container,
      headers: createMockHeaders(),
      input: {
        keyword: null,
        status: "active",
        category: null,
        page: 1,
        limit: 10,
      },
    });

    expect(result.items.every((t) => t.status === "active")).toBe(true);
    expect(result.items.length).toBe(1);
  });

  it("status: 'suspended'で停止中のテナントのみ返却される", async () => {
    const container = getContainer();
    await createTestTenant(container, {
      name: "アクティブ",
      urlPath: "active-list2",
      authUserId: "auth-1",
      creatorEmail: "a1@example.com",
    });
    const toSuspend = await createTestTenant(container, {
      name: "停止予定",
      urlPath: "suspend-list2",
      authUserId: "auth-2",
      creatorEmail: "a2@example.com",
    });

    await suspendTenant({
      container,
      headers: createMockHeaders(),
      input: { tenantId: toSuspend.id },
    });

    const result = await listTenants({
      container,
      headers: createMockHeaders(),
      input: {
        keyword: null,
        status: "suspended",
        category: null,
        page: 1,
        limit: 10,
      },
    });

    expect(result.items.every((t) => t.status === "suspended")).toBe(true);
    expect(result.items.length).toBe(1);
  });

  it("カテゴリーで絞り込みできる", async () => {
    const container = getContainer();
    await createTestTenant(container, {
      name: "テナントA",
      category: "美容室",
      urlPath: "list-cat1",
      authUserId: "auth-1",
      creatorEmail: "a1@example.com",
    });
    await createTestTenant(container, {
      name: "テナントB",
      category: "飲食店",
      urlPath: "list-cat2",
      authUserId: "auth-2",
      creatorEmail: "a2@example.com",
    });

    const result = await listTenants({
      container,
      headers: createMockHeaders(),
      input: {
        keyword: null,
        status: null,
        category: "美容室",
        page: 1,
        limit: 10,
      },
    });

    expect(result.items.length).toBe(1);
    expect(result.items[0].category).toBe("美容室");
  });

  it("ページネーション: page: 1, limit: 10で10件返却される（15件中）", async () => {
    const container = getContainer();
    for (let i = 0; i < 15; i++) {
      await createTestTenant(container, {
        name: `テナント${i}`,
        urlPath: `list-pg-${i}`,
        authUserId: `auth-${i}`,
        creatorEmail: `a${i}@example.com`,
      });
    }

    const result = await listTenants({
      container,
      headers: createMockHeaders(),
      input: {
        keyword: null,
        status: null,
        category: null,
        page: 1,
        limit: 10,
      },
    });

    expect(result.items.length).toBe(10);
    expect(result.totalCount).toBe(15);
  });

  it("ページネーション: page: 2, limit: 10で5件返却される（15件中）", async () => {
    const container = getContainer();
    for (let i = 0; i < 15; i++) {
      await createTestTenant(container, {
        name: `テナント${i}`,
        urlPath: `list-pg-${i}`,
        authUserId: `auth-${i}`,
        creatorEmail: `a${i}@example.com`,
      });
    }

    const result = await listTenants({
      container,
      headers: createMockHeaders(),
      input: {
        keyword: null,
        status: null,
        category: null,
        page: 2,
        limit: 10,
      },
    });

    expect(result.items.length).toBe(5);
    expect(result.totalCount).toBe(15);
  });

  it("ページネーション: page: 2, limit: 10で空の一覧が返却される（5件中）", async () => {
    const container = getContainer();
    for (let i = 0; i < 5; i++) {
      await createTestTenant(container, {
        name: `テナント${i}`,
        urlPath: `list-pg-${i}`,
        authUserId: `auth-${i}`,
        creatorEmail: `a${i}@example.com`,
      });
    }

    const result = await listTenants({
      container,
      headers: createMockHeaders(),
      input: {
        keyword: null,
        status: null,
        category: null,
        page: 2,
        limit: 10,
      },
    });

    expect(result.items.length).toBe(0);
    expect(result.totalCount).toBe(5);
  });

  it("複数条件を組み合わせて検索できる", async () => {
    const container = getContainer();
    await createTestTenant(container, {
      name: "美容院A",
      category: "美容室",
      urlPath: "list-multi1",
      authUserId: "auth-1",
      creatorEmail: "a1@example.com",
    });
    const toSuspend = await createTestTenant(container, {
      name: "美容院B",
      category: "美容室",
      urlPath: "list-multi2",
      authUserId: "auth-2",
      creatorEmail: "a2@example.com",
    });
    await createTestTenant(container, {
      name: "レストランC",
      category: "飲食店",
      urlPath: "list-multi3",
      authUserId: "auth-3",
      creatorEmail: "a3@example.com",
    });

    await suspendTenant({
      container,
      headers: createMockHeaders(),
      input: { tenantId: toSuspend.id },
    });

    const result = await listTenants({
      container,
      headers: createMockHeaders(),
      input: {
        keyword: "美容院",
        status: "active",
        category: "美容室",
        page: 1,
        limit: 10,
      },
    });

    expect(result.items.length).toBe(1);
    expect(result.items[0].name).toBe("美容院A");
  });

  it("statusフィルターなしでアクティブ・停止中の全テナントが返却される", async () => {
    const container = getContainer();
    await createTestTenant(container, {
      name: "アクティブ",
      urlPath: "all-status1",
      authUserId: "auth-1",
      creatorEmail: "a1@example.com",
    });
    const toSuspend = await createTestTenant(container, {
      name: "停止予定",
      urlPath: "all-status2",
      authUserId: "auth-2",
      creatorEmail: "a2@example.com",
    });

    await suspendTenant({
      container,
      headers: createMockHeaders(),
      input: { tenantId: toSuspend.id },
    });

    const result = await listTenants({
      container,
      headers: createMockHeaders(),
      input: {
        keyword: null,
        status: null,
        category: null,
        page: 1,
        limit: 10,
      },
    });

    expect(result.items.length).toBe(2);
    const statuses = result.items.map((t) => t.status);
    expect(statuses).toContain("active");
    expect(statuses).toContain("suspended");
  });
});
