import { getFormProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { useState } from "react";
import { data, Link, redirect } from "react-router";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { acceptInvitation } from "@/core/application/member/acceptInvitation";
import { declineInvitation } from "@/core/application/member/declineInvitation";
import { listPendingInvitations } from "@/core/application/member/listPendingInvitations";
import { getTenant } from "@/core/application/tenant/getTenant";
import { MemberId } from "@/core/domain/member/valueObject";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
  useCompositeAction,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/invitations";

type PendingInvitation = {
  id: string;
  tenantName: string;
  inviterName: string;
  role: string;
  invitedAt: string;
};

const acceptSchema = z.object({
  invitationId: z.string().min(1),
});

const declineSchema = z.object({
  invitationId: z.string().min(1),
});

const handlers = {
  accept: defineHandler({
    schema: acceptSchema,
    handler: async (value, args) => {
      const { container } = await import("@/core/di/server");

      const session = await container.authProvider.getSession(
        args.request.headers,
      );
      if (!session) {
        throw redirect("/admin/login");
      }

      return handleUseCase(() =>
        acceptInvitation({
          container,
          headers: args.request.headers,
          input: {
            invitationId: value.invitationId,
            authUserId: session.user.id,
            email: session.user.email,
          },
        }),
      ).match(
        () => success(),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
  decline: defineHandler({
    schema: declineSchema,
    handler: async (value, args) => {
      const { container } = await import("@/core/di/server");

      const session = await container.authProvider.getSession(
        args.request.headers,
      );
      if (!session) {
        throw redirect("/admin/login");
      }

      return handleUseCase(() =>
        declineInvitation({
          container,
          headers: args.request.headers,
          input: {
            invitationId: value.invitationId,
            authUserId: session.user.id,
            email: session.user.email,
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

export async function loader({ request }: Route.LoaderArgs) {
  const { container } = await import("@/core/di/server");

  const session = await container.authProvider.getSession(request.headers);
  if (!session) {
    throw redirect("/admin/login");
  }

  const result = await handleUseCase(() =>
    listPendingInvitations({
      container,
      headers: request.headers,
      input: { email: session.user.email },
    }),
  ).match(
    (result) => result,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  const invitations: PendingInvitation[] = await Promise.all(
    result.items.map(async (item) => {
      const [tenantResult, inviterMember] = await Promise.all([
        handleUseCase(() =>
          getTenant({
            container,
            headers: request.headers,
            input: { tenantId: item.tenantId },
          }),
        ).match(
          (result) => result,
          () => null,
        ),
        container.memberRepository.findById(MemberId.create(item.invitedBy)),
      ]);

      return {
        id: item.id,
        tenantName: tenantResult?.name ?? "不明なテナント",
        inviterName: inviterMember?.name ?? "不明",
        role: item.role,
        invitedAt: new Date(item.createdAt).toLocaleDateString("ja-JP", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
    }),
  );

  return { invitations };
}

function getRoleBadge(role: string): { label: string; className: string } {
  switch (role) {
    case "admin":
      return { label: "管理者", className: "bg-primary-lighter text-primary" };
    case "staff":
      return {
        label: "スタッフ",
        className: "bg-secondary-lighter text-secondary-dark",
      };
    default:
      return {
        label: role,
        className: "bg-surface-secondary text-text-secondary",
      };
  }
}

export default function AdminInvitationsPage({
  loaderData,
}: Route.ComponentProps) {
  const { invitations } = loaderData;
  const fetcher = useCompositeAction<typeof handlers>();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<
    "accept" | "decline" | null
  >(null);

  const [acceptForm] = useForm({
    id: "accept-form",
    lastResult: fetcher.data?.intent === "accept" ? fetcher.data : undefined,
    constraint: getZodConstraint(handlers.accept.schema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: handlers.accept.schema });
    },
  });

  const [declineForm] = useForm({
    id: "decline-form",
    lastResult: fetcher.data?.intent === "decline" ? fetcher.data : undefined,
    constraint: getZodConstraint(handlers.decline.schema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: handlers.decline.schema });
    },
  });

  fetcher.register("accept", {
    onSuccess: () => {
      setConfirmingId(null);
      setConfirmAction(null);
    },
  });

  fetcher.register("decline", {
    onSuccess: () => {
      setConfirmingId(null);
      setConfirmAction(null);
    },
  });

  const isPendingAccept = fetcher.isPending("accept");
  const isPendingDecline = fetcher.isPending("decline");

  const confirmingInvitation = invitations.find(
    (inv) => inv.id === confirmingId,
  );

  return (
    <div className="flex flex-1 justify-center px-[var(--space-xl)] py-[var(--space-3xl)]">
      <div className="w-full max-w-[640px]">
        <div className="mb-[var(--space-xl)] flex items-center justify-between">
          <h1 className="font-[var(--font-heading)] text-[length:var(--text-2xl)] font-[var(--weight-semibold)] leading-[var(--leading-tight)] tracking-[var(--tracking-tight)] text-neutral-900">
            招待一覧
          </h1>
          <Link
            to="/admin/tenants"
            className="inline-flex items-center gap-[var(--space-xs)] rounded-[var(--radius-sm)] text-[length:var(--text-sm)] font-[var(--weight-medium)] text-neutral-500 transition-colors duration-[0.15s] ease-[ease] hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
            テナント選択に戻る
          </Link>
        </div>

        {invitations.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-neutral-300 bg-white p-[var(--space-3xl)] text-center">
            <div className="mx-auto mb-[var(--space-lg)] flex h-14 w-14 items-center justify-center rounded-full bg-neutral-200">
              <svg
                className="h-6 w-6 text-neutral-500"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                />
              </svg>
            </div>
            <p className="text-[length:var(--text-base)] text-neutral-500">
              招待はありません
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-[var(--space-md)]">
            {invitations.map((invitation) => {
              const role = getRoleBadge(invitation.role);
              return (
                <div
                  key={invitation.id}
                  className="rounded-[var(--radius-lg)] border border-neutral-300 bg-white px-[var(--space-xl)] py-[var(--space-lg)]"
                >
                  <div className="mb-[var(--space-md)] flex items-center justify-between">
                    <span className="text-[length:var(--text-lg)] font-[var(--weight-semibold)] tracking-[var(--tracking-tight)] text-neutral-800">
                      {invitation.tenantName}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-[length:var(--text-xs)] font-[var(--weight-medium)] ${role.className}`}
                    >
                      {role.label}
                    </span>
                  </div>
                  <div className="mb-[var(--space-lg)] flex gap-[var(--space-xl)]">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[length:var(--text-xs)] tracking-[var(--tracking-wide)] text-neutral-500">
                        招待日時
                      </span>
                      <span className="text-[length:var(--text-sm)] text-neutral-700">
                        {invitation.invitedAt}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[length:var(--text-xs)] tracking-[var(--tracking-wide)] text-neutral-500">
                        招待者
                      </span>
                      <span className="text-[length:var(--text-sm)] text-neutral-700">
                        {invitation.inviterName}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-[var(--space-sm)]">
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmingId(invitation.id);
                        setConfirmAction("accept");
                      }}
                      className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] bg-primary px-[var(--space-lg)] text-[length:var(--text-sm)] font-[var(--weight-medium)] tracking-[var(--tracking-wide)] text-white transition-[background,transform] duration-[0.15s] ease-[ease] hover:bg-primary-dark active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      承認する
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmingId(invitation.id);
                        setConfirmAction("decline");
                      }}
                      className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] border border-neutral-300 bg-white px-[var(--space-lg)] text-[length:var(--text-sm)] font-[var(--weight-medium)] tracking-[var(--tracking-wide)] text-neutral-600 transition-[background,border-color,color,transform] duration-[0.15s] ease-[ease] hover:border-neutral-400 hover:bg-neutral-200 hover:text-neutral-800 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      辞退する
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        open={confirmingId !== null}
        onClose={() => {
          setConfirmingId(null);
          setConfirmAction(null);
        }}
        title={confirmAction === "accept" ? "招待の承認" : "招待の辞退"}
      >
        <p className="mb-4 text-[length:var(--text-sm)] text-neutral-600">
          {confirmAction === "accept"
            ? `${confirmingInvitation?.tenantName ?? ""}への招待を承認しますか？`
            : `${confirmingInvitation?.tenantName ?? ""}への招待を辞退しますか？`}
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setConfirmingId(null);
              setConfirmAction(null);
            }}
            className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] border border-neutral-300 bg-white px-[var(--space-lg)] text-[length:var(--text-sm)] font-[var(--weight-medium)] text-neutral-600 transition-colors hover:bg-neutral-200"
          >
            キャンセル
          </button>
          {confirmAction === "accept" ? (
            <fetcher.Form method="post" {...getFormProps(acceptForm)}>
              <input type="hidden" name="intent" value="accept" />
              <input
                type="hidden"
                name="invitationId"
                value={confirmingId ?? ""}
              />
              <button
                type="submit"
                disabled={isPendingAccept}
                className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] bg-primary px-[var(--space-lg)] text-[length:var(--text-sm)] font-[var(--weight-medium)] text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
              >
                {isPendingAccept ? "処理中..." : "承認する"}
              </button>
            </fetcher.Form>
          ) : (
            <fetcher.Form method="post" {...getFormProps(declineForm)}>
              <input type="hidden" name="intent" value="decline" />
              <input
                type="hidden"
                name="invitationId"
                value={confirmingId ?? ""}
              />
              <button
                type="submit"
                disabled={isPendingDecline}
                className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] bg-destructive px-[var(--space-lg)] text-[length:var(--text-sm)] font-[var(--weight-medium)] text-white transition-colors hover:bg-destructive/90 disabled:opacity-50"
              >
                {isPendingDecline ? "処理中..." : "辞退する"}
              </button>
            </fetcher.Form>
          )}
        </div>
      </Modal>
    </div>
  );
}
