import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { useState } from "react";
import { z } from "zod";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import {
  createCompositeAction,
  defineHandler,
  success,
  useCompositeAction,
} from "@/lib/compositeAction";
import type { Route } from "./+types/$tenantId";

const suspendSchema = z.object({
  reason: z.string().optional(),
});

const resumeSchema = z.object({});

const deleteSchema = z.object({
  confirmName: z.string().min(1, "テナント名を入力してください"),
});

const handlers = {
  suspend: defineHandler({
    schema: suspendSchema,
    handler: async (value, _args) => {
      // TODO: suspendTenant ユースケースを呼び出す
      // const tenantId = args.params.tenantId;
      // await handleUseCase(() =>
      //   suspendTenant({ container, headers: args.request.headers, input: { tenantId } }),
      // );
      console.log("Suspend tenant:", value);
      return success();
    },
  }),
  resume: defineHandler({
    schema: resumeSchema,
    handler: async (_value, _args) => {
      // TODO: reactivateTenant ユースケースを呼び出す
      console.log("Resume tenant");
      return success();
    },
  }),
  delete: defineHandler({
    schema: deleteSchema,
    handler: async (value, _args) => {
      // TODO: deleteTenant ユースケースを呼び出す
      // テナント名の一致確認は handler 内で行う
      console.log("Delete tenant:", value);
      return success();
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}

export async function loader({ params: _params }: Route.LoaderArgs) {
  // TODO: getTenant ユースケースを呼び出す
  // const result = await handleUseCase(() =>
  //   getTenant({ container, headers: request.headers, input: { tenantId: params.tenantId } }),
  // );
  // TODO: listMembers ユースケースを呼び出す
  return {
    tenant: {
      id: "",
      name: "",
      category: "",
      urlPath: "",
      address: "",
      phone: "",
      status: "" as "active" | "suspended",
      createdAt: "",
    },
    members: [] as {
      id: string;
      name: string;
      email: string;
      role: string;
    }[],
    stats: {
      menuCount: 0,
      totalReservations: 0,
      monthlyReservations: 0,
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

export default function PlatformTenantDetailPage({
  loaderData,
}: Route.ComponentProps) {
  const { tenant, members, stats } = loaderData;
  const fetcher = useCompositeAction<typeof handlers>();
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [suspendForm, suspendFields] = useForm({
    id: "suspend-form",
    lastResult: fetcher.data?.intent === "suspend" ? fetcher.data : undefined,
    constraint: getZodConstraint(handlers.suspend.schema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: handlers.suspend.schema });
    },
  });

  const [resumeForm] = useForm({
    id: "resume-form",
    lastResult: fetcher.data?.intent === "resume" ? fetcher.data : undefined,
    constraint: getZodConstraint(handlers.resume.schema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: handlers.resume.schema });
    },
  });

  const [deleteForm, deleteFields] = useForm({
    id: "delete-form",
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
      // TODO: テナント一覧ページへリダイレクト
      console.log("Tenant deleted");
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
        <h1 className="text-2xl font-bold text-text">{tenant.name}</h1>
        <Badge variant={statusBadgeVariant[tenant.status] ?? "default"}>
          {statusLabels[tenant.status] ?? tenant.status}
        </Badge>
      </div>

      {/* 基本情報 */}
      <Card>
        <CardBody>
          <h2 className="mb-4 text-lg font-semibold text-text">基本情報</h2>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-text-secondary">
                テナント名
              </dt>
              <dd className="mt-1 text-sm text-text">{tenant.name}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-text-secondary">
                カテゴリー
              </dt>
              <dd className="mt-1 text-sm text-text">{tenant.category}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-text-secondary">
                URLパス
              </dt>
              <dd className="mt-1 text-sm text-text">{tenant.urlPath}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-text-secondary">住所</dt>
              <dd className="mt-1 text-sm text-text">{tenant.address}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-text-secondary">
                電話番号
              </dt>
              <dd className="mt-1 text-sm text-text">{tenant.phone}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-text-secondary">
                登録日
              </dt>
              <dd className="mt-1 text-sm text-text">{tenant.createdAt}</dd>
            </div>
          </dl>
        </CardBody>
      </Card>

      {/* 統計情報 */}
      <Card>
        <CardBody>
          <h2 className="mb-4 text-lg font-semibold text-text">統計情報</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium text-text-secondary">
                メニュー数
              </p>
              <p className="mt-1 text-lg font-bold text-text">
                {stats.menuCount}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-text-secondary">
                総予約数
              </p>
              <p className="mt-1 text-lg font-bold text-text">
                {stats.totalReservations.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-text-secondary">
                今月の予約数
              </p>
              <p className="mt-1 text-lg font-bold text-text">
                {stats.monthlyReservations.toLocaleString()}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* メンバー一覧 */}
      <Card>
        <CardBody>
          <h2 className="mb-4 text-lg font-semibold text-text">メンバー一覧</h2>
          {members.length === 0 ? (
            <p className="text-sm text-text-muted">メンバーがいません</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border">
                  <tr>
                    <th className="pb-2 font-medium text-text-secondary">
                      名前
                    </th>
                    <th className="pb-2 font-medium text-text-secondary">
                      メールアドレス
                    </th>
                    <th className="pb-2 font-medium text-text-secondary">
                      ロール
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {members.map((member) => (
                    <tr key={member.id}>
                      <td className="py-2 text-text">{member.name}</td>
                      <td className="py-2 text-text-secondary">
                        {member.email}
                      </td>
                      <td className="py-2">
                        <Badge>{member.role}</Badge>
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
        {tenant.status === "active" ? (
          <Button variant="outline" onClick={() => setShowSuspendModal(true)}>
            テナントを停止
          </Button>
        ) : (
          <Button variant="outline" onClick={() => setShowResumeModal(true)}>
            テナントを再開
          </Button>
        )}
        <Button variant="destructive" onClick={() => setShowDeleteModal(true)}>
          テナントを削除
        </Button>
      </div>

      {/* 停止モーダル */}
      <Modal
        open={showSuspendModal}
        onClose={() => setShowSuspendModal(false)}
        title="テナントを停止"
      >
        <p className="mb-4 text-sm text-text-secondary">
          このテナントを停止しますか？停止中はテナントの機能が利用できなくなります。
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
        title="テナントを再開"
      >
        <p className="mb-4 text-sm text-text-secondary">
          このテナントを再開しますか？
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
        title="テナントを削除"
      >
        <p className="mb-4 text-sm text-text-secondary">
          この操作は取り消せません。確認のためテナント名を入力してください。
        </p>
        <fetcher.Form method="post" {...getFormProps(deleteForm)}>
          <input type="hidden" name="intent" value="delete" />
          <div className="mb-4">
            <FormField
              label={`テナント名「${tenant.name}」を入力`}
              htmlFor={deleteFields.confirmName.id}
              error={deleteFields.confirmName.errors}
              required
            >
              <Input
                {...getInputProps(deleteFields.confirmName, { type: "text" })}
                placeholder={tenant.name}
                error={deleteFields.confirmName.errors?.[0]}
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
