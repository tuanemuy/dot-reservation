import { describe, expect, it } from "vitest";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { acceptInvitation } from "../acceptInvitation";
import { cancelInvitation } from "../cancelInvitation";
import { createInvitation } from "../createInvitation";
import { declineInvitation } from "../declineInvitation";
import { listPendingInvitations } from "../listPendingInvitations";
import { createTestTenant } from "./memberTestHelpers";

describe("listPendingInvitations", () => {
  const getContainer = setupTestContainer();

  it("should return pending invitations for the email", async () => {
    const container = getContainer();
    const { tenantId, adminMemberId } = await createTestTenant(container);

    await createInvitation({
      container,
      headers: createMockHeaders(),
      input: {
        tenantId,
        invitedByMemberId: adminMemberId,
        email: "invitee@example.com",
        role: "staff",
      },
    });

    const result = await listPendingInvitations({
      container,
      headers: createMockHeaders(),
      input: { email: "invitee@example.com" },
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].tenantId).toBe(tenantId);
    expect(result.items[0].role).toBe("staff");
  });

  it("should exclude expired invitations", async () => {
    const container = getContainer();
    const { tenantId, adminMemberId } = await createTestTenant(container);

    const invResult = await createInvitation({
      container,
      headers: createMockHeaders(),
      input: {
        tenantId,
        invitedByMemberId: adminMemberId,
        email: "invitee@example.com",
        role: "staff",
      },
    });

    // Manually expire
    await container.unitOfWorkProvider.transaction(async (repos) => {
      const inv = await repos.invitationRepository.findById(
        invResult.id as any,
      );
      if (inv) {
        await repos.invitationRepository.save({
          ...inv,
          expiresAt: new Date(Date.now() - 1000),
          updatedAt: new Date(),
        });
      }
    });

    const result = await listPendingInvitations({
      container,
      headers: createMockHeaders(),
      input: { email: "invitee@example.com" },
    });

    expect(result.items).toHaveLength(0);
  });

  it("should exclude accepted invitations", async () => {
    const container = getContainer();
    const { tenantId, adminMemberId } = await createTestTenant(container);

    const invResult = await createInvitation({
      container,
      headers: createMockHeaders(),
      input: {
        tenantId,
        invitedByMemberId: adminMemberId,
        email: "invitee@example.com",
        role: "staff",
      },
    });

    await acceptInvitation({
      container,
      headers: createMockHeaders(),
      input: {
        invitationId: invResult.id,
        authUserId: "auth-invitee",
        email: "invitee@example.com",
      },
    });

    const result = await listPendingInvitations({
      container,
      headers: createMockHeaders(),
      input: { email: "invitee@example.com" },
    });

    expect(result.items).toHaveLength(0);
  });

  it("should exclude declined invitations", async () => {
    const container = getContainer();
    const { tenantId, adminMemberId } = await createTestTenant(container);

    const invResult = await createInvitation({
      container,
      headers: createMockHeaders(),
      input: {
        tenantId,
        invitedByMemberId: adminMemberId,
        email: "invitee@example.com",
        role: "staff",
      },
    });

    await declineInvitation({
      container,
      headers: createMockHeaders(),
      input: {
        invitationId: invResult.id,
        authUserId: "auth-invitee",
        email: "invitee@example.com",
      },
    });

    const result = await listPendingInvitations({
      container,
      headers: createMockHeaders(),
      input: { email: "invitee@example.com" },
    });

    expect(result.items).toHaveLength(0);
  });

  it("should exclude cancelled invitations", async () => {
    const container = getContainer();
    const { tenantId, adminMemberId } = await createTestTenant(container);

    const invResult = await createInvitation({
      container,
      headers: createMockHeaders(),
      input: {
        tenantId,
        invitedByMemberId: adminMemberId,
        email: "invitee@example.com",
        role: "staff",
      },
    });

    await cancelInvitation({
      container,
      headers: createMockHeaders(),
      input: { invitationId: invResult.id },
    });

    const result = await listPendingInvitations({
      container,
      headers: createMockHeaders(),
      input: { email: "invitee@example.com" },
    });

    expect(result.items).toHaveLength(0);
  });

  it("should return empty items when no invitations exist", async () => {
    const container = getContainer();

    const result = await listPendingInvitations({
      container,
      headers: createMockHeaders(),
      input: { email: "nobody@example.com" },
    });

    expect(result.items).toHaveLength(0);
  });

  it("should return invitations from multiple tenants", async () => {
    const container = getContainer();

    // Create first tenant
    const tenant1 = await createTestTenant(container, {
      authUserId: "auth-t1-admin",
      creatorEmail: "t1admin@example.com",
      urlPath: `t1-${Date.now()}`,
      tenantName: "Tenant 1",
    });

    // Create second tenant
    const tenant2 = await createTestTenant(container, {
      authUserId: "auth-t2-admin",
      creatorEmail: "t2admin@example.com",
      urlPath: `t2-${Date.now()}`,
      tenantName: "Tenant 2",
    });

    const t2Members = await container.unitOfWorkProvider.transaction(
      async (repos) => {
        return repos.memberRepository.findByAuthUserId("auth-t2-admin");
      },
    );

    // Invite the same email from both tenants
    await createInvitation({
      container,
      headers: createMockHeaders(),
      input: {
        tenantId: tenant1.tenantId,
        invitedByMemberId: tenant1.adminMemberId,
        email: "multi-invite@example.com",
        role: "staff",
      },
    });

    await createInvitation({
      container,
      headers: createMockHeaders(),
      input: {
        tenantId: tenant2.tenantId,
        invitedByMemberId: t2Members[0].id,
        email: "multi-invite@example.com",
        role: "admin",
      },
    });

    const result = await listPendingInvitations({
      container,
      headers: createMockHeaders(),
      input: { email: "multi-invite@example.com" },
    });

    expect(result.items).toHaveLength(2);
  });
});
