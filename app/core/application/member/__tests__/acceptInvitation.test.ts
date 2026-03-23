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
import { InvitationId, MemberId } from "@/core/domain/member/valueObject";
import { acceptInvitation } from "../acceptInvitation";
import { cancelInvitation } from "../cancelInvitation";
import { createInvitation } from "../createInvitation";
import { declineInvitation } from "../declineInvitation";
import { createTestTenant } from "./memberTestHelpers";

describe("acceptInvitation", () => {
  const getContainer = setupTestContainer();

  it("should accept invitation and return memberId, tenantId, role", async () => {
    const container = getContainer();
    const { tenantId, adminMemberId } = await createTestTenant(container);

    const invResult = await createInvitation({
      container,
      headers: createMockHeaders(),
      input: {
        tenantId,
        invitedByMemberId: adminMemberId,
        email: "new-user@example.com",
        role: "staff",
      },
    });

    const result = await acceptInvitation({
      container,
      headers: createMockHeaders(),
      input: {
        invitationId: invResult.id,
        authUserId: "auth-new-user",
        email: "new-user@example.com",
      },
    });

    expect(result.memberId).toBeDefined();
    expect(result.tenantId).toBe(tenantId);
    expect(result.role).toBe("staff");
  });

  it("should add a new member to the tenant upon acceptance", async () => {
    const container = getContainer();
    const { tenantId, adminMemberId } = await createTestTenant(container);

    const invResult = await createInvitation({
      container,
      headers: createMockHeaders(),
      input: {
        tenantId,
        invitedByMemberId: adminMemberId,
        email: "member@example.com",
        role: "admin",
      },
    });

    const result = await acceptInvitation({
      container,
      headers: createMockHeaders(),
      input: {
        invitationId: invResult.id,
        authUserId: "auth-member",
        email: "member@example.com",
      },
    });

    // Verify member exists in the tenant
    const member = await container.unitOfWorkProvider.transaction(
      async (repos) => {
        return repos.memberRepository.findById(
          MemberId.create(result.memberId),
        );
      },
    );
    expect(member).not.toBeNull();
    expect(member?.tenantId).toBe(tenantId);
  });

  it("should throw ConflictError when invitation is expired", async () => {
    const container = getContainer();
    const { tenantId, adminMemberId } = await createTestTenant(container);

    const invResult = await createInvitation({
      container,
      headers: createMockHeaders(),
      input: {
        tenantId,
        invitedByMemberId: adminMemberId,
        email: "expired@example.com",
        role: "staff",
      },
    });

    // Manually expire the invitation
    await container.unitOfWorkProvider.transaction(async (repos) => {
      const inv = await repos.invitationRepository.findById(
        InvitationId.create(invResult.id),
      );
      if (inv) {
        await repos.invitationRepository.save({
          ...inv,
          expiresAt: new Date(Date.now() - 1000),
          updatedAt: new Date(),
        });
      }
    });

    await expect(
      acceptInvitation({
        container,
        headers: createMockHeaders(),
        input: {
          invitationId: invResult.id,
          authUserId: "auth-user",
          email: "expired@example.com",
        },
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("should throw ConflictError when invitation is already accepted", async () => {
    const container = getContainer();
    const { tenantId, adminMemberId } = await createTestTenant(container);

    const invResult = await createInvitation({
      container,
      headers: createMockHeaders(),
      input: {
        tenantId,
        invitedByMemberId: adminMemberId,
        email: "accepted@example.com",
        role: "staff",
      },
    });

    // Accept the invitation
    await acceptInvitation({
      container,
      headers: createMockHeaders(),
      input: {
        invitationId: invResult.id,
        authUserId: "auth-user",
        email: "accepted@example.com",
      },
    });

    // Try to accept again
    await expect(
      acceptInvitation({
        container,
        headers: createMockHeaders(),
        input: {
          invitationId: invResult.id,
          authUserId: "auth-user-2",
          email: "accepted@example.com",
        },
      }),
    ).rejects.toThrow();
  });

  it("should throw when invitation is already declined", async () => {
    const container = getContainer();
    const { tenantId, adminMemberId } = await createTestTenant(container);

    const invResult = await createInvitation({
      container,
      headers: createMockHeaders(),
      input: {
        tenantId,
        invitedByMemberId: adminMemberId,
        email: "declined@example.com",
        role: "staff",
      },
    });

    // Decline the invitation
    await declineInvitation({
      container,
      headers: createMockHeaders(),
      input: {
        invitationId: invResult.id,
        authUserId: "auth-user",
        email: "declined@example.com",
      },
    });

    // Try to accept
    await expect(
      acceptInvitation({
        container,
        headers: createMockHeaders(),
        input: {
          invitationId: invResult.id,
          authUserId: "auth-user",
          email: "declined@example.com",
        },
      }),
    ).rejects.toThrow();
  });

  it("should throw when invitation is already cancelled", async () => {
    const container = getContainer();
    const { tenantId, adminMemberId } = await createTestTenant(container);

    const invResult = await createInvitation({
      container,
      headers: createMockHeaders(),
      input: {
        tenantId,
        invitedByMemberId: adminMemberId,
        email: "cancelled@example.com",
        role: "staff",
      },
    });

    // Cancel the invitation
    await cancelInvitation({
      container,
      headers: createMockHeaders(),
      input: { invitationId: invResult.id },
    });

    // Try to accept
    await expect(
      acceptInvitation({
        container,
        headers: createMockHeaders(),
        input: {
          invitationId: invResult.id,
          authUserId: "auth-user",
          email: "cancelled@example.com",
        },
      }),
    ).rejects.toThrow();
  });

  it("should auto-create StaffProfile when role is staff", async () => {
    const container = getContainer();
    const { tenantId, adminMemberId } = await createTestTenant(container);

    const invResult = await createInvitation({
      container,
      headers: createMockHeaders(),
      input: {
        tenantId,
        invitedByMemberId: adminMemberId,
        email: "staff@example.com",
        role: "staff",
      },
    });

    const result = await acceptInvitation({
      container,
      headers: createMockHeaders(),
      input: {
        invitationId: invResult.id,
        authUserId: "auth-staff",
        email: "staff@example.com",
      },
    });

    // Check StaffProfile exists
    const profile = await container.unitOfWorkProvider.transaction(
      async (repos) => {
        return repos.staffProfileRepository.findByMemberId(
          MemberId.create(result.memberId),
        );
      },
    );
    expect(profile).not.toBeNull();
  });

  it("should not create StaffProfile when role is admin", async () => {
    const container = getContainer();
    const { tenantId, adminMemberId } = await createTestTenant(container);

    const invResult = await createInvitation({
      container,
      headers: createMockHeaders(),
      input: {
        tenantId,
        invitedByMemberId: adminMemberId,
        email: "admin2@example.com",
        role: "admin",
      },
    });

    const result = await acceptInvitation({
      container,
      headers: createMockHeaders(),
      input: {
        invitationId: invResult.id,
        authUserId: "auth-admin-2",
        email: "admin2@example.com",
      },
    });

    // Check StaffProfile does NOT exist
    const profile = await container.unitOfWorkProvider.transaction(
      async (repos) => {
        return repos.staffProfileRepository.findByMemberId(
          MemberId.create(result.memberId),
        );
      },
    );
    expect(profile).toBeNull();
  });

  it("should throw NotFoundError for non-existent invitationId", async () => {
    const container = getContainer();

    await expect(
      acceptInvitation({
        container,
        headers: createMockHeaders(),
        input: {
          invitationId: "non-existent-id",
          authUserId: "auth-user",
          email: "user@example.com",
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw ForbiddenError when email does not match invitation", async () => {
    const container = getContainer();
    const { tenantId, adminMemberId } = await createTestTenant(container);

    const invResult = await createInvitation({
      container,
      headers: createMockHeaders(),
      input: {
        tenantId,
        invitedByMemberId: adminMemberId,
        email: "intended@example.com",
        role: "staff",
      },
    });

    await expect(
      acceptInvitation({
        container,
        headers: createMockHeaders(),
        input: {
          invitationId: invResult.id,
          authUserId: "auth-other",
          email: "other@example.com",
        },
      }),
    ).rejects.toThrow(ForbiddenError);
  });
});
