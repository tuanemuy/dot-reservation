import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { useState } from "react";
import { data, Link, useNavigate } from "react-router";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { listMembers } from "@/core/application/member/listMembers";
import { listMenus } from "@/core/application/menu/listMenus";
import { deleteTenant } from "@/core/application/tenant/deleteTenant";
import { getTenant } from "@/core/application/tenant/getTenant";
import { reactivateTenant } from "@/core/application/tenant/reactivateTenant";
import { suspendTenant } from "@/core/application/tenant/suspendTenant";
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
    handler: async (_value, args) => {
      const tenantId = args.params.tenantId as string;
      return handleUseCase(() =>
        suspendTenant({
          container,
          headers: args.request.headers,
          input: { tenantId },
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
      const tenantId = args.params.tenantId as string;
      return handleUseCase(() =>
        reactivateTenant({
          container,
          headers: args.request.headers,
          input: { tenantId },
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
      const tenantId = args.params.tenantId as string;

      const tenantResult = await handleUseCase(() =>
        getTenant({
          container,
          headers: args.request.headers,
          input: { tenantId },
        }),
      );

      if (tenantResult.isErr()) {
        return error({ "": [tenantResult.error.message] });
      }

      if (value.confirmName !== tenantResult.value.name) {
        return error({ confirmName: ["テナント名が一致しません"] });
      }

      return handleUseCase(() =>
        deleteTenant({
          container,
          headers: args.request.headers,
          input: { tenantId },
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
  const tenantResult = await handleUseCase(() =>
    getTenant({
      container,
      headers: request.headers,
      input: { tenantId: params.tenantId },
    }),
  ).match(
    (result) => result,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  const membersResult = await handleUseCase(() =>
    listMembers({
      container,
      headers: request.headers,
      input: { tenantId: params.tenantId, role: null },
    }),
  ).match(
    (result) => result,
    () => ({
      items: [] as {
        id: string;
        name: string;
        email: string;
        role: string;
        joinedAt: string;
      }[],
    }),
  );

  const tenantId = TenantId.create(params.tenantId);

  const [menusResult, totalReservations, monthlyReservations] =
    await Promise.all([
      handleUseCase(() =>
        listMenus({
          container,
          headers: request.headers,
          input: { tenantId: params.tenantId },
        }),
      ).match(
        (result) => result,
        () => ({ items: [] as { id: string }[] }),
      ),
      container.reservationRepository.countByTenantId(tenantId),
      container.reservationRepository.countByTenantIdAndMonth(
        tenantId,
        new Date().getFullYear(),
        new Date().getMonth() + 1,
      ),
    ]);

  const address = [
    tenantResult.address.prefecture,
    tenantResult.address.city,
    tenantResult.address.street,
  ]
    .filter(Boolean)
    .join("");

  return {
    tenant: {
      id: tenantResult.id,
      name: tenantResult.name,
      category: tenantResult.category,
      urlPath: tenantResult.urlPath,
      address,
      phone: tenantResult.phoneNumber,
      status: tenantResult.status as "active" | "suspended",
      createdAt: tenantResult.createdAt.toLocaleDateString("ja-JP"),
    },
    members: membersResult.items.map((m) => ({
      id: m.id,
      name: m.name,
      role: m.role,
      joinedAt: m.joinedAt,
    })),
    stats: {
      menuCount: menusResult.items.length,
      totalReservations,
      monthlyReservations,
    },
  };
}

const statusLabels: Record<string, string> = {
  active: "アクティブ",
  suspended: "停止中",
};

const roleLabels: Record<string, string> = {
  owner: "オーナー",
  admin: "管理者",
  member: "メンバー",
};

export default function PlatformTenantDetailPage({
  loaderData,
}: Route.ComponentProps) {
  const { tenant, members, stats } = loaderData;
  const fetcher = useCompositeAction<typeof handlers>();
  const navigate = useNavigate();
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
  });

  fetcher.register("resume", {
    onSuccess: () => {
      setShowResumeModal(false);
    },
  });

  fetcher.register("delete", {
    onSuccess: () => {
      navigate("/platform/tenants");
    },
  });

  const isPendingSuspend = fetcher.isPending("suspend");
  const isPendingResume = fetcher.isPending("resume");
  const isPendingDelete = fetcher.isPending("delete");

  const isActive = tenant.status === "active";

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
          to="/platform/tenants"
          className="no-underline"
          style={{
            color: "var(--color-neutral-500)",
            transition: "color var(--transition-default)",
          }}
        >
          テナント管理
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
          {tenant.name}
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
          {tenant.name}
        </h1>
        <StatusBadge status={tenant.status} />
      </div>

      {/* Basic Info */}
      <SectionCard title="基本情報">
        <div
          className="grid"
          style={{
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "0",
            padding: "0 var(--space-lg) var(--space-lg)",
          }}
        >
          <InfoItem
            label="テナント名"
            value={tenant.name}
            position="odd"
            isLastRow={false}
          />
          <InfoItem
            label="カテゴリー"
            value={tenant.category}
            position="even"
            isLastRow={false}
          />
          <InfoItem
            label="URL"
            value={tenant.urlPath}
            position="odd"
            isLastRow={false}
            isLink
          />
          <InfoItem
            label="住所"
            value={tenant.address || "-"}
            position="even"
            isLastRow={false}
          />
          <InfoItem
            label="電話番号"
            value={tenant.phone || "-"}
            position="odd"
            isLastRow={false}
          />
          <InfoItem
            label="ステータス"
            value={statusLabels[tenant.status] ?? tenant.status}
            position="even"
            isLastRow={false}
          />
          <InfoItem
            label="登録日"
            value={tenant.createdAt}
            position="odd"
            isLastRow
          />
          <InfoItem label="" value="" position="even" isLastRow />
        </div>
      </SectionCard>

      {/* Members */}
      <SectionCard title="メンバー一覧">
        {members.length === 0 ? (
          <p
            style={{
              padding: "0 var(--space-lg) var(--space-lg)",
              fontSize: "var(--text-sm)",
              color: "var(--color-neutral-500)",
            }}
          >
            メンバーがいません
          </p>
        ) : (
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["名前", "役割", "参加日"].map((header) => (
                  <th
                    key={header}
                    className="text-left"
                    style={{
                      padding: "var(--space-sm) var(--space-lg)",
                      fontSize: "var(--text-xs)",
                      fontWeight: 500,
                      color: "var(--color-neutral-500)",
                      letterSpacing: "var(--tracking-wide)",
                      borderBottom: "1px solid var(--color-neutral-300)",
                      background: "var(--color-neutral-50)",
                    }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map((member, index) => (
                <tr
                  key={member.id}
                  style={{
                    transition: "background var(--transition-default)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "var(--color-neutral-50)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <td
                    style={{
                      padding: "var(--space-sm) var(--space-lg)",
                      fontSize: "var(--text-sm)",
                      color: "var(--color-neutral-700)",
                      borderBottom:
                        index < members.length - 1
                          ? "1px solid var(--color-neutral-200)"
                          : "none",
                    }}
                  >
                    {member.name}
                  </td>
                  <td
                    style={{
                      padding: "var(--space-sm) var(--space-lg)",
                      fontSize: "var(--text-sm)",
                      borderBottom:
                        index < members.length - 1
                          ? "1px solid var(--color-neutral-200)"
                          : "none",
                    }}
                  >
                    <RoleBadge role={member.role} />
                  </td>
                  <td
                    style={{
                      padding: "var(--space-sm) var(--space-lg)",
                      fontSize: "var(--text-sm)",
                      color: "var(--color-neutral-700)",
                      borderBottom:
                        index < members.length - 1
                          ? "1px solid var(--color-neutral-200)"
                          : "none",
                    }}
                  >
                    {member.joinedAt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionCard>

      {/* Statistics */}
      <SectionCard title="統計情報">
        <div
          className="grid"
          style={{
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "var(--space-md)",
            padding: "0 var(--space-lg) var(--space-lg)",
          }}
        >
          <StatItem
            value={stats.menuCount.toLocaleString()}
            label="メニュー数"
          />
          <StatItem
            value={stats.totalReservations.toLocaleString()}
            label="総予約数"
          />
          <StatItem
            value={stats.monthlyReservations.toLocaleString()}
            label="今月の予約"
          />
        </div>
      </SectionCard>

      {/* Actions */}
      <div className="flex" style={{ gap: "var(--space-md)" }}>
        {isActive ? (
          <ActionButton
            variant="warning"
            onClick={() => setShowSuspendModal(true)}
          >
            テナントを停止する
          </ActionButton>
        ) : (
          <ActionButton
            variant="warning"
            onClick={() => setShowResumeModal(true)}
          >
            テナントを再開する
          </ActionButton>
        )}
        <ActionButton variant="error" onClick={() => setShowDeleteModal(true)}>
          テナントを削除する
        </ActionButton>
      </div>

      {/* Suspend Modal */}
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

      {/* Resume Modal */}
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

      {/* Delete Modal */}
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
  isLink,
}: {
  label: string;
  value: string;
  position: "odd" | "even";
  isLastRow: boolean;
  isLink?: boolean;
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
          color: isLink ? "var(--color-primary)" : "var(--color-neutral-800)",
          fontWeight: 400,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div
      className="text-center"
      style={{
        padding: "var(--space-lg)",
        background: "var(--color-neutral-50)",
        borderRadius: "var(--radius-md)",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "var(--text-2xl)",
          fontWeight: 600,
          color: "var(--color-neutral-900)",
          letterSpacing: "var(--tracking-tight)",
          lineHeight: "var(--leading-tight)",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: "var(--text-xs)",
          color: "var(--color-neutral-500)",
          marginTop: "var(--space-xs)",
        }}
      >
        {label}
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

function RoleBadge({ role }: { role: string }) {
  const isOwner = role === "owner" || role === "admin";
  return (
    <span
      className="inline-flex items-center"
      style={{
        padding: "2px 8px",
        borderRadius: "var(--radius-full)",
        fontSize: "var(--text-xs)",
        fontWeight: 500,
        background: isOwner
          ? "var(--color-accent-lighter)"
          : "var(--color-neutral-200)",
        color: isOwner
          ? "var(--color-accent-dark)"
          : "var(--color-neutral-600)",
      }}
    >
      {roleLabels[role] ?? role}
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
  const hoverBg = isWarning
    ? "oklch(0.72 0.14 70 / 0.08)"
    : "oklch(0.55 0.16 25 / 0.06)";

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex cursor-pointer items-center justify-center"
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
        transition:
          "background var(--transition-default), color var(--transition-default), transform var(--transition-fast)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = hoverBg;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--color-bg-page)";
      }}
    >
      {children}
    </button>
  );
}
