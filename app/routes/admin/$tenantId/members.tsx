import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { useState } from "react";
import { data, redirect } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cancelInvitation } from "@/core/application/member/cancelInvitation";
import { changeMemberRole } from "@/core/application/member/changeMemberRole";
import { createInvitation } from "@/core/application/member/createInvitation";
import { listInvitations } from "@/core/application/member/listInvitations";
import { listMembers } from "@/core/application/member/listMembers";
import { removeMember } from "@/core/application/member/removeMember";
import { resendInvitation } from "@/core/application/member/resendInvitation";
import { container } from "@/core/di/server";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
  useCompositeAction,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/members";

export async function loader({ params, request }: Route.LoaderArgs) {
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

const roleLabels: Record<string, { text: string; className: string }> = {
  admin: {
    text: "管理者",
    className: "bg-secondary-lighter text-secondary-dark",
  },
  staff: {
    text: "スタッフ",
    className: "bg-primary-lighter text-primary-dark",
  },
};

export default function TenantMembersPage({
  loaderData,
}: Route.ComponentProps) {
  const { currentMemberId, currentMemberRole, members, invitations } =
    loaderData;
  const fetcher = useCompositeAction<typeof handlers>();
  const [activeTab, setActiveTab] = useState<"members" | "invitations">(
    "members",
  );
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const removingMember = removingMemberId
    ? members.find((m) => m.id === removingMemberId)
    : null;
  const canManageMembers =
    currentMemberRole === "admin" || currentMemberRole === "owner";

  const [inviteForm, inviteFields] = useForm({
    id: "invite-form",
    lastResult: fetcher.data?.intent === "invite" ? fetcher.data : undefined,
    constraint: getZodConstraint(handlers.invite.schema),
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: handlers.invite.schema });
    },
  });

  fetcher.register("invite", {
    onSuccess: () => {
      setShowInviteForm(false);
    },
    onHandlerError: ({ error: err }) => {
      toast.error(err?.[""]?.[0] ?? "招待に失敗しました");
    },
  });

  fetcher.register("removeMember", {
    onSuccess: () => {
      setRemovingMemberId(null);
      toast.success("メンバーを削除しました");
    },
    onHandlerError: ({ error: err }) => {
      toast.error(err?.[""]?.[0] ?? "メンバーの削除に失敗しました");
    },
  });

  const isPendingInvite = fetcher.isPending("invite");
  const isPendingChangeRole = fetcher.isPending("changeRole");
  const isPendingRemove = fetcher.isPending("removeMember");

  return (
    <div className="">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-800">メンバー管理</h1>
        <button
          type="button"
          onClick={() => setShowInviteForm(true)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
        >
          メンバーを招待
        </button>
      </div>

      {/* 招待フォーム */}
      {showInviteForm && (
        <div className="mb-6 rounded-[var(--radius-lg)] border border-neutral-300 bg-white p-[var(--space-lg)]">
          <h2 className="mb-[var(--space-md)] font-[var(--font-heading)] text-[length:var(--text-lg)] font-[var(--weight-semibold)] tracking-[var(--tracking-tight)] text-neutral-800">
            メンバー招待
          </h2>
          <fetcher.Form
            method="post"
            {...getFormProps(inviteForm)}
            className="flex items-end gap-4"
          >
            <input type="hidden" name="intent" value="invite" />
            <div className="flex-1">
              <label
                htmlFor={inviteFields.email.id}
                className="mb-[var(--space-sm)] block text-[length:var(--text-sm)] font-[var(--weight-medium)] text-neutral-700"
              >
                メールアドレス
              </label>
              <input
                {...getInputProps(inviteFields.email, { type: "email" })}
                className="h-11 w-full rounded-[var(--radius-md)] border border-neutral-300 bg-white px-[var(--space-md)] text-[length:var(--text-base)] text-neutral-800 transition-[border-color] duration-[0.15s] ease-[ease] hover:border-neutral-400 focus:border-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary"
                placeholder="email@example.com"
              />
              {inviteFields.email.errors && (
                <p className="mt-1 text-[length:var(--text-xs)] text-error">
                  {inviteFields.email.errors}
                </p>
              )}
            </div>
            <div className="w-40">
              <label
                htmlFor={inviteFields.role.id}
                className="mb-[var(--space-sm)] block text-[length:var(--text-sm)] font-[var(--weight-medium)] text-neutral-700"
              >
                ロール
              </label>
              <select
                {...getInputProps(inviteFields.role, { type: "text" })}
                className="h-11 w-full rounded-[var(--radius-md)] border border-neutral-300 bg-white px-[var(--space-md)] text-[length:var(--text-base)] text-neutral-800 transition-[border-color] duration-[0.15s] ease-[ease] hover:border-neutral-400 focus:border-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary"
              >
                <option value="staff">スタッフ</option>
                <option value="admin">管理者</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={isPendingInvite}
              className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] bg-primary px-[var(--space-lg)] text-[length:var(--text-sm)] font-[var(--weight-medium)] tracking-[var(--tracking-wide)] text-white transition-[background,transform] duration-[0.15s] ease-[ease] hover:bg-primary-dark active:scale-[0.99] disabled:opacity-50"
            >
              {isPendingInvite ? "送信中..." : "招待を送信"}
            </button>
            <button
              type="button"
              onClick={() => setShowInviteForm(false)}
              className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] border border-neutral-300 bg-white px-[var(--space-lg)] text-[length:var(--text-sm)] font-[var(--weight-medium)] text-neutral-600 transition-colors hover:bg-neutral-200"
            >
              キャンセル
            </button>
          </fetcher.Form>
        </div>
      )}

      {/* タブ */}
      <div className="mb-6 border-b border-neutral-300">
        <nav className="flex gap-4">
          <button
            type="button"
            onClick={() => setActiveTab("members")}
            className={`border-b-2 px-1 pb-3 text-sm font-medium ${
              activeTab === "members"
                ? "border-primary text-primary"
                : "border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-600"
            }`}
          >
            メンバー ({members.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("invitations")}
            className={`border-b-2 px-1 pb-3 text-sm font-medium ${
              activeTab === "invitations"
                ? "border-primary text-primary"
                : "border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-600"
            }`}
          >
            招待 ({invitations.length})
          </button>
        </nav>
      </div>

      {/* メンバー一覧 */}
      {activeTab === "members" && (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-neutral-300 bg-white">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-neutral-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                  名前
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                  メールアドレス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                  ロール
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                  参加日
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.map((member) => {
                const role = roleLabels[member.role] ?? {
                  text: member.role,
                  className: "bg-neutral-200 text-neutral-800",
                };
                return (
                  <tr key={member.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-neutral-800">
                      {member.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500">
                      {member.email}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${role.className}`}
                      >
                        {role.text}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500">
                      {new Date(member.joinedAt).toLocaleDateString("ja-JP")}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                      <div className="flex items-center justify-end gap-3">
                        <fetcher.Form method="post" className="inline">
                          <input
                            type="hidden"
                            name="intent"
                            value="changeRole"
                          />
                          <input
                            type="hidden"
                            name="memberId"
                            value={member.id}
                          />
                          <select
                            name="role"
                            defaultValue={member.role}
                            disabled={isPendingChangeRole}
                            onChange={(e) => {
                              const form = e.target.closest("form");
                              if (form) form.requestSubmit();
                            }}
                            className="rounded border border-neutral-300 px-2 py-1 text-xs text-neutral-600"
                          >
                            <option value="admin">管理者</option>
                            <option value="staff">スタッフ</option>
                          </select>
                        </fetcher.Form>
                        {canManageMembers && member.id !== currentMemberId && (
                          <button
                            type="button"
                            onClick={() => setRemovingMemberId(member.id)}
                            className="font-medium text-destructive hover:text-destructive"
                          >
                            削除
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 招待一覧 */}
      {activeTab === "invitations" && (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-neutral-300 bg-white">
          {invitations.length === 0 ? (
            <div className="p-8 text-center text-sm text-neutral-500">
              招待はありません
            </div>
          ) : (
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-neutral-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                    メールアドレス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                    ロール
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                    招待日
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invitations.map((invitation) => {
                  const invitationRole = roleLabels[invitation.role] ?? {
                    text: invitation.role,
                    className: "bg-neutral-200 text-neutral-800",
                  };
                  return (
                    <tr key={invitation.id}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-800">
                        {invitation.email}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${invitationRole.className}`}
                        >
                          {invitationRole.text}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <StatusBadge
                          status={invitation.status}
                          variant="invitation"
                        />
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500">
                        {new Date(invitation.createdAt).toLocaleDateString(
                          "ja-JP",
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        {invitation.status === "pending" && (
                          <div className="flex justify-end gap-2">
                            <fetcher.Form method="post" className="inline">
                              <input
                                type="hidden"
                                name="intent"
                                value="resendInvitation"
                              />
                              <input
                                type="hidden"
                                name="invitationId"
                                value={invitation.id}
                              />
                              <button
                                type="submit"
                                className="text-sm font-medium text-primary hover:text-primary disabled:opacity-50"
                              >
                                再送信
                              </button>
                            </fetcher.Form>
                            <fetcher.Form method="post" className="inline">
                              <input
                                type="hidden"
                                name="intent"
                                value="cancelInvitation"
                              />
                              <input
                                type="hidden"
                                name="invitationId"
                                value={invitation.id}
                              />
                              <button
                                type="submit"
                                className="text-sm font-medium text-destructive hover:text-destructive disabled:opacity-50"
                              >
                                取消
                              </button>
                            </fetcher.Form>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* メンバー削除確認モーダル */}
      <Modal
        open={removingMemberId !== null}
        onClose={() => setRemovingMemberId(null)}
        title="メンバー削除"
      >
        <p className="mb-6 text-sm text-neutral-600">
          {removingMember
            ? `${removingMember.name} を削除しますか？`
            : "このメンバーを削除しますか？"}
          担当している予約は「担当者未定」になります。
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setRemovingMemberId(null)}
            className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] border border-neutral-300 bg-white px-[var(--space-lg)] text-[length:var(--text-sm)] font-[var(--weight-medium)] text-neutral-600 transition-colors hover:bg-neutral-200"
          >
            キャンセル
          </button>
          <fetcher.Form
            method="post"
            onSubmit={() => {
              // Modal will close on success via the register callback
            }}
          >
            <input type="hidden" name="intent" value="removeMember" />
            <input
              type="hidden"
              name="memberId"
              value={removingMemberId ?? ""}
            />
            <button
              type="submit"
              disabled={isPendingRemove}
              className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] bg-destructive px-[var(--space-lg)] text-[length:var(--text-sm)] font-[var(--weight-medium)] text-white transition-colors hover:opacity-90 disabled:opacity-50"
            >
              {isPendingRemove ? "削除中..." : "削除する"}
            </button>
          </fetcher.Form>
        </div>
      </Modal>
    </div>
  );
}
