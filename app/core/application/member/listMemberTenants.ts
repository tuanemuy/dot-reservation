import type { ServiceArgs } from "../types";

export type ListMemberTenantsInput = {
  authUserId: string;
};

export type TenantWithRole = {
  tenantId: string;
  tenantName: string;
  role: string;
};

export type ListMemberTenantsOutput = {
  items: TenantWithRole[];
};

export async function listMemberTenants({
  container,
  input,
}: ServiceArgs<ListMemberTenantsInput>): Promise<ListMemberTenantsOutput> {
  const items = await container.unitOfWorkProvider.transaction(
    async (repositories) => {
      const members = await repositories.memberRepository.findByAuthUserId(
        input.authUserId,
      );

      const results: TenantWithRole[] = [];
      for (const member of members) {
        const tenant = await repositories.tenantRepository.findById(
          member.tenantId,
        );
        if (tenant) {
          results.push({
            tenantId: tenant.id,
            tenantName: tenant.name,
            role: member.role,
          });
        }
      }

      return results;
    },
  );

  return { items };
}
