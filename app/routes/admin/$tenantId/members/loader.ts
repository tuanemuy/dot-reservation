import { data, redirect } from "react-router";
import { listInvitations } from "@/core/application/member/listInvitations";
import { listMembers } from "@/core/application/member/listMembers";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/index";

export async function loader({ params, request }: Route.LoaderArgs) {
  const { container } = await import("@/core/di/server");
  const tenantId = params.tenantId;

  const session = await container.authProvider.getSession(request.headers);
  if (!session) throw redirect("/admin/login");

  const currentUserMembers = await container.memberRepository.findByAuthUserId(
    session.user.id,
  );
  const currentMember = currentUserMembers.find((m) => m.tenantId === tenantId);
  if (!currentMember) throw redirect("/admin/tenants");

  const membersResult = await handleUseCase(() =>
    listMembers({
      container,
      headers: request.headers,
      input: { tenantId, role: null },
    }),
  ).match(
    (result) => result,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  const invitationsResult = await handleUseCase(() =>
    listInvitations({
      container,
      headers: request.headers,
      input: { tenantId },
    }),
  ).match(
    (result) => result,
    () => ({ items: [] }),
  );

  return {
    currentMemberId: currentMember.id as string,
    currentMemberRole: currentMember.role as string,
    members: membersResult.items,
    invitations: invitationsResult.items,
  };
}
