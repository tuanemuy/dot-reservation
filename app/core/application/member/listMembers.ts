import { MemberRole } from "@/core/domain/member/valueObject";
import { TenantId } from "@/core/domain/tenant/valueObject";
import type { ServiceArgs } from "../types";

export type ListMembersInput = {
  tenantId: string;
  role: string | null;
};

export type MemberSummary = {
  id: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
};

export type ListMembersOutput = {
  items: MemberSummary[];
};

export async function listMembers({
  container,
  input,
}: ServiceArgs<ListMembersInput>): Promise<ListMembersOutput> {
  const tenantId = TenantId.create(input.tenantId);
  const roleFilter = input.role ? MemberRole.create(input.role) : null;

  const result = await container.unitOfWorkProvider.transaction(
    async (repositories) => {
      return repositories.memberRepository.findByTenantId(tenantId, {
        page: 1,
        limit: 1000,
      });
    },
  );

  let items = result.items.map((member) => ({
    id: member.id as string,
    name: member.name as string,
    email: member.email as string,
    role: member.role,
    joinedAt: member.joinedAt.toISOString(),
  }));

  if (roleFilter) {
    items = items.filter((item) => item.role === roleFilter);
  }

  return { items };
}
