import { useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { useState } from "react";
import { useNavigate } from "react-router";
import { statusLabels } from "@/components/platform/constants";
import { DeleteConfirmModal } from "@/components/platform/DeleteConfirmModal";
import { InfoGrid } from "@/components/platform/InfoGrid";
import { InfoItem } from "@/components/platform/InfoItem";
import { PageHeader } from "@/components/platform/PageHeader";
import { ReservationHistory } from "@/components/platform/ReservationHistory";
import { ResumeModal } from "@/components/platform/ResumeModal";
import { SectionCard } from "@/components/platform/SectionCard";
import { SuspendModal } from "@/components/platform/SuspendModal";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useCompositeAction } from "@/lib/compositeAction";
import type { Route } from "./+types/index";
import { handlers } from "./action";

export { action } from "./action";
export { loader } from "./loader";

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
      <div className="mb-6">
        <Breadcrumb
          items={[
            { label: "ユーザー管理", to: "/platform/users" },
            { label: user.name },
          ]}
        />
      </div>

      <PageHeader title={user.name}>
        <StatusBadge status={user.status} variant="customer" />
      </PageHeader>

      {/* User Info */}
      <SectionCard title="ユーザー情報">
        <InfoGrid>
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
        </InfoGrid>
      </SectionCard>

      {/* Reservation History */}
      <SectionCard title="予約履歴">
        <ReservationHistory
          totalCount={reservationStats.totalCount}
          recentReservations={reservationStats.recentReservations}
        />
      </SectionCard>

      {/* Actions */}
      <div className="flex gap-4">
        {isActive ? (
          <Button
            variant="warning-outline"
            onClick={() => setShowSuspendModal(true)}
          >
            アカウントを停止する
          </Button>
        ) : (
          <Button
            variant="warning-outline"
            onClick={() => setShowResumeModal(true)}
          >
            アカウントを再開する
          </Button>
        )}
        <Button
          variant="error-outline"
          onClick={() => setShowDeleteModal(true)}
        >
          アカウントを削除する
        </Button>
      </div>

      <SuspendModal
        open={showSuspendModal}
        onClose={() => setShowSuspendModal(false)}
        title="アカウントを停止"
        description="このユーザーを停止しますか？停止中はログインできなくなります。"
        form={suspendForm}
        reasonField={suspendFields.reason}
        isPending={isPendingSuspend}
        Form={fetcher.Form}
      />

      <ResumeModal
        open={showResumeModal}
        onClose={() => setShowResumeModal(false)}
        title="アカウントを再開"
        description="このユーザーを再開しますか？"
        form={resumeForm}
        isPending={isPendingResume}
        Form={fetcher.Form}
      />

      <DeleteConfirmModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="アカウントを削除"
        description="この操作は取り消せません。確認のため「削除」と入力してください。"
        form={deleteForm}
        confirmField={deleteFields.confirmText}
        confirmLabel="「削除」と入力"
        confirmPlaceholder="削除"
        isPending={isPendingDelete}
        Form={fetcher.Form}
      />
    </div>
  );
}
