import { describe, expect, it } from "vitest";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { InvitationId } from "@/core/domain/member/valueObject";
import { createInvitation } from "../createInvitation";
import { listInvitations } from "../listInvitations";
import { createTestTenant } from "./memberTestHelpers";

describe("listInvitations", () => {
  const getContainer = setupTestContainer();

  it("should return all invitations for a tenant", async () => {
    const container = getContainer();
    const { tenantId, adminMemberId } = await createTestTenant(container);

    // Create multiple invitations
    await createInvitation({
      container,
      headers: createMockHeaders(),
      input: {
        tenantId,
        invitedByMemberId: adminMemberId,
        email: "user1@example.com",
        role: "staff",
      },
    });
    await createInvitation({
      container,
      headers: createMockHeaders(),
      input: {
        tenantId,
        invitedByMemberId: adminMemberId,
        email: "user2@example.com",
        role: "admin",
      },
    });

    const result = await listInvitations({
      container,
      headers: createMockHeaders(),
      input: { tenantId },
    });

    expect(result.items).toHaveLength(2);
  });

  it("should include expired invitations", async () => {
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

    const result = await listInvitations({
      container,
      headers: createMockHeaders(),
      input: { tenantId },
    });

    expect(result.items).toHaveLength(1);
  });

  it("should include invitations of all statuses", async () => {
    const container = getContainer();
    const { tenantId, adminMemberId } = await createTestTenant(container);

    // Create an invitation
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

    // Manually change its status to declined
    await container.unitOfWorkProvider.transaction(async (repos) => {
      const inv = await repos.invitationRepository.findById(
        InvitationId.create(invResult.id),
      );
      if (inv) {
        await repos.invitationRepository.save({
          ...inv,
          status: "declined" as const,
          updatedAt: new Date(),
        });
      }
    });

    // Create another pending invitation
    await createInvitation({
      container,
      headers: createMockHeaders(),
      input: {
        tenantId,
        invitedByMemberId: adminMemberId,
        email: "user2@example.com",
        role: "staff",
      },
    });

    const result = await listInvitations({
      container,
      headers: createMockHeaders(),
      input: { tenantId },
    });

    expect(result.items).toHaveLength(2);
  });

  it("should return empty items when no invitations exist", async () => {
    const container = getContainer();
    const { tenantId } = await createTestTenant(container);

    const result = await listInvitations({
      container,
      headers: createMockHeaders(),
      input: { tenantId },
    });

    expect(result.items).toHaveLength(0);
  });

  it("should return empty items for non-existent tenantId", async () => {
    const container = getContainer();

    const result = await listInvitations({
      container,
      headers: createMockHeaders(),
      input: { tenantId: "non-existent-tenant" },
    });

    expect(result.items).toHaveLength(0);
  });
});
