import { getFormProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { useState } from "react";
import { data, Link, useParams } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { cancelReservation } from "@/core/application/reservation/cancelReservation";
import { getReservation } from "@/core/application/reservation/getReservation";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
  useCompositeAction,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/$reservationId";

const statusLabels: Record<string, string> = {
  confirmed: "確定",
  pending: "承認待ち",
  cancelled: "キャンセル",
  completed: "完了",
  rejected: "却下",
};

function StatusBadge({ status }: { status: string }) {
  const statusStyles: Record<string, string> = {
    confirmed: "bg-[oklch(0.55_0.12_145/0.1)] text-success",
    pending: "bg-[oklch(0.72_0.14_70/0.12)] text-accent-dark",
    cancelled: "bg-[oklch(0.55_0.16_25/0.1)] text-error",
    completed: "bg-surface-secondary text-text-secondary",
    rejected: "bg-[oklch(0.55_0.16_25/0.1)] text-error",
  };

  const dotStyles: Record<string, string> = {
    confirmed: "bg-success",
    pending: "bg-warning",
    cancelled: "bg-error",
    completed: "bg-text-muted",
    rejected: "bg-error",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${statusStyles[status] ?? "bg-surface-secondary text-text-secondary"}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${dotStyles[status] ?? "bg-text-muted"}`}
      />
      {statusLabels[status] ?? status}
    </span>
  );
}

const cancelSchema = z.object({
  reservationId: z.string().min(1),
  reason: z.string().optional(),
});

const handlers = {
  cancel: defineHandler({
    schema: cancelSchema,
    handler: async (value, args) => {
      const { container } = await import("@/core/di/server");

      return handleUseCase(() =>
        cancelReservation({
          container,
          headers: args.request.headers,
          input: {
            reservationId: value.reservationId,
            reason: value.reason ?? null,
            cancelledBy: "staff",
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

export async function loader({ params, request }: Route.LoaderArgs) {
  const { container } = await import("@/core/di/server");

  const reservationResult = await handleUseCase(() =>
    getReservation({
      container,
      headers: request.headers,
      input: { reservationId: params.reservationId },
    }),
  ).match(
    (result) => result,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  return {
    reservation: reservationResult,
  };
}

export default function StaffReservationDetailPage({
  loaderData,
}: Route.ComponentProps) {
  const { reservation } = loaderData;
  const { tenantId } = useParams();
  const fetcher = useCompositeAction<typeof handlers>();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const canModify =
    reservation.status === "confirmed" || reservation.status === "pending";

  const [cancelForm] = useForm({
    id: "cancel-form",
    lastResult: fetcher.data?.intent === "cancel" ? fetcher.data : undefined,
    constraint: getZodConstraint(handlers.cancel.schema),
    shouldValidate: "onSubmit",
    onValidate({ formData }) {
      return parseWithZod(formData, {
        schema: handlers.cancel.schema,
      });
    },
  });

  fetcher.register("cancel", {
    onSuccess: () => {
      setShowCancelDialog(false);
      toast.success("予約をキャンセルしました");
    },
    onHandlerError: ({ error: err }) => {
      toast.error(err?.[""]?.[0] ?? "キャンセルに失敗しました");
    },
  });

  const isCancelling = fetcher.isPending("cancel");

  const detailRows: {
    label: string;
    value: string | null;
    isPrice?: boolean;
  }[] = [
    { label: "顧客名", value: reservation.customerName },
    { label: "電話番号", value: reservation.customerPhoneNumber },
    { label: "メニュー", value: reservation.menuName },
    { label: "所要時間", value: `${reservation.menuDuration}分` },
    {
      label: "料金",
      value: `${reservation.menuPrice.toLocaleString()}円`,
      isPrice: true,
    },
    {
      label: "予約日時",
      value: `${reservation.date} ${reservation.startTime} - ${reservation.endTime}`,
    },
    { label: "備考", value: reservation.note },
  ];

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm">
        <Link
          to={`/staff/${tenantId}/reservations`}
          className="font-medium text-text-muted no-underline transition-colors duration-150 hover:text-primary"
        >
          予約管理
        </Link>
        <span className="text-text-muted">/</span>
        <span className="font-medium text-text">予約詳細</span>
      </nav>

      {/* Page Header */}
      <div className="mb-8 flex items-center gap-4">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-neutral-900">
          予約詳細
        </h1>
        <StatusBadge status={reservation.status} />
      </div>

      {/* Detail Card */}
      <div className="mb-8 max-w-[720px] rounded-[14px] border border-border bg-white p-8">
        <h2 className="mb-6 border-b border-surface-secondary pb-2 font-heading text-lg font-semibold tracking-tight text-text">
          予約情報
        </h2>

        <div className="grid grid-cols-[120px_1fr] gap-x-8 gap-y-4">
          {detailRows
            .filter((row) => row.value !== null)
            .map((row) => (
              <div key={row.label} className="contents">
                <span className="text-sm font-medium text-text-muted">
                  {row.label}
                </span>
                <span
                  className={`text-base font-medium ${row.isPrice ? "font-semibold text-accent-dark" : "text-text"}`}
                >
                  {row.value}
                </span>
              </div>
            ))}
        </div>

        {/* Email privacy note */}
        <div className="mt-6 flex items-center gap-2 border-t border-surface-secondary pt-4">
          <svg
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
            className="h-4 w-4 shrink-0 text-info"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
            />
          </svg>
          <span className="text-sm text-text-muted">
            メールアドレスはプライバシー保護のため非表示です
          </span>
        </div>
      </div>

      {/* Actions */}
      {canModify && (
        <div className="flex gap-4">
          <Link
            to={`/staff/${tenantId}/reservations/${reservation.id}/edit`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border-none bg-primary px-8 text-sm font-medium tracking-wide text-white no-underline transition-colors duration-150 hover:bg-primary-dark active:scale-[0.99]"
          >
            <svg
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
              />
            </svg>
            予約を変更する
          </Link>
          <button
            type="button"
            onClick={() => setShowCancelDialog(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border border-error bg-white px-8 text-sm font-medium tracking-wide text-error transition-colors duration-150 hover:bg-error hover:text-white active:scale-[0.99]"
          >
            <svg
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            キャンセルする
          </button>
        </div>
      )}

      {/* Cancel Modal */}
      <Modal
        open={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        title="この予約をキャンセルしますか？"
      >
        <div className="mb-4">
          <p className="text-sm text-text-secondary">
            {reservation.customerName} - {reservation.menuName}
          </p>
          <p className="text-sm text-text-secondary">
            {reservation.date} {reservation.startTime} - {reservation.endTime}
          </p>
        </div>

        <fetcher.Form method="post" {...getFormProps(cancelForm)}>
          <input type="hidden" name="intent" value="cancel" />
          <input type="hidden" name="reservationId" value={reservation.id} />
          <div className="mb-4">
            <label
              htmlFor="cancel-reason"
              className="mb-2 block text-sm font-medium text-text"
            >
              キャンセル理由（任意）
            </label>
            <textarea
              id="cancel-reason"
              name="reason"
              rows={3}
              placeholder="キャンセル理由を入力してください"
              className="w-full resize-y rounded-[10px] border border-border bg-white p-4 font-body text-base text-text transition-colors duration-150 placeholder:text-text-muted hover:border-neutral-400 focus:border-primary focus:outline-2 focus:outline-primary"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowCancelDialog(false)}
              className="inline-flex h-11 items-center justify-center rounded-[10px] border border-border bg-white px-6 text-sm font-medium text-text transition-colors duration-150 hover:bg-surface-secondary"
            >
              戻る
            </button>
            <button
              type="submit"
              disabled={isCancelling}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border border-error bg-white px-6 text-sm font-medium text-error transition-colors duration-150 hover:bg-error hover:text-white disabled:opacity-60"
            >
              {isCancelling ? "キャンセル中..." : "キャンセルする"}
            </button>
          </div>
        </fetcher.Form>
      </Modal>
    </div>
  );
}
