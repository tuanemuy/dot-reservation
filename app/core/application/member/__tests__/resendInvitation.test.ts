import { describe, expect, it, vi } from "vitest";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { ConflictError, NotFoundError } from "@/core/application/error";
import { InvitationId } from "@/core/domain/member/valueObject";
import { acceptInvitation } from "../acceptInvitation";
import { createInvitation } from "../createInvitation";
import { declineInvitation } from "../declineInvitation";
import { resendInvitation } from "../resendInvitation";
import { createTestTenant } from "./memberTestHelpers";

describe("resendInvitation", () => {
  const getContainer = setupTestContainer();

  it("should resend a pending invitation", async () => {
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

    await resendInvitation({
      container,
      headers: createMockHeaders(),
      input: { invitationId: invResult.id },
    });

    // Verify invitation still pending
    const invitation = await container.unitOfWorkProvider.transaction(
      async (repos) => {
        return repos.invitationRepository.findById(
          InvitationId.create(invResult.id),
        );
      },
    );
    expect(invitation?.status).toBe("pending");
  });

  it("should resend an expired invitation", async () => {
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

    await resendInvitation({
      container,
      headers: createMockHeaders(),
      input: { invitationId: invResult.id },
    });

    // Verify invitation is now pending with new expiry
    const invitation = await container.unitOfWorkProvider.transaction(
      async (repos) => {
        return repos.invitationRepository.findById(
          InvitationId.create(invResult.id),
        );
      },
    );
    expect(invitation?.status).toBe("pending");
    expect(invitation?.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("should reset expiry to 7 days from now", async () => {
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

    await resendInvitation({
      container,
      headers: createMockHeaders(),
      input: { invitationId: invResult.id },
    });

    const invitation = await container.unitOfWorkProvider.transaction(
      async (repos) => {
        return repos.invitationRepository.findById(
          InvitationId.create(invResult.id),
        );
      },
    );

    if (!invitation) throw new Error("expected invitation");
    const now = new Date();
    const diffDays =
      (invitation.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeGreaterThan(6);
    expect(diffDays).toBeLessThanOrEqual(7);
  });

  it("should send invitation email on resend", async () => {
    const container = getContainer();
    const sendInvitationEmail = vi.fn().mockResolvedValue(undefined);
    Object.assign(container, { memberEmailSender: { sendInvitationEmail } });

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

    // Reset the mock count after createInvitation's call
    sendInvitationEmail.mockClear();

    await resendInvitation({
      container,
      headers: createMockHeaders(),
      input: { invitationId: invResult.id },
    });

    expect(sendInvitationEmail).toHaveBeenCalledTimes(1);
  });

  it("should throw ConflictError when invitation is accepted", async () => {
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
      resendInvitation({
        container,
        headers: createMockHeaders(),
        input: { invitationId: invResult.id },
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("should throw ConflictError when invitation is declined", async () => {
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
      resendInvitation({
        container,
        headers: createMockHeaders(),
        input: { invitationId: invResult.id },
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("should throw ConflictError when invitation is cancelled", async () => {
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

    // Cancel the invitation via the use case
    await container.unitOfWorkProvider.transaction(async (repos) => {
      const inv = await repos.invitationRepository.findById(
        InvitationId.create(invResult.id),
      );
      if (inv) {
        await repos.invitationRepository.save({
          ...inv,
          status: "cancelled" as const,
          updatedAt: new Date(),
        });
      }
    });

    await expect(
      resendInvitation({
        container,
        headers: createMockHeaders(),
        input: { invitationId: invResult.id },
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("should throw NotFoundError for non-existent invitationId", async () => {
    const container = getContainer();

    await expect(
      resendInvitation({
        container,
        headers: createMockHeaders(),
        input: { invitationId: "non-existent" },
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
