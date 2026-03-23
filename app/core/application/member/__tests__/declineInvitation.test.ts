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
import { InvitationId } from "@/core/domain/member/valueObject";
import { acceptInvitation } from "../acceptInvitation";
import { cancelInvitation } from "../cancelInvitation";
import { createInvitation } from "../createInvitation";
import { declineInvitation } from "../declineInvitation";
import { createTestTenant } from "./memberTestHelpers";

describe("declineInvitation", () => {
  const getContainer = setupTestContainer();

  it("should decline a pending invitation", async () => {
    const container = getContainer();
    const { tenantId, adminMemberId } = await createTestTenant(container);

    const invResult = await createInvitation({
      container,
      headers: createMockHeaders(),
      input: {
        tenantId,
        invitedByMemberId: adminMemberId,
        email: "user@example.com",
        role: "staff",
      },
    });

    await declineInvitation({
      container,
      headers: createMockHeaders(),
      input: {
        invitationId: invResult.id,
        authUserId: "auth-user",
        email: "user@example.com",
      },
    });

    // Verify status is declined
    const invitation = await container.unitOfWorkProvider.transaction(
      async (repos) => {
        return repos.invitationRepository.findById(
          InvitationId.create(invResult.id),
        );
      },
    );
    expect(invitation?.status).toBe("declined");
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
        email: "user@example.com",
        role: "staff",
      },
    });

    // Manually expire
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
      declineInvitation({
        container,
        headers: createMockHeaders(),
        input: {
          invitationId: invResult.id,
          authUserId: "auth-user",
          email: "user@example.com",
        },
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("should throw when invitation is already accepted", async () => {
    const container = getContainer();
    const { tenantId, adminMemberId } = await createTestTenant(container);

    const invResult = await createInvitation({
      container,
      headers: createMockHeaders(),
      input: {
        tenantId,
        invitedByMemberId: adminMemberId,
        email: "user@example.com",
        role: "staff",
      },
    });

    await acceptInvitation({
      container,
      headers: createMockHeaders(),
      input: {
        invitationId: invResult.id,
        authUserId: "auth-user",
        email: "user@example.com",
      },
    });

    await expect(
      declineInvitation({
        container,
        headers: createMockHeaders(),
        input: {
          invitationId: invResult.id,
          authUserId: "auth-user",
          email: "user@example.com",
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
        email: "user@example.com",
        role: "staff",
      },
    });

    await declineInvitation({
      container,
      headers: createMockHeaders(),
      input: {
        invitationId: invResult.id,
        authUserId: "auth-user",
        email: "user@example.com",
      },
    });

    await expect(
      declineInvitation({
        container,
        headers: createMockHeaders(),
        input: {
          invitationId: invResult.id,
          authUserId: "auth-user",
          email: "user@example.com",
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
        email: "user@example.com",
        role: "staff",
      },
    });

    await cancelInvitation({
      container,
      headers: createMockHeaders(),
      input: { invitationId: invResult.id },
    });

    await expect(
      declineInvitation({
        container,
        headers: createMockHeaders(),
        input: {
          invitationId: invResult.id,
          authUserId: "auth-user",
          email: "user@example.com",
        },
      }),
    ).rejects.toThrow();
  });

  it("should throw NotFoundError for non-existent invitationId", async () => {
    const container = getContainer();

    await expect(
      declineInvitation({
        container,
        headers: createMockHeaders(),
        input: {
          invitationId: "non-existent",
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
      declineInvitation({
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
