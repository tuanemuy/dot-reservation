import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { useState } from "react";
import { data, useNavigate } from "react-router";
import { z } from "zod";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { deleteCustomer } from "@/core/application/customer/deleteCustomer";
import { getCustomer } from "@/core/application/customer/getCustomer";
import { reactivateCustomer } from "@/core/application/customer/reactivateCustomer";
import { suspendCustomer } from "@/core/application/customer/suspendCustomer";
import { container } from "@/core/di/server";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
  useCompositeAction,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/$userId";

const suspendSchema = z.object({
  reason: z.string().optional(),
});

const resumeSchema = z.object({});

const deleteSchema = z.object({
  confirmText: z.string().min(1, "「削除」と入力してください"),
});

const handlers = {
  suspend: defineHandler({
    schema: suspendSchema,
    handler: async (_value, args) => {
      const userId = args.params.userId!;
      return handleUseCase(() =>
        suspendCustomer({
          container,
          headers: args.request.headers,
          input: { customerId: userId },
        }),
      ).match(
        () => success(),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
  resume: defineHandler({
    schema: resumeSchema,
    handler: async (_value, args) => {
      const userId = args.params.userId!;
      return handleUseCase(() =>
        reactivateCustomer({
          container,
          headers: args.request.headers,
          input: { customerId: userId },
        }),
      ).match(
        () => success(),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
  delete: defineHandler({
    schema: deleteSchema,
    handler: async (value, args) => {
      if (value.confirmText !== "削除") {
        return error({ confirmText: ["「削除」と入力してください"] });
      }
      const userId = args.params.userId!;
      return handleUseCase(() =>
        deleteCustomer({
          container,
          headers: args.request.headers,
          input: { customerId: userId },
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

export async function loader({ params, request }: Route.LoaderArgs) {
  const customerResult = await handleUseCase(() =>
    getCustomer({
      container,
      headers: request.headers,
      input: { customerId: params.userId },
    }),
  ).match(
    (result) => result,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  return {
    user: {
      id: customerResult.id,
      name: customerResult.displayName,
      email: customerResult.email,
      phone: customerResult.phoneNumber ?? "",
      status: customerResult.status as "active" | "suspended",
      createdAt: customerResult.createdAt.toLocaleDateString("ja-JP"),
      lastLoginAt: null as string | null,
    },
    reservationStats: {
      totalCount: 0,
      recentReservations: [] as {
        id: string;
        tenantName: string;
        menuName: string;
        dateTime: string;
        status: string;
      }[],
    },
  };
}

const statusLabels: Record<string, string> = {
  active: "アクティブ",
  suspended: "停止中",
};

const statusBadgeVariant: Record<string, "success" | "destructive"> = {
  active: "success",
  suspended: "destructive",
};

export default function PlatformUserDetailPage({
  loaderData,
}: Route.ComponentProps) {
  const { user, reservationStats } = loaderData;
  const fetcher = useCompositeAction<typeof handlers>();
  const navigate = useNavigate();
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [suspendForm, suspendFields] = useForm({
    id: "user-suspend-form",
    lastResult: fetcher.data?.intent === "suspend" ? fetcher.data : undefined,
    constraint: getZodConstraint(handlers.suspend.schema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: handlers.suspend.schema });
    },
  });

  const [resumeForm] = useForm({
    id: "user-resume-form",
    lastResult: fetcher.data?.intent === "resume" ? fetcher.data : undefined,
    constraint: getZodConstraint(handlers.resume.schema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: handlers.resume.schema });
    },
  });

  const [deleteForm, deleteFields] = useForm({
    id: "user-delete-form",
    lastResult: fetcher.data?.intent === "delete" ? fetcher.data : undefined,
    constraint: getZodConstraint(handlers.delete.schema),
    shouldValidate: "onSubmit",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: handlers.delete.schema });
    },
  });

  fetcher.register("suspend", {
    onSuccess: () => {
      setShowSuspendModal(false);
    },
    onHandlerError: ({ error: err }) => {
      console.error("Suspend failed:", err);
    },
  });

  fetcher.register("resume", {
    onSuccess: () => {
      setShowResumeModal(false);
    },
    onHandlerError: ({ error: err }) => {
      console.error("Resume failed:", err);
    },
  });

  fetcher.register("delete", {
    onSuccess: () => {
      navigate("/platform/users");
    },
    onHandlerError: ({ error: err }) => {
      console.error("Delete failed:", err);
    },
  });

  const isPendingSuspend = fetcher.isPending("suspend");
  const isPendingResume = fetcher.isPending("resume");
  const isPendingDelete = fetcher.isPending("delete");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text">{user.name}</h1>
        <Badge variant={statusBadgeVariant[user.status] ?? "default"}>
          {statusLabels[user.status] ?? user.status}
        </Badge>
      </div>

      {/* 基本情報 */}
      <Card>
        <CardBody>
          <h2 className="mb-4 text-lg font-semibold text-text">基本情報</h2>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-text-secondary">
                ユーザー名
              </dt>
              <dd className="mt-1 text-sm text-text">{user.name}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-text-secondary">
                メールアドレス
              </dt>
              <dd className="mt-1 text-sm text-text">{user.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-text-secondary">
                電話番号
              </dt>
              <dd className="mt-1 text-sm text-text">{user.phone || "-"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-text-secondary">
                登録日
              </dt>
              <dd className="mt-1 text-sm text-text">{user.createdAt}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-text-secondary">
                最終ログイン
              </dt>
              <dd className="mt-1 text-sm text-text">
                {user.lastLoginAt ?? "-"}
              </dd>
            </div>
          </dl>
        </CardBody>
      </Card>

      {/* 予約履歴 */}
      <Card>
        <CardBody>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text">予約履歴</h2>
            <p className="text-sm text-text-secondary">
              総予約数: {reservationStats.totalCount.toLocaleString()}件
            </p>
          </div>
          {reservationStats.recentReservations.length === 0 ? (
            <p className="text-sm text-text-muted">予約履歴がありません</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border">
                  <tr>
                    <th className="pb-2 font-medium text-text-secondary">
                      店舗
                    </th>
                    <th className="pb-2 font-medium text-text-secondary">
                      メニュー
                    </th>
                    <th className="pb-2 font-medium text-text-secondary">
                      日時
                    </th>
                    <th className="pb-2 font-medium text-text-secondary">
                      ステータス
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {reservationStats.recentReservations.map((reservation) => (
                    <tr key={reservation.id}>
                      <td className="py-2 text-text">
                        {reservation.tenantName}
                      </td>
                      <td className="py-2 text-text-secondary">
                        {reservation.menuName}
                      </td>
                      <td className="py-2 text-text-secondary">
                        {reservation.dateTime}
                      </td>
                      <td className="py-2">
                        <Badge>{reservation.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* アクション */}
      <div className="flex gap-3">
        {user.status === "active" ? (
          <Button variant="outline" onClick={() => setShowSuspendModal(true)}>
            アカウントを停止
          </Button>
        ) : (
          <Button variant="outline" onClick={() => setShowResumeModal(true)}>
            アカウントを再開
          </Button>
        )}
        <Button variant="destructive" onClick={() => setShowDeleteModal(true)}>
          アカウントを削除
        </Button>
      </div>

      {/* 停止モーダル */}
      <Modal
        open={showSuspendModal}
        onClose={() => setShowSuspendModal(false)}
        title="アカウントを停止"
      >
        <p className="mb-4 text-sm text-text-secondary">
          このユーザーを停止しますか？停止中はログインできなくなります。
        </p>
        <fetcher.Form method="post" {...getFormProps(suspendForm)}>
          <input type="hidden" name="intent" value="suspend" />
          <div className="mb-4">
            <FormField
              label="停止理由（任意）"
              htmlFor={suspendFields.reason.id}
            >
              <Input
                {...getInputProps(suspendFields.reason, { type: "text" })}
                placeholder="停止理由を入力"
              />
            </FormField>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowSuspendModal(false)}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={isPendingSuspend}>
              {isPendingSuspend ? "処理中..." : "停止する"}
            </Button>
          </div>
        </fetcher.Form>
      </Modal>

      {/* 再開モーダル */}
      <Modal
        open={showResumeModal}
        onClose={() => setShowResumeModal(false)}
        title="アカウントを再開"
      >
        <p className="mb-4 text-sm text-text-secondary">
          このユーザーを再開しますか？
        </p>
        <fetcher.Form method="post" {...getFormProps(resumeForm)}>
          <input type="hidden" name="intent" value="resume" />
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowResumeModal(false)}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={isPendingResume}>
              {isPendingResume ? "処理中..." : "再開する"}
            </Button>
          </div>
        </fetcher.Form>
      </Modal>

      {/* 削除モーダル */}
      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="アカウントを削除"
      >
        <p className="mb-4 text-sm text-text-secondary">
          この操作は取り消せません。確認のため「削除」と入力してください。
        </p>
        <fetcher.Form method="post" {...getFormProps(deleteForm)}>
          <input type="hidden" name="intent" value="delete" />
          <div className="mb-4">
            <FormField
              label="「削除」と入力"
              htmlFor={deleteFields.confirmText.id}
              error={deleteFields.confirmText.errors}
              required
            >
              <Input
                {...getInputProps(deleteFields.confirmText, { type: "text" })}
                placeholder="削除"
                error={deleteFields.confirmText.errors?.[0]}
              />
            </FormField>
          </div>
          {deleteForm.errors && (
            <p className="mb-4 text-xs text-destructive">{deleteForm.errors}</p>
          )}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isPendingDelete}
            >
              {isPendingDelete ? "削除中..." : "削除する"}
            </Button>
          </div>
        </fetcher.Form>
      </Modal>
    </div>
  );
}
