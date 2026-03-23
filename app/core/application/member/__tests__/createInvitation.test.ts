import { describe, expect, it, vi } from "vitest";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { ConflictError, NotFoundError } from "@/core/application/error";
import { BusinessRuleError } from "@/core/domain/error";
import { InvitationId } from "@/core/domain/member/valueObject";
import { createInvitation } from "../createInvitation";
import { createTestTenant } from "./memberTestHelpers";

describe("createInvitation", () => {
  const getContainer = setupTestContainer();

  it("should create invitation and return invitation ID", async () => {
    const container = getContainer();
    const { tenantId, adminMemberId } = await createTestTenant(container);

    const result = await createInvitation({
      container,
      headers: createMockHeaders(),
      input: {
        tenantId,
        invitedByMemberId: adminMemberId,
        email: "new-member@example.com",
        role: "staff",
      },
    });

    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe("string");
  });

  it("should send invitation email", async () => {
    const container = getContainer();
    const sendInvitationEmail = vi.fn().mockResolvedValue(undefined);
    Object.assign(container, { memberEmailSender: { sendInvitationEmail } });

    const { tenantId, adminMemberId } = await createTestTenant(container);

    await createInvitation({
      container,
      headers: createMockHeaders(),
      input: {
        tenantId,
        invitedByMemberId: adminMemberId,
        email: "new-member@example.com",
        role: "staff",
      },
    });

    expect(sendInvitationEmail).toHaveBeenCalled();
  });

  it("should set expiry to 7 days from now", async () => {
    const container = getContainer();
    const { tenantId, adminMemberId } = await createTestTenant(container);

    const result = await createInvitation({
      container,
      headers: createMockHeaders(),
      input: {
        tenantId,
        invitedByMemberId: adminMemberId,
        email: "new-member@example.com",
        role: "staff",
      },
    });

    // Verify expiry via repository
    const invitation = await container.unitOfWorkProvider.transaction(
      async (repos) => {
        return repos.invitationRepository.findById(
          InvitationId.create(result.id),
        );
      },
    );

    expect(invitation).not.toBeNull();
    if (!invitation) throw new Error("expected invitation");
    const now = new Date();
    const diffDays =
      (invitation.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeGreaterThan(6);
    expect(diffDays).toBeLessThanOrEqual(7);
  });

  it("should throw ConflictError when email is already a member", async () => {
    const container = getContainer();
    const { tenantId, adminMemberId } = await createTestTenant(container, {
      creatorEmail: "admin@example.com",
    });

    await expect(
      createInvitation({
        container,
        headers: createMockHeaders(),
        input: {
          tenantId,
          invitedByMemberId: adminMemberId,
          email: "admin@example.com",
          role: "staff",
        },
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("should throw ConflictError when pending invitation already exists", async () => {
    const container = getContainer();
    const { tenantId, adminMemberId } = await createTestTenant(container);

    await createInvitation({
      container,
      headers: createMockHeaders(),
      input: {
        tenantId,
        invitedByMemberId: adminMemberId,
        email: "duplicate@example.com",
        role: "staff",
      },
    });

    await expect(
      createInvitation({
        container,
        headers: createMockHeaders(),
        input: {
          tenantId,
          invitedByMemberId: adminMemberId,
          email: "duplicate@example.com",
          role: "staff",
        },
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("should allow creating invitation for email with expired invitation", async () => {
    const container = getContainer();
    const { tenantId, adminMemberId } = await createTestTenant(container);

    // Create invitation and manually expire it
    const result = await createInvitation({
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
        InvitationId.create(result.id),
      );
      if (inv) {
        const expiredInv = {
          ...inv,
          expiresAt: new Date(Date.now() - 1000),
          updatedAt: new Date(),
        };
        await repos.invitationRepository.save(expiredInv);
      }
    });

    // Should succeed since previous invitation is expired
    const newResult = await createInvitation({
      container,
      headers: createMockHeaders(),
      input: {
        tenantId,
        invitedByMemberId: adminMemberId,
        email: "expired@example.com",
        role: "staff",
      },
    });
    expect(newResult.id).toBeDefined();
  });

  it("should allow creating invitation for email with declined invitation", async () => {
    const container = getContainer();
    const { tenantId, adminMemberId } = await createTestTenant(container);

    // Create and decline an invitation
    const result = await createInvitation({
      container,
      headers: createMockHeaders(),
      input: {
        tenantId,
        invitedByMemberId: adminMemberId,
        email: "declined@example.com",
        role: "staff",
      },
    });

    // Manually decline the invitation
    await container.unitOfWorkProvider.transaction(async (repos) => {
      const inv = await repos.invitationRepository.findById(
        InvitationId.create(result.id),
      );
      if (inv) {
        const declinedInv = {
          ...inv,
          status: "declined" as const,
          updatedAt: new Date(),
        };
        await repos.invitationRepository.save(declinedInv);
      }
    });

    // Should succeed since previous invitation is declined
    const newResult = await createInvitation({
      container,
      headers: createMockHeaders(),
      input: {
        tenantId,
        invitedByMemberId: adminMemberId,
        email: "declined@example.com",
        role: "staff",
      },
    });
    expect(newResult.id).toBeDefined();
  });

  it("should throw BusinessRuleError for invalid email format", async () => {
    const container = getContainer();
    const { tenantId, adminMemberId } = await createTestTenant(container);

    await expect(
      createInvitation({
        container,
        headers: createMockHeaders(),
        input: {
          tenantId,
          invitedByMemberId: adminMemberId,
          email: "not-valid-email",
          role: "staff",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError for invalid role", async () => {
    const container = getContainer();
    const { tenantId, adminMemberId } = await createTestTenant(container);

    await expect(
      createInvitation({
        container,
        headers: createMockHeaders(),
        input: {
          tenantId,
          invitedByMemberId: adminMemberId,
          email: "new@example.com",
          role: "invalid-role",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw NotFoundError for non-existent tenantId", async () => {
    const container = getContainer();
    const { adminMemberId } = await createTestTenant(container);

    await expect(
      createInvitation({
        container,
        headers: createMockHeaders(),
        input: {
          tenantId: "non-existent-tenant",
          invitedByMemberId: adminMemberId,
          email: "new@example.com",
          role: "staff",
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw NotFoundError for non-existent invitedByMemberId", async () => {
    const container = getContainer();
    const { tenantId } = await createTestTenant(container);

    await expect(
      createInvitation({
        container,
        headers: createMockHeaders(),
        input: {
          tenantId,
          invitedByMemberId: "non-existent-member",
          email: "new@example.com",
          role: "staff",
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
