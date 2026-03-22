import {
  createMockHeaders,
  type TestContainer,
} from "@/core/application/__tests__/helpers";
import { createTenant } from "@/core/application/tenant/createTenant";
import { acceptInvitation } from "../acceptInvitation";
import { createInvitation } from "../createInvitation";

/**
 * Helper to create a tenant with an admin member for testing.
 * Returns the tenant ID and the admin member ID.
 */
export async function createTestTenant(
  container: TestContainer,
  options?: {
    authUserId?: string;
    creatorName?: string;
    creatorEmail?: string;
    tenantName?: string;
    urlPath?: string;
  },
): Promise<{ tenantId: string; adminMemberId: string }> {
  const authUserId = options?.authUserId ?? "auth-admin-1";
  const creatorEmail = options?.creatorEmail ?? "admin@example.com";

  const tenantResult = await createTenant({
    container,
    headers: createMockHeaders(),
    input: {
      authUserId,
      name: options?.tenantName ?? "Test Tenant",
      category: "salon",
      urlPath: options?.urlPath ?? `test-tenant-${Date.now()}`,
      postalCode: "100-0001",
      address: {
        prefecture: "Tokyo",
        city: "Chiyoda",
        street: "1-1-1",
      },
      phoneNumber: "03-1234-5678",
      creatorName: options?.creatorName ?? "Admin User",
      creatorEmail,
    },
  });

  // Find admin member created by createTenant
  const members = await container.unitOfWorkProvider.transaction(
    async (repositories) => {
      return repositories.memberRepository.findByAuthUserId(authUserId);
    },
  );
  const adminMember = members.find((m) => m.tenantId === tenantResult.id);

  return {
    tenantId: tenantResult.id,
    adminMemberId: adminMember!.id,
  };
}

/**
 * Helper to add an additional member to a tenant via invitation workflow.
 */
export async function addMemberToTenant(
  container: TestContainer,
  options: {
    tenantId: string;
    invitedByMemberId: string;
    email: string;
    role: string;
    authUserId: string;
  },
): Promise<{ memberId: string }> {
  const invResult = await createInvitation({
    container,
    headers: createMockHeaders(),
    input: {
      tenantId: options.tenantId,
      invitedByMemberId: options.invitedByMemberId,
      email: options.email,
      role: options.role,
    },
  });

  const acceptResult = await acceptInvitation({
    container,
    headers: createMockHeaders(),
    input: {
      invitationId: invResult.id,
      authUserId: options.authUserId,
      email: options.email,
    },
  });

  return { memberId: acceptResult.memberId };
}
