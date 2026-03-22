import { describe, expect, it } from "vitest";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { listMemberTenants } from "../listMemberTenants";
import { addMemberToTenant, createTestTenant } from "./memberTestHelpers";

describe("listMemberTenants", () => {
  const getContainer = setupTestContainer();

  it("should return all tenants a member belongs to", async () => {
    const container = getContainer();

    // Create first tenant
    const tenant1 = await createTestTenant(container, {
      authUserId: "auth-member-1",
      creatorEmail: "member@example.com",
      urlPath: `tenant1-${Date.now()}`,
      tenantName: "Tenant One",
    });

    // Create second tenant and add the same user
    const tenant2 = await createTestTenant(container, {
      authUserId: "auth-t2-owner",
      creatorEmail: "owner2@example.com",
      urlPath: `tenant2-${Date.now()}`,
      tenantName: "Tenant Two",
    });

    const t2Members = await container.unitOfWorkProvider.transaction(
      async (repos) => {
        return repos.memberRepository.findByAuthUserId("auth-t2-owner");
      },
    );

    await addMemberToTenant(container, {
      tenantId: tenant2.tenantId,
      invitedByMemberId: t2Members[0].id,
      email: "member@example.com",
      role: "staff",
      authUserId: "auth-member-1",
    });

    const result = await listMemberTenants({
      container,
      headers: createMockHeaders(),
      input: { authUserId: "auth-member-1" },
    });

    expect(result.items).toHaveLength(2);
    expect(result.items.map((i) => i.tenantName)).toContain("Tenant One");
    expect(result.items.map((i) => i.tenantName)).toContain("Tenant Two");
  });

  it("should return empty items when member belongs to no tenants", async () => {
    const container = getContainer();

    const result = await listMemberTenants({
      container,
      headers: createMockHeaders(),
      input: { authUserId: "auth-no-tenants" },
    });

    expect(result.items).toHaveLength(0);
  });

  it("should return one tenant when member belongs to single tenant", async () => {
    const container = getContainer();
    await createTestTenant(container, {
      authUserId: "auth-single-tenant",
      creatorEmail: "single@example.com",
      urlPath: `single-${Date.now()}`,
      tenantName: "Single Tenant",
    });

    const result = await listMemberTenants({
      container,
      headers: createMockHeaders(),
      input: { authUserId: "auth-single-tenant" },
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].tenantName).toBe("Single Tenant");
    expect(result.items[0].role).toBe("admin");
  });

  it("should return correct roles for different tenants", async () => {
    const container = getContainer();

    // Create first tenant as admin
    await createTestTenant(container, {
      authUserId: "auth-multi-role",
      creatorEmail: "multirole@example.com",
      urlPath: `admin-tenant-${Date.now()}`,
      tenantName: "Admin Tenant",
    });

    // Create second tenant and invite as staff
    const tenant2 = await createTestTenant(container, {
      authUserId: "auth-t2-admin",
      creatorEmail: "t2admin@example.com",
      urlPath: `staff-tenant-${Date.now()}`,
      tenantName: "Staff Tenant",
    });

    const t2Members = await container.unitOfWorkProvider.transaction(
      async (repos) => {
        return repos.memberRepository.findByAuthUserId("auth-t2-admin");
      },
    );

    await addMemberToTenant(container, {
      tenantId: tenant2.tenantId,
      invitedByMemberId: t2Members[0].id,
      email: "multirole@example.com",
      role: "staff",
      authUserId: "auth-multi-role",
    });

    const result = await listMemberTenants({
      container,
      headers: createMockHeaders(),
      input: { authUserId: "auth-multi-role" },
    });

    expect(result.items).toHaveLength(2);
    const adminTenant = result.items.find(
      (i) => i.tenantName === "Admin Tenant",
    );
    const staffTenant = result.items.find(
      (i) => i.tenantName === "Staff Tenant",
    );
    expect(adminTenant!.role).toBe("admin");
    expect(staffTenant!.role).toBe("staff");
  });

  it("should return empty items for non-existent authUserId", async () => {
    const container = getContainer();

    const result = await listMemberTenants({
      container,
      headers: createMockHeaders(),
      input: { authUserId: "non-existent" },
    });

    expect(result.items).toHaveLength(0);
  });
});
