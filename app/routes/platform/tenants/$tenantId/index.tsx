import { useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { useState } from "react";
import { useNavigate } from "react-router";
import { statusLabels } from "@/components/platform/constants";
import { DeleteConfirmModal } from "@/components/platform/DeleteConfirmModal";
import { InfoGrid } from "@/components/platform/InfoGrid";
import { InfoItem } from "@/components/platform/InfoItem";
import { MemberTable } from "@/components/platform/MemberTable";
import { PageHeader } from "@/components/platform/PageHeader";
import { ResumeModal } from "@/components/platform/ResumeModal";
import { SectionCard } from "@/components/platform/SectionCard";
import { StatItem } from "@/components/platform/StatItem";
import { SuspendModal } from "@/components/platform/SuspendModal";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useCompositeAction } from "@/lib/compositeAction";
import type { Route } from "./+types/index";
import { handlers } from "./action";

export { action } from "./action";
export { loader } from "./loader";

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
      <div className="mb-6">
        <Breadcrumb
          items={[
            { label: "テナント管理", to: "/platform/tenants" },
            { label: tenant.name },
          ]}
        />
      </div>

      <PageHeader title={tenant.name}>
        <StatusBadge status={tenant.status} variant="tenant" />
      </PageHeader>

      {/* Basic Info */}
      <SectionCard title="基本情報">
        <InfoGrid>
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
          <div />
        </InfoGrid>
      </SectionCard>

      {/* Members */}
      <SectionCard title="メンバー一覧">
        <MemberTable members={members} />
      </SectionCard>

      {/* Statistics */}
      <SectionCard title="統計情報">
        <div className="grid grid-cols-3 gap-4 px-6 pb-6">
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
      <div className="flex gap-4">
        {isActive ? (
          <Button
            variant="warning-outline"
            onClick={() => setShowSuspendModal(true)}
          >
            テナントを停止する
          </Button>
        ) : (
          <Button
            variant="warning-outline"
            onClick={() => setShowResumeModal(true)}
          >
            テナントを再開する
          </Button>
        )}
        <Button
          variant="error-outline"
          onClick={() => setShowDeleteModal(true)}
        >
          テナントを削除する
        </Button>
      </div>

      <SuspendModal
        open={showSuspendModal}
        onClose={() => setShowSuspendModal(false)}
        title="テナントを停止"
        description="このテナントを停止しますか？停止中はテナントの機能が利用できなくなります。"
        form={suspendForm}
        reasonField={suspendFields.reason}
        isPending={isPendingSuspend}
        Form={fetcher.Form}
      />

      <ResumeModal
        open={showResumeModal}
        onClose={() => setShowResumeModal(false)}
        title="テナントを再開"
        description="このテナントを再開しますか？"
        form={resumeForm}
        isPending={isPendingResume}
        Form={fetcher.Form}
      />

      <DeleteConfirmModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="テナントを削除"
        description="この操作は取り消せません。確認のためテナント名を入力してください。"
        form={deleteForm}
        confirmField={deleteFields.confirmName}
        confirmLabel={`テナント名「${tenant.name}」を入力`}
        confirmPlaceholder={tenant.name}
        isPending={isPendingDelete}
        Form={fetcher.Form}
      />
    </div>
  );
}
