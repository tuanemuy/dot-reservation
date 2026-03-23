import { describe, expect, it, vi } from "vitest";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { createCustomer } from "@/core/application/customer/createCustomer";
import { deleteCustomer } from "@/core/application/customer/deleteCustomer";
import {
  addMemberToTenant,
  createTestTenant,
} from "@/core/application/member/__tests__/memberTestHelpers";
import { deleteMemberAccount } from "@/core/application/member/deleteMemberAccount";

describe("deleteCustomer -- auth 統合", () => {
  const getContainer = setupTestContainer();

  it("顧客のみ持つユーザーの場合、Customer 削除後に authProvider.deleteUser が呼ばれる", async () => {
    const container = getContainer();
    const headers = createMockHeaders();
    const deleteUserSpy = vi.fn();
    container.authProvider = {
      ...container.authProvider,
      deleteUser: deleteUserSpy,
    };

    const authUserId = "auth-customer-only";
    const customer = await createCustomer({
      container,
      headers,
      input: {
        authUserId,
        displayName: "顧客のみ",
        email: "customer-only-delete@example.com",
      },
    });

    await deleteCustomer({
      container,
      headers,
      input: { customerId: customer.id },
    });

    expect(deleteUserSpy).toHaveBeenCalledWith(authUserId);
    expect(deleteUserSpy).toHaveBeenCalledTimes(1);
  });

  it("顧客とメンバー両方持つユーザーの場合、Customer 削除後に authProvider.deleteUser は呼ばれない", async () => {
    const container = getContainer();
    const headers = createMockHeaders();
    const deleteUserSpy = vi.fn();
    container.authProvider = {
      ...container.authProvider,
      deleteUser: deleteUserSpy,
    };

    const authUserId = "auth-both-delete-customer";

    // Create customer
    const customer = await createCustomer({
      container,
      headers,
      input: {
        authUserId,
        displayName: "顧客とメンバー",
        email: "both-delete-customer@example.com",
      },
    });

    // Create member (via tenant creation)
    await createTestTenant(container, {
      authUserId,
      creatorEmail: "both-delete-customer@example.com",
    });

    await deleteCustomer({
      container,
      headers,
      input: { customerId: customer.id },
    });

    expect(deleteUserSpy).not.toHaveBeenCalled();
  });
});

describe("deleteMemberAccount -- auth 統合", () => {
  const getContainer = setupTestContainer();

  it("メンバーのみ持つユーザーの場合、Member 削除後に authProvider.deleteUser が呼ばれる", async () => {
    const container = getContainer();
    const headers = createMockHeaders();
    const deleteUserSpy = vi.fn();
    container.authProvider = {
      ...container.authProvider,
      deleteUser: deleteUserSpy,
    };

    const authUserId = "auth-member-only-delete";

    // Create tenant with this user as admin
    const tenant = await createTestTenant(container, {
      authUserId,
      creatorEmail: "member-only-delete@example.com",
    });

    // Add another admin so we can delete the original admin
    await addMemberToTenant(container, {
      tenantId: tenant.tenantId,
      invitedByMemberId: tenant.adminMemberId,
      email: "backup-admin@example.com",
      role: "admin",
      authUserId: "auth-backup-admin",
    });

    await deleteMemberAccount({
      container,
      headers,
      input: { authUserId },
    });

    expect(deleteUserSpy).toHaveBeenCalledWith(authUserId);
    expect(deleteUserSpy).toHaveBeenCalledTimes(1);
  });

  it("メンバーと顧客両方持つユーザーの場合、Member 削除後に authProvider.deleteUser は呼ばれない", async () => {
    const container = getContainer();
    const headers = createMockHeaders();
    const deleteUserSpy = vi.fn();
    container.authProvider = {
      ...container.authProvider,
      deleteUser: deleteUserSpy,
    };

    const authUserId = "auth-both-delete-member";

    // Create customer first
    await createCustomer({
      container,
      headers,
      input: {
        authUserId,
        displayName: "メンバーと顧客",
        email: "both-delete-member@example.com",
      },
    });

    // Create tenant with this user as admin (creates member)
    const tenant = await createTestTenant(container, {
      authUserId,
      creatorEmail: "both-delete-member@example.com",
    });

    // Add another admin so we can delete the original admin
    await addMemberToTenant(container, {
      tenantId: tenant.tenantId,
      invitedByMemberId: tenant.adminMemberId,
      email: "backup-admin-both@example.com",
      role: "admin",
      authUserId: "auth-backup-admin-both",
    });

    await deleteMemberAccount({
      container,
      headers,
      input: { authUserId },
    });

    expect(deleteUserSpy).not.toHaveBeenCalled();
  });
});
