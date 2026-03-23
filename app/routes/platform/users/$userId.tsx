import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { useState } from "react";
import { data, Link, useNavigate } from "react-router";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { deleteCustomer } from "@/core/application/customer/deleteCustomer";
import { getCustomer } from "@/core/application/customer/getCustomer";
import { reactivateCustomer } from "@/core/application/customer/reactivateCustomer";
import { suspendCustomer } from "@/core/application/customer/suspendCustomer";
import { listReservations } from "@/core/application/reservation/listReservations";
import { container } from "@/core/di/server";
import { TenantId } from "@/core/domain/tenant/valueObject";
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
      const userId = args.params.userId as string;
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
      const userId = args.params.userId as string;
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
      const userId = args.params.userId as string;
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

  const reservationsResult = await handleUseCase(() =>
    listReservations({
      container,
      headers: request.headers,
      input: {
        customerId: customerResult.id,
        status: null,
        startDate: null,
        endDate: null,
        page: 1,
        limit: 10,
      },
    }),
  ).match(
    (result) => result,
    () => ({
      items: [] as {
        id: string;
        tenantId: string;
        menuName: string;
        date: string;
        startTime: string;
        status: string;
      }[],
      totalCount: 0,
    }),
  );

  const uniqueTenantIds = [
    ...new Set(reservationsResult.items.map((r) => r.tenantId)),
  ];
  const tenantNames = new Map<string, string>();
  await Promise.all(
    uniqueTenantIds.map(async (tid) => {
      const tenantId = TenantId.create(tid);
      const tenant = await container.unitOfWorkProvider.transaction(
        async (repositories) =>
          repositories.tenantRepository.findById(tenantId),
      );
      if (tenant) {
        tenantNames.set(tid, tenant.name);
      }
    }),
  );

  const recentReservations = reservationsResult.items.map((r) => ({
    id: r.id,
    tenantName: tenantNames.get(r.tenantId) ?? "",
    menuName: r.menuName,
    date: r.date,
    status: r.status,
  }));

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
      totalCount: reservationsResult.totalCount,
      recentReservations,
    },
  };
}

const statusLabels: Record<string, string> = {
  active: "アクティブ",
  suspended: "停止中",
};

const reservationStatusLabels: Record<string, string> = {
  confirmed: "確定",
  completed: "完了",
  cancelled: "キャンセル",
  pending: "承認待ち",
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
  });

  fetcher.register("resume", {
    onSuccess: () => {
      setShowResumeModal(false);
    },
  });

  fetcher.register("delete", {
    onSuccess: () => {
      navigate("/platform/users");
    },
  });

  const isPendingSuspend = fetcher.isPending("suspend");
  const isPendingResume = fetcher.isPending("resume");
  const isPendingDelete = fetcher.isPending("delete");

  const isActive = user.status === "active";

  return (
    <div>
      {/* Breadcrumb */}
      <nav
        className="flex items-center"
        style={{
          gap: "var(--space-sm)",
          marginBottom: "var(--space-lg)",
          fontSize: "var(--text-sm)",
        }}
      >
        <Link
          to="/platform/users"
          className="no-underline"
          style={{
            color: "var(--color-neutral-500)",
            transition: "color var(--transition-default)",
          }}
        >
          ユーザー管理
        </Link>
        <span
          style={{
            color: "var(--color-neutral-500)",
            fontSize: "var(--text-xs)",
          }}
        >
          /
        </span>
        <span
          style={{
            color: "var(--color-neutral-800)",
            fontWeight: 500,
          }}
        >
          {user.name}
        </span>
      </nav>

      {/* Page Header */}
      <div
        className="flex items-center"
        style={{ gap: "var(--space-md)", marginBottom: "var(--space-xl)" }}
      >
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "var(--text-2xl)",
            fontWeight: 600,
            color: "var(--color-neutral-900)",
            letterSpacing: "var(--tracking-tight)",
            lineHeight: "var(--leading-tight)",
          }}
        >
          {user.name}
        </h1>
        <StatusBadge status={user.status} />
      </div>

      {/* User Info */}
      <SectionCard title="ユーザー情報">
        <div
          className="grid"
          style={{
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "0",
            padding: "0 var(--space-lg) var(--space-lg)",
          }}
        >
          <InfoItem
            label="顧客名"
            value={user.name}
            position="odd"
            isLastRow={false}
          />
          <InfoItem
            label="メールアドレス"
            value={user.email}
            position="even"
            isLastRow={false}
          />
          <InfoItem
            label="電話番号"
            value={user.phone || "-"}
            position="odd"
            isLastRow={false}
          />
          <InfoItem
            label="ステータス"
            value={statusLabels[user.status] ?? user.status}
            position="even"
            isLastRow={false}
          />
          <InfoItem
            label="登録日"
            value={user.createdAt}
            position="odd"
            isLastRow
          />
          <InfoItem
            label="最終ログイン"
            value={user.lastLoginAt ?? "-"}
            position="even"
            isLastRow
          />
        </div>
      </SectionCard>

      {/* Reservation History */}
      <SectionCard title="予約履歴">
        <div
          style={{
            padding: "0 var(--space-lg)",
            marginBottom: "var(--space-md)",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "var(--text-xl)",
              fontWeight: 600,
              color: "var(--color-neutral-900)",
              letterSpacing: "var(--tracking-tight)",
            }}
          >
            {reservationStats.totalCount}
          </span>
          <span
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--color-neutral-500)",
              marginLeft: "var(--space-xs)",
            }}
          >
            総予約数
          </span>
        </div>
        <div style={{ padding: "0 var(--space-lg) var(--space-lg)" }}>
          {reservationStats.recentReservations.length === 0 ? (
            <p
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--color-neutral-500)",
              }}
            >
              予約履歴がありません
            </p>
          ) : (
            reservationStats.recentReservations.map((reservation, index) => (
              <div
                key={reservation.id}
                className="grid items-center"
                style={{
                  gridTemplateColumns: "120px 1fr 1fr 100px",
                  gap: "var(--space-md)",
                  padding: "var(--space-md) 0",
                  borderBottom:
                    index < reservationStats.recentReservations.length - 1
                      ? "1px solid var(--color-neutral-200)"
                      : "none",
                }}
              >
                <div
                  style={{
                    fontSize: "var(--text-sm)",
                    fontWeight: 500,
                    color: "var(--color-neutral-800)",
                  }}
                >
                  {reservation.date}
                </div>
                <div
                  style={{
                    fontSize: "var(--text-sm)",
                    color: "var(--color-neutral-700)",
                  }}
                >
                  {reservation.tenantName}
                </div>
                <div
                  style={{
                    fontSize: "var(--text-sm)",
                    color: "var(--color-neutral-600)",
                  }}
                >
                  {reservation.menuName}
                </div>
                <ReservationStatusBadge status={reservation.status} />
              </div>
            ))
          )}
        </div>
      </SectionCard>

      {/* Actions */}
      <div className="flex" style={{ gap: "var(--space-md)" }}>
        {isActive ? (
          <ActionButton
            variant="warning"
            onClick={() => setShowSuspendModal(true)}
          >
            アカウントを停止する
          </ActionButton>
        ) : (
          <ActionButton
            variant="warning"
            onClick={() => setShowResumeModal(true)}
          >
            アカウントを再開する
          </ActionButton>
        )}
        <ActionButton variant="error" onClick={() => setShowDeleteModal(true)}>
          アカウントを削除する
        </ActionButton>
      </div>

      {/* Suspend Modal */}
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

      {/* Resume Modal */}
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

      {/* Delete Modal */}
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

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-neutral-300)",
        borderRadius: "var(--radius-lg)",
        marginBottom: "var(--space-xl)",
      }}
    >
      <div
        className="flex items-center justify-between"
        style={{
          padding: "var(--space-lg) var(--space-lg) 0",
          marginBottom: "var(--space-md)",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "var(--text-lg)",
            fontWeight: 600,
            color: "var(--color-neutral-800)",
            letterSpacing: "var(--tracking-tight)",
          }}
        >
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

function InfoItem({
  label,
  value,
  position,
  isLastRow,
}: {
  label: string;
  value: string;
  position: "odd" | "even";
  isLastRow: boolean;
}) {
  return (
    <div
      style={{
        padding: "var(--space-md) 0",
        borderBottom: isLastRow ? "none" : "1px solid var(--color-neutral-200)",
        ...(position === "odd"
          ? { paddingRight: "var(--space-xl)" }
          : {
              paddingLeft: "var(--space-xl)",
              borderLeft: "1px solid var(--color-neutral-200)",
            }),
      }}
    >
      <div
        style={{
          fontSize: "var(--text-xs)",
          fontWeight: 500,
          color: "var(--color-neutral-500)",
          letterSpacing: "var(--tracking-wide)",
          marginBottom: "var(--space-xs)",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "var(--text-base)",
          color: "var(--color-neutral-800)",
          fontWeight: 400,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status === "active";
  return (
    <span
      className="inline-flex items-center whitespace-nowrap"
      style={{
        gap: "4px",
        padding: "4px 12px",
        borderRadius: "var(--radius-full)",
        fontSize: "var(--text-xs)",
        fontWeight: 500,
        background: isActive
          ? "oklch(0.55 0.12 145 / 0.1)"
          : "oklch(0.55 0.16 25 / 0.08)",
        color: isActive ? "var(--color-success)" : "var(--color-error)",
      }}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "var(--radius-full)",
          background: isActive ? "var(--color-success)" : "var(--color-error)",
        }}
      />
      {statusLabels[status] ?? status}
    </span>
  );
}

function ReservationStatusBadge({ status }: { status: string }) {
  const styleMap: Record<
    string,
    { bg: string; color: string; dotColor: string }
  > = {
    confirmed: {
      bg: "oklch(0.55 0.12 145 / 0.1)",
      color: "var(--color-success)",
      dotColor: "var(--color-success)",
    },
    completed: {
      bg: "var(--color-neutral-200)",
      color: "var(--color-neutral-600)",
      dotColor: "var(--color-neutral-500)",
    },
    cancelled: {
      bg: "oklch(0.55 0.16 25 / 0.08)",
      color: "var(--color-error)",
      dotColor: "var(--color-error)",
    },
    pending: {
      bg: "oklch(0.72 0.14 70 / 0.1)",
      color: "var(--color-warning)",
      dotColor: "var(--color-warning)",
    },
  };

  const s = styleMap[status] ?? styleMap.completed;

  return (
    <span
      className="inline-flex items-center whitespace-nowrap"
      style={{
        gap: "4px",
        padding: "4px 12px",
        borderRadius: "var(--radius-full)",
        fontSize: "var(--text-xs)",
        fontWeight: 500,
        background: s.bg,
        color: s.color,
      }}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "var(--radius-full)",
          background: s.dotColor,
        }}
      />
      {reservationStatusLabels[status] ?? status}
    </span>
  );
}

function ActionButton({
  variant,
  onClick,
  children,
}: {
  variant: "warning" | "error";
  onClick: () => void;
  children: React.ReactNode;
}) {
  const isWarning = variant === "warning";
  const color = isWarning ? "var(--color-warning)" : "var(--color-error)";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex cursor-pointer items-center justify-center ${isWarning ? "hover-action-warning" : "hover-action-error"}`}
      style={{
        gap: "var(--space-sm)",
        height: "44px",
        padding: "0 var(--space-lg)",
        background: "var(--color-bg-page)",
        color,
        border: `1px solid ${color}`,
        borderRadius: "var(--radius-md)",
        fontFamily: "var(--font-body)",
        fontSize: "var(--text-sm)",
        fontWeight: 500,
        letterSpacing: "var(--tracking-wide)",
      }}
    >
      {children}
    </button>
  );
}
