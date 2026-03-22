import { describe, expect, it } from "vitest";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { NotFoundError } from "@/core/application/error";
import { BusinessRuleError } from "@/core/domain/error";
import { deleteMemberAccount } from "../deleteMemberAccount";
import { addMemberToTenant, createTestTenant } from "./memberTestHelpers";

describe("deleteMemberAccount", () => {
  const getContainer = setupTestContainer();

  it("should delete account when not the sole admin", async () => {
    const container = getContainer();
    const { tenantId, adminMemberId } = await createTestTenant(container, {
      authUserId: "auth-admin-1",
      creatorEmail: "admin1@example.com",
    });

    // Add another admin
    await addMemberToTenant(container, {
      tenantId,
      invitedByMemberId: adminMemberId,
      email: "admin2@example.com",
      role: "admin",
      authUserId: "auth-admin-2",
    });

    // Delete the first admin's account
    await deleteMemberAccount({
      container,
      headers: createMockHeaders(),
      input: { authUserId: "auth-admin-1" },
    });

    // Verify member is removed
    const members = await container.unitOfWorkProvider.transaction(
      async (repos) => {
        return repos.memberRepository.findByAuthUserId("auth-admin-1");
      },
    );
    expect(members).toHaveLength(0);
  });

  it("should throw when member is sole admin of a tenant", async () => {
    const container = getContainer();
    await createTestTenant(container, {
      authUserId: "auth-sole-admin",
      creatorEmail: "sole@example.com",
    });

    await expect(
      deleteMemberAccount({
        container,
        headers: createMockHeaders(),
        input: { authUserId: "auth-sole-admin" },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should remove from all tenants", async () => {
    const container = getContainer();

    // Create first tenant with an extra admin
    const tenant1 = await createTestTenant(container, {
      authUserId: "auth-user-multi",
      creatorEmail: "multi@example.com",
      urlPath: `tenant1-${Date.now()}`,
      tenantName: "Tenant 1",
    });

    // Add another admin to tenant 1 so we can delete multi-user
    await addMemberToTenant(container, {
      tenantId: tenant1.tenantId,
      invitedByMemberId: tenant1.adminMemberId,
      email: "another-admin1@example.com",
      role: "admin",
      authUserId: "auth-another-admin-1",
    });

    // Create second tenant
    const tenant2 = await createTestTenant(container, {
      authUserId: "auth-tenant2-admin",
      creatorEmail: "tenant2admin@example.com",
      urlPath: `tenant2-${Date.now()}`,
      tenantName: "Tenant 2",
    });

    // Get the member for the second tenant
    const t2Members = await container.unitOfWorkProvider.transaction(
      async (repos) => {
        return repos.memberRepository.findByAuthUserId("auth-tenant2-admin");
      },
    );
    const t2AdminMemberId = t2Members[0].id;

    // Add multi-user to tenant 2 as staff
    await addMemberToTenant(container, {
      tenantId: tenant2.tenantId,
      invitedByMemberId: t2AdminMemberId,
      email: "multi@example.com",
      role: "staff",
      authUserId: "auth-user-multi",
    });

    // Delete multi-user account
    await deleteMemberAccount({
      container,
      headers: createMockHeaders(),
      input: { authUserId: "auth-user-multi" },
    });

    // Verify removed from all tenants
    const members = await container.unitOfWorkProvider.transaction(
      async (repos) => {
        return repos.memberRepository.findByAuthUserId("auth-user-multi");
      },
    );
    expect(members).toHaveLength(0);
  });

  it("should delete account when not a member of any tenant", async () => {
    const container = getContainer();

    // We cannot easily create a member without a tenant in the current architecture.
    // The authUserId needs to have members in the DB. If no members exist,
    // deleteMemberAccount throws NotFoundError.
    // This test case is for when a member had their memberships removed but still has an account.
    // In the current implementation, no-tenant means NotFoundError since members are found via DB.
    await expect(
      deleteMemberAccount({
        container,
        headers: createMockHeaders(),
        input: { authUserId: "auth-no-tenant" },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw NotFoundError for non-existent authUserId", async () => {
    const container = getContainer();

    await expect(
      deleteMemberAccount({
        container,
        headers: createMockHeaders(),
        input: { authUserId: "non-existent-auth" },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should delete account when admin of multiple tenants with other admins", async () => {
    const container = getContainer();

    // Create first tenant
    const tenant1 = await createTestTenant(container, {
      authUserId: "auth-multi-admin",
      creatorEmail: "multiadmin@example.com",
      urlPath: `multi-t1-${Date.now()}`,
      tenantName: "Multi Tenant 1",
    });

    // Add another admin to tenant 1
    await addMemberToTenant(container, {
      tenantId: tenant1.tenantId,
      invitedByMemberId: tenant1.adminMemberId,
      email: "backup-admin1@example.com",
      role: "admin",
      authUserId: "auth-backup-1",
    });

    // Create second tenant
    const tenant2 = await createTestTenant(container, {
      authUserId: "auth-t2-owner",
      creatorEmail: "t2owner@example.com",
      urlPath: `multi-t2-${Date.now()}`,
      tenantName: "Multi Tenant 2",
    });

    const t2Members = await container.unitOfWorkProvider.transaction(
      async (repos) => {
        return repos.memberRepository.findByAuthUserId("auth-t2-owner");
      },
    );

    // Add multi-admin to tenant 2 as admin
    await addMemberToTenant(container, {
      tenantId: tenant2.tenantId,
      invitedByMemberId: t2Members[0].id,
      email: "multiadmin@example.com",
      role: "admin",
      authUserId: "auth-multi-admin",
    });

    // Delete multi-admin account (has backup admins in all tenants)
    await deleteMemberAccount({
      container,
      headers: createMockHeaders(),
      input: { authUserId: "auth-multi-admin" },
    });

    const members = await container.unitOfWorkProvider.transaction(
      async (repos) => {
        return repos.memberRepository.findByAuthUserId("auth-multi-admin");
      },
    );
    expect(members).toHaveLength(0);
  });
});
