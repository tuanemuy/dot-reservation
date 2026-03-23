import { describe, expect, it, vi } from "vitest";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { createCustomer } from "@/core/application/customer/createCustomer";
import {
  addMemberToTenant,
  createTestTenant,
} from "@/core/application/member/__tests__/memberTestHelpers";
import { cleanupAuthUserIfOrphaned } from "../cleanupAuthUserIfOrphaned";

describe("cleanupAuthUserIfOrphaned", () => {
  const getContainer = setupTestContainer();

  it("Customer も Member も存在しない場合、auth ユーザーが削除される", async () => {
    const container = getContainer();
    const headers = createMockHeaders();
    const deleteUserSpy = vi.fn();
    container.authProvider = {
      ...container.authProvider,
      deleteUser: deleteUserSpy,
    };

    await cleanupAuthUserIfOrphaned({
      container,
      headers,
      input: { authUserId: "orphaned-auth-user" },
    });

    expect(deleteUserSpy).toHaveBeenCalledWith("orphaned-auth-user");
    expect(deleteUserSpy).toHaveBeenCalledTimes(1);
  });

  it("Customer のみ存在する場合、auth ユーザーは維持される", async () => {
    const container = getContainer();
    const headers = createMockHeaders();
    const deleteUserSpy = vi.fn();
    container.authProvider = {
      ...container.authProvider,
      deleteUser: deleteUserSpy,
    };

    const authUserId = "auth-with-customer";
    await createCustomer({
      container,
      headers,
      input: {
        authUserId,
        displayName: "テスト顧客",
        email: "customer-only@example.com",
      },
    });

    await cleanupAuthUserIfOrphaned({
      container,
      headers,
      input: { authUserId },
    });

    expect(deleteUserSpy).not.toHaveBeenCalled();
  });

  it("Member のみ存在する場合（1テナント）、auth ユーザーは維持される", async () => {
    const container = getContainer();
    const headers = createMockHeaders();
    const deleteUserSpy = vi.fn();
    container.authProvider = {
      ...container.authProvider,
      deleteUser: deleteUserSpy,
    };

    const authUserId = "auth-with-member-single";
    await createTestTenant(container, {
      authUserId,
      creatorEmail: "member-single@example.com",
    });

    await cleanupAuthUserIfOrphaned({
      container,
      headers,
      input: { authUserId },
    });

    expect(deleteUserSpy).not.toHaveBeenCalled();
  });

  it("Member のみ存在する場合（複数テナント）、auth ユーザーは維持される", async () => {
    const container = getContainer();
    const headers = createMockHeaders();
    const deleteUserSpy = vi.fn();
    container.authProvider = {
      ...container.authProvider,
      deleteUser: deleteUserSpy,
    };

    const authUserId = "auth-with-member-multi";

    // Create first tenant as admin
    await createTestTenant(container, {
      authUserId,
      creatorEmail: "member-multi@example.com",
      urlPath: `tenant-multi-1-${Date.now()}`,
      tenantName: "Tenant Multi 1",
    });

    // Create second tenant with a different admin
    const tenant2 = await createTestTenant(container, {
      authUserId: "auth-tenant2-admin-multi",
      creatorEmail: "tenant2-admin-multi@example.com",
      urlPath: `tenant-multi-2-${Date.now()}`,
      tenantName: "Tenant Multi 2",
    });

    // Find the admin member of tenant2
    const t2Members = await container.unitOfWorkProvider.transaction(
      async (repos) => {
        return repos.memberRepository.findByAuthUserId(
          "auth-tenant2-admin-multi",
        );
      },
    );
    const t2AdminMemberId = t2Members[0].id;

    // Add the multi-tenant user to tenant2
    await addMemberToTenant(container, {
      tenantId: tenant2.tenantId,
      invitedByMemberId: t2AdminMemberId,
      email: "member-multi@example.com",
      role: "staff",
      authUserId,
    });

    await cleanupAuthUserIfOrphaned({
      container,
      headers,
      input: { authUserId },
    });

    expect(deleteUserSpy).not.toHaveBeenCalled();
  });

  it("Customer と Member の両方が存在する場合、auth ユーザーは維持される", async () => {
    const container = getContainer();
    const headers = createMockHeaders();
    const deleteUserSpy = vi.fn();
    container.authProvider = {
      ...container.authProvider,
      deleteUser: deleteUserSpy,
    };

    const authUserId = "auth-with-both";

    // Create customer
    await createCustomer({
      container,
      headers,
      input: {
        authUserId,
        displayName: "両方テスト",
        email: "both@example.com",
      },
    });

    // Create member (via tenant creation)
    await createTestTenant(container, {
      authUserId,
      creatorEmail: "both@example.com",
    });

    await cleanupAuthUserIfOrphaned({
      container,
      headers,
      input: { authUserId },
    });

    expect(deleteUserSpy).not.toHaveBeenCalled();
  });

  it("存在しない authUserId を指定した場合、エラーなく完了する", async () => {
    const container = getContainer();
    const headers = createMockHeaders();
    const deleteUserSpy = vi.fn();
    container.authProvider = {
      ...container.authProvider,
      deleteUser: deleteUserSpy,
    };

    // Neither Customer nor Member exists for this ID, so deleteUser should be called
    await cleanupAuthUserIfOrphaned({
      container,
      headers,
      input: { authUserId: "non-existent-auth-user" },
    });

    // Since no Customer or Member exists, the auth user will be "deleted" (mock call)
    expect(deleteUserSpy).toHaveBeenCalledWith("non-existent-auth-user");
  });
});
