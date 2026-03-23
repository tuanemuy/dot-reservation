import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { useState } from "react";
import { data, redirect } from "react-router";
import { z } from "zod";
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
  admin: { text: "管理者", className: "bg-purple-100 text-purple-800" },
  staff: { text: "スタッフ", className: "bg-blue-100 text-blue-800" },
};

const invitationStatusLabels: Record<
  string,
  { text: string; className: string }
> = {
  pending: { text: "未対応", className: "bg-yellow-100 text-yellow-800" },
  accepted: { text: "承認済み", className: "bg-green-100 text-green-800" },
  declined: { text: "辞退", className: "bg-red-100 text-red-800" },
  cancelled: { text: "取消済み", className: "bg-gray-100 text-gray-800" },
};

export default function TenantMembersPage({
  loaderData,
}: Route.ComponentProps) {
  const { members, invitations } = loaderData;
  const fetcher = useCompositeAction<typeof handlers>();
  const [activeTab, setActiveTab] = useState<"members" | "invitations">(
    "members",
  );
  const [showInviteForm, setShowInviteForm] = useState(false);

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
      console.error(err?.[""]?.[0] ?? "招待に失敗しました");
    },
  });

  const isPendingInvite = fetcher.isPending("invite");
  const isPendingChangeRole = fetcher.isPending("changeRole");

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">メンバー管理</h1>
        <button
          type="button"
          onClick={() => setShowInviteForm(true)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          メンバーを招待
        </button>
      </div>

      {/* 招待フォーム */}
      {showInviteForm && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
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
                className="block text-sm font-medium text-gray-700"
              >
                メールアドレス
              </label>
              <input
                {...getInputProps(inviteFields.email, { type: "email" })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="email@example.com"
              />
              {inviteFields.email.errors && (
                <p className="mt-1 text-sm text-red-600">
                  {inviteFields.email.errors}
                </p>
              )}
            </div>
            <div className="w-40">
              <label
                htmlFor={inviteFields.role.id}
                className="block text-sm font-medium text-gray-700"
              >
                ロール
              </label>
              <select
                {...getInputProps(inviteFields.role, { type: "text" })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="staff">スタッフ</option>
                <option value="admin">管理者</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={isPendingInvite}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isPendingInvite ? "送信中..." : "招待を送信"}
            </button>
            <button
              type="button"
              onClick={() => setShowInviteForm(false)}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              キャンセル
            </button>
          </fetcher.Form>
        </div>
      )}

      {/* タブ */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex gap-4">
          <button
            type="button"
            onClick={() => setActiveTab("members")}
            className={`border-b-2 px-1 pb-3 text-sm font-medium ${
              activeTab === "members"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            メンバー ({members.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("invitations")}
            className={`border-b-2 px-1 pb-3 text-sm font-medium ${
              activeTab === "invitations"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            招待 ({invitations.length})
          </button>
        </nav>
      </div>

      {/* メンバー一覧 */}
      {activeTab === "members" && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  名前
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  メールアドレス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  ロール
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  参加日
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {members.map((member) => {
                const role = roleLabels[member.role] ?? {
                  text: member.role,
                  className: "bg-gray-100 text-gray-800",
                };
                return (
                  <tr key={member.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {member.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {member.email}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${role.className}`}
                      >
                        {role.text}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {new Date(member.joinedAt).toLocaleDateString("ja-JP")}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                      <fetcher.Form method="post" className="inline">
                        <input type="hidden" name="intent" value="changeRole" />
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
                          className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700"
                        >
                          <option value="admin">管理者</option>
                          <option value="staff">スタッフ</option>
                        </select>
                      </fetcher.Form>
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
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          {invitations.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              招待はありません
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    メールアドレス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    ロール
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    招待日
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invitations.map((invitation) => {
                  const statusLabel = invitationStatusLabels[
                    invitation.status
                  ] ?? {
                    text: invitation.status,
                    className: "bg-gray-100 text-gray-800",
                  };
                  const invitationRole = roleLabels[invitation.role] ?? {
                    text: invitation.role,
                    className: "bg-gray-100 text-gray-800",
                  };
                  return (
                    <tr key={invitation.id}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
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
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusLabel.className}`}
                        >
                          {statusLabel.text}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
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
                                className="text-sm font-medium text-blue-600 hover:text-blue-500 disabled:opacity-50"
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
                                className="text-sm font-medium text-red-600 hover:text-red-500 disabled:opacity-50"
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
    </div>
  );
}
