import { getFormProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { useState } from "react";
import { data, redirect } from "react-router";
import { z } from "zod";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
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
        invitedAt: new Date(item.createdAt).toLocaleDateString("ja-JP"),
      };
    }),
  );

  return { invitations };
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
    onHandlerError: ({ error: err }) => {
      console.error("Accept invitation failed:", err);
    },
  });

  fetcher.register("decline", {
    onSuccess: () => {
      setConfirmingId(null);
      setConfirmAction(null);
    },
    onHandlerError: ({ error: err }) => {
      console.error("Decline invitation failed:", err);
    },
  });

  const isPendingAccept = fetcher.isPending("accept");
  const isPendingDecline = fetcher.isPending("decline");

  const confirmingInvitation = invitations.find(
    (inv) => inv.id === confirmingId,
  );

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-text">招待一覧</h1>

      {invitations.length === 0 ? (
        <div className="rounded-lg border border-border bg-white p-12 text-center">
          <p className="text-text-secondary">未対応の招待はありません</p>
        </div>
      ) : (
        <div className="space-y-4">
          {invitations.map((invitation) => (
            <Card key={invitation.id}>
              <CardBody>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-text">
                      {invitation.tenantName}
                    </h2>
                    <p className="mt-1 text-sm text-text-secondary">
                      招待者: {invitation.inviterName}
                    </p>
                    <p className="mt-1 text-sm text-text-secondary">
                      招待日: {invitation.invitedAt}
                    </p>
                    <Badge className="mt-2">{invitation.role}</Badge>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setConfirmingId(invitation.id);
                        setConfirmAction("accept");
                      }}
                    >
                      承認
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setConfirmingId(invitation.id);
                        setConfirmAction("decline");
                      }}
                    >
                      辞退
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={confirmingId !== null}
        onClose={() => {
          setConfirmingId(null);
          setConfirmAction(null);
        }}
        title={confirmAction === "accept" ? "招待の承認" : "招待の辞退"}
      >
        <p className="mb-4 text-sm text-text-secondary">
          {confirmAction === "accept"
            ? `${confirmingInvitation?.tenantName ?? ""}への招待を承認しますか？`
            : `${confirmingInvitation?.tenantName ?? ""}への招待を辞退しますか？`}
        </p>
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setConfirmingId(null);
              setConfirmAction(null);
            }}
          >
            キャンセル
          </Button>
          {confirmAction === "accept" ? (
            <fetcher.Form method="post" {...getFormProps(acceptForm)}>
              <input type="hidden" name="intent" value="accept" />
              <input
                type="hidden"
                name="invitationId"
                value={confirmingId ?? ""}
              />
              <Button type="submit" disabled={isPendingAccept}>
                {isPendingAccept ? "処理中..." : "承認する"}
              </Button>
            </fetcher.Form>
          ) : (
            <fetcher.Form method="post" {...getFormProps(declineForm)}>
              <input type="hidden" name="intent" value="decline" />
              <input
                type="hidden"
                name="invitationId"
                value={confirmingId ?? ""}
              />
              <Button
                type="submit"
                variant="destructive"
                disabled={isPendingDecline}
              >
                {isPendingDecline ? "処理中..." : "辞退する"}
              </Button>
            </fetcher.Form>
          )}
        </div>
      </Modal>
    </div>
  );
}
