import { redirect } from "react-router";
import { z } from "zod";
import { cancelInvitation } from "@/core/application/member/cancelInvitation";
import { changeMemberRole } from "@/core/application/member/changeMemberRole";
import { createInvitation } from "@/core/application/member/createInvitation";
import { removeMember } from "@/core/application/member/removeMember";
import { resendInvitation } from "@/core/application/member/resendInvitation";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/index";

const inviteSchema = z.object({
  email: z
    .string()
    .min(1, "メールアドレスを入力してください")
    .email("有効なメールアドレスを入力してください"),
  role: z.string().min(1, "ロールを選択してください"),
});

const changeRoleSchema = z.object({
  memberId: z.string().min(1),
  role: z.string().min(1),
});

const removeMemberSchema = z.object({
  memberId: z.string().min(1),
});

const cancelInvitationSchema = z.object({
  invitationId: z.string().min(1),
});

const resendInvitationSchema = z.object({
  invitationId: z.string().min(1),
});

async function getAuthenticatedMemberId(
  headers: Headers,
  tenantId: string,
): Promise<string> {
  const { container } = await import("@/core/di/server");
  const session = await container.authProvider.getSession(headers);
  if (!session) throw redirect("/admin/login");

  const members = await container.memberRepository.findByAuthUserId(
    session.user.id,
  );
  const memberInTenant = members.find((m) => m.tenantId === tenantId);
  if (!memberInTenant) throw redirect("/admin/tenants");

  return memberInTenant.id;
}

export const handlers = {
  invite: defineHandler({
    schema: inviteSchema,
    handler: async (value, args) => {
      const { container } = await import("@/core/di/server");
      const memberId = await getAuthenticatedMemberId(
        args.request.headers,
        args.params.tenantId as string,
      );
      return handleUseCase(() =>
        createInvitation({
          container,
          headers: args.request.headers,
          input: {
            tenantId: args.params.tenantId as string,
            invitedByMemberId: memberId,
            email: value.email,
            role: value.role,
          },
        }),
      ).match(
        (result) => success({ id: result.id }),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
  changeRole: defineHandler({
    schema: changeRoleSchema,
    handler: async (value, args) => {
      const { container } = await import("@/core/di/server");
      const memberId = await getAuthenticatedMemberId(
        args.request.headers,
        args.params.tenantId as string,
      );
      return handleUseCase(() =>
        changeMemberRole({
          container,
          headers: args.request.headers,
          input: {
            tenantId: args.params.tenantId as string,
            operatorMemberId: memberId,
            targetMemberId: value.memberId,
            newRole: value.role,
          },
        }),
      ).match(
        () => success(),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
  removeMember: defineHandler({
    schema: removeMemberSchema,
    handler: async (value, args) => {
      const { container } = await import("@/core/di/server");
      const memberId = await getAuthenticatedMemberId(
        args.request.headers,
        args.params.tenantId as string,
      );
      return handleUseCase(() =>
        removeMember({
          container,
          headers: args.request.headers,
          input: {
            tenantId: args.params.tenantId as string,
            operatorMemberId: memberId,
            targetMemberId: value.memberId,
          },
        }),
      ).match(
        () => success(),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
  cancelInvitation: defineHandler({
    schema: cancelInvitationSchema,
    handler: async (value, args) => {
      const { container } = await import("@/core/di/server");
      return handleUseCase(() =>
        cancelInvitation({
          container,
          headers: args.request.headers,
          input: { invitationId: value.invitationId },
        }),
      ).match(
        () => success(),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
  resendInvitation: defineHandler({
    schema: resendInvitationSchema,
    handler: async (value, args) => {
      const { container } = await import("@/core/di/server");
      return handleUseCase(() =>
        resendInvitation({
          container,
          headers: args.request.headers,
          input: {
            invitationId: value.invitationId,
          },
        }),
      ).match(
        () => success(),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}
