import { describe, expect, it } from "vitest";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { NotFoundError } from "@/core/application/error";
import { InvitationId } from "@/core/domain/member/valueObject";
import { acceptInvitation } from "../acceptInvitation";
import { cancelInvitation } from "../cancelInvitation";
import { createInvitation } from "../createInvitation";
import { declineInvitation } from "../declineInvitation";
import { createTestTenant } from "./memberTestHelpers";

describe("cancelInvitation", () => {
  const getContainer = setupTestContainer();

  it("should cancel a pending invitation", async () => {
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

    // Verify status changed to cancelled
    const invitation = await container.unitOfWorkProvider.transaction(
      async (repos) => {
        return repos.invitationRepository.findById(InvitationId.create(invResult.id));
      },
    );
    expect(invitation?.status).toBe("cancelled");
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
      cancelInvitation({
        container,
        headers: createMockHeaders(),
        input: { invitationId: invResult.id },
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
      cancelInvitation({
        container,
        headers: createMockHeaders(),
        input: { invitationId: invResult.id },
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
      cancelInvitation({
        container,
        headers: createMockHeaders(),
        input: { invitationId: invResult.id },
      }),
    ).rejects.toThrow();
  });

  it("should cancel an expired invitation", async () => {
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

    await cancelInvitation({
      container,
      headers: createMockHeaders(),
      input: { invitationId: invResult.id },
    });

    // Verify status changed to cancelled
    const invitation = await container.unitOfWorkProvider.transaction(
      async (repos) => {
        return repos.invitationRepository.findById(InvitationId.create(invResult.id));
      },
    );
    expect(invitation?.status).toBe("cancelled");
  });

  it("should throw NotFoundError for non-existent invitationId", async () => {
    const container = getContainer();

    await expect(
      cancelInvitation({
        container,
        headers: createMockHeaders(),
        input: { invitationId: "non-existent" },
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
