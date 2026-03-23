import { describe, expect, it } from "vitest";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@/core/application/error";
import { BusinessRuleError } from "@/core/domain/error";
import { MemberId } from "@/core/domain/member/valueObject";
import { changeMemberRole } from "../changeMemberRole";
import { addMemberToTenant, createTestTenant } from "./memberTestHelpers";

describe("changeMemberRole", () => {
  const getContainer = setupTestContainer();

  it("should change role from staff to admin", async () => {
    const container = getContainer();
    const { tenantId, adminMemberId } = await createTestTenant(container);

    // Add a staff member
    const { memberId: staffMemberId } = await addMemberToTenant(container, {
      tenantId,
      invitedByMemberId: adminMemberId,
      email: "staff@example.com",
      role: "staff",
      authUserId: "auth-staff-1",
    });

    await changeMemberRole({
      container,
      headers: createMockHeaders(),
      input: {
        tenantId,
        operatorMemberId: adminMemberId,
        targetMemberId: staffMemberId,
        newRole: "admin",
      },
    });

    // Verify role changed
    const members = await container.unitOfWorkProvider.transaction(
      async (repos) => {
        return repos.memberRepository.findById(MemberId.create(staffMemberId));
      },
    );
    expect(members?.role).toBe("admin");
  });

  it("should change role from admin to staff when other admins exist", async () => {
    const container = getContainer();
    const { tenantId, adminMemberId } = await createTestTenant(container);

    // Add another admin
    const { memberId: secondAdminId } = await addMemberToTenant(container, {
      tenantId,
      invitedByMemberId: adminMemberId,
      email: "admin2@example.com",
      role: "admin",
      authUserId: "auth-admin-2",
    });

    await changeMemberRole({
      container,
      headers: createMockHeaders(),
      input: {
        tenantId,
        operatorMemberId: adminMemberId,
        targetMemberId: secondAdminId,
        newRole: "staff",
      },
    });

    const member = await container.unitOfWorkProvider.transaction(
      async (repos) => {
        return repos.memberRepository.findById(MemberId.create(secondAdminId));
      },
    );
    expect(member?.role).toBe("staff");
  });

  it("should throw ForbiddenError when changing own role", async () => {
    const container = getContainer();
    const { tenantId, adminMemberId } = await createTestTenant(container);

    await expect(
      changeMemberRole({
        container,
        headers: createMockHeaders(),
        input: {
          tenantId,
          operatorMemberId: adminMemberId,
          targetMemberId: adminMemberId,
          newRole: "staff",
        },
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("should throw ConflictError when last admin tries to change role to staff", async () => {
    const container = getContainer();
    const { tenantId, adminMemberId } = await createTestTenant(container);

    // Add a staff member to have someone else operate
    const { memberId: staffMemberId } = await addMemberToTenant(container, {
      tenantId,
      invitedByMemberId: adminMemberId,
      email: "staff@example.com",
      role: "staff",
      authUserId: "auth-staff-1",
    });

    // Try to change the only admin to staff (operated by staff - we skip the authorization logic and just test the policy)
    await expect(
      changeMemberRole({
        container,
        headers: createMockHeaders(),
        input: {
          tenantId,
          operatorMemberId: staffMemberId,
          targetMemberId: adminMemberId,
          newRole: "staff",
        },
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("should auto-create StaffProfile when changing from admin to staff", async () => {
    const container = getContainer();
    const { tenantId, adminMemberId } = await createTestTenant(container);

    // Add a second admin
    const { memberId: secondAdminId } = await addMemberToTenant(container, {
      tenantId,
      invitedByMemberId: adminMemberId,
      email: "admin2@example.com",
      role: "admin",
      authUserId: "auth-admin-2",
    });

    await changeMemberRole({
      container,
      headers: createMockHeaders(),
      input: {
        tenantId,
        operatorMemberId: adminMemberId,
        targetMemberId: secondAdminId,
        newRole: "staff",
      },
    });

    // Check StaffProfile was created
    const staffProfile = await container.unitOfWorkProvider.transaction(
      async (repos) => {
        return repos.staffProfileRepository.findByMemberId(
          MemberId.create(secondAdminId),
        );
      },
    );
    expect(staffProfile).not.toBeNull();
  });

  it("should preserve existing StaffProfile when changing from staff to admin", async () => {
    const container = getContainer();
    const { tenantId, adminMemberId } = await createTestTenant(container);

    // Add a staff member (StaffProfile is auto-created via acceptInvitation)
    const { memberId: staffMemberId } = await addMemberToTenant(container, {
      tenantId,
      invitedByMemberId: adminMemberId,
      email: "staff@example.com",
      role: "staff",
      authUserId: "auth-staff-1",
    });

    // Verify StaffProfile exists
    const profileBefore = await container.unitOfWorkProvider.transaction(
      async (repos) => {
        return repos.staffProfileRepository.findByMemberId(
          MemberId.create(staffMemberId),
        );
      },
    );
    expect(profileBefore).not.toBeNull();

    await changeMemberRole({
      container,
      headers: createMockHeaders(),
      input: {
        tenantId,
        operatorMemberId: adminMemberId,
        targetMemberId: staffMemberId,
        newRole: "admin",
      },
    });

    // StaffProfile should still exist
    const profileAfter = await container.unitOfWorkProvider.transaction(
      async (repos) => {
        return repos.staffProfileRepository.findByMemberId(
          MemberId.create(staffMemberId),
        );
      },
    );
    expect(profileAfter).not.toBeNull();
  });

  it("should throw NotFoundError when target member not in tenant", async () => {
    const container = getContainer();
    const { tenantId, adminMemberId } = await createTestTenant(container);

    // Create another tenant with a member
    const { adminMemberId: otherMemberId } = await createTestTenant(container, {
      authUserId: "auth-other-1",
      creatorEmail: "other@example.com",
      urlPath: `other-tenant-${Date.now()}`,
    });

    await expect(
      changeMemberRole({
        container,
        headers: createMockHeaders(),
        input: {
          tenantId,
          operatorMemberId: adminMemberId,
          targetMemberId: otherMemberId,
          newRole: "staff",
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw BusinessRuleError for invalid role", async () => {
    const container = getContainer();
    const { tenantId, adminMemberId } = await createTestTenant(container);

    const { memberId: staffMemberId } = await addMemberToTenant(container, {
      tenantId,
      invitedByMemberId: adminMemberId,
      email: "staff@example.com",
      role: "staff",
      authUserId: "auth-staff-1",
    });

    await expect(
      changeMemberRole({
        container,
        headers: createMockHeaders(),
        input: {
          tenantId,
          operatorMemberId: adminMemberId,
          targetMemberId: staffMemberId,
          newRole: "invalid-role",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw NotFoundError for non-existent tenantId", async () => {
    const container = getContainer();
    const { adminMemberId } = await createTestTenant(container);

    await expect(
      changeMemberRole({
        container,
        headers: createMockHeaders(),
        input: {
          tenantId: "non-existent-tenant-id",
          operatorMemberId: "some-operator",
          targetMemberId: adminMemberId,
          newRole: "staff",
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
