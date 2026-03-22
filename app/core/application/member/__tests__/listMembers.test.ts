import { describe, expect, it } from "vitest";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { listMembers } from "../listMembers";
import { addMemberToTenant, createTestTenant } from "./memberTestHelpers";

describe("listMembers", () => {
  const getContainer = setupTestContainer();

  it("should return all members for a tenant", async () => {
    const container = getContainer();
    const { tenantId, adminMemberId } = await createTestTenant(container);

    // Add a staff member
    await addMemberToTenant(container, {
      tenantId,
      invitedByMemberId: adminMemberId,
      email: "staff@example.com",
      role: "staff",
      authUserId: "auth-staff-1",
    });

    const result = await listMembers({
      container,
      headers: createMockHeaders(),
      input: { tenantId, role: null },
    });

    expect(result.items).toHaveLength(2);
  });

  it("should filter by admin role", async () => {
    const container = getContainer();
    const { tenantId, adminMemberId } = await createTestTenant(container);

    // Add a staff member
    await addMemberToTenant(container, {
      tenantId,
      invitedByMemberId: adminMemberId,
      email: "staff@example.com",
      role: "staff",
      authUserId: "auth-staff-1",
    });

    const result = await listMembers({
      container,
      headers: createMockHeaders(),
      input: { tenantId, role: "admin" },
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].role).toBe("admin");
  });

  it("should filter by staff role", async () => {
    const container = getContainer();
    const { tenantId, adminMemberId } = await createTestTenant(container);

    // Add a staff member
    await addMemberToTenant(container, {
      tenantId,
      invitedByMemberId: adminMemberId,
      email: "staff@example.com",
      role: "staff",
      authUserId: "auth-staff-1",
    });

    const result = await listMembers({
      container,
      headers: createMockHeaders(),
      input: { tenantId, role: "staff" },
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].role).toBe("staff");
  });

  it("should return empty items when tenant has no members", async () => {
    const container = getContainer();
    // Use a fake tenant ID that doesn't exist
    const result = await listMembers({
      container,
      headers: createMockHeaders(),
      input: { tenantId: "non-existent-tenant", role: null },
    });

    expect(result.items).toHaveLength(0);
  });

  it("should return all members when role filter is null", async () => {
    const container = getContainer();
    const { tenantId, adminMemberId } = await createTestTenant(container);

    // Add admin and staff members
    await addMemberToTenant(container, {
      tenantId,
      invitedByMemberId: adminMemberId,
      email: "staff1@example.com",
      role: "staff",
      authUserId: "auth-staff-1",
    });

    await addMemberToTenant(container, {
      tenantId,
      invitedByMemberId: adminMemberId,
      email: "admin2@example.com",
      role: "admin",
      authUserId: "auth-admin-2",
    });

    const result = await listMembers({
      container,
      headers: createMockHeaders(),
      input: { tenantId, role: null },
    });

    expect(result.items).toHaveLength(3);
  });
});
