import { getFormProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { useState } from "react";
import { data, Link } from "react-router";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cancelReservation } from "@/core/application/reservation/cancelReservation";
import { getReservation } from "@/core/application/reservation/getReservation";
import { getTenant } from "@/core/application/tenant/getTenant";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
  useCompositeAction,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/index";

const cancelReasonSchema = z.object({
  reservationId: z.string().min(1),
  reason: z.string().optional(),
});

const handlers = {
  cancelReservation: defineHandler({
    schema: cancelReasonSchema,
    handler: async (value, args) => {
      const { container } = await import("@/core/di/server");

      return handleUseCase(() =>
        cancelReservation({
          container,
          headers: args.request.headers,
          input: {
            reservationId: value.reservationId,
            reason: value.reason ?? null,
            cancelledBy: "customer",
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
  const reservationId = params.id;

  const reservation = await handleUseCase(() =>
    getReservation({
      container,
      headers: request.headers,
      input: { reservationId },
    }),
  ).match(
    (r) => r,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  const tenantResult = await handleUseCase(() =>
    getTenant({
      container,
      headers: request.headers,
      input: { tenantId: reservation.tenantId },
    }),
  ).match(
    (r) => r,
    () => null,
  );

  const now = new Date();
  let canModify = false;
  let canCancel = false;

  if (
    tenantResult &&
    (reservation.status === "confirmed" || reservation.status === "pending")
  ) {
    const reservationDateTime = new Date(reservation.date);
    const [hours, minutes] = reservation.startTime.split(":").map(Number);
    reservationDateTime.setHours(hours, minutes, 0, 0);
    const deadlineMs =
      tenantResult.reservationSettings.cancellationDeadlineHours *
      60 *
      60 *
      1000;
    const deadline = new Date(reservationDateTime.getTime() - deadlineMs);
    canModify = now <= deadline;
    canCancel = now <= deadline;
  }

  return {
    reservation: {
      ...reservation,
      canModify,
      canCancel,
      tenantName: tenantResult?.name ?? null,
      tenantUrlPath: tenantResult?.urlPath ?? null,
    },
  };
}

function formatReservationDateTime(
  dateStr: string,
  startTime: string,
  endTime: string,
): string {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  return `${year}年${month}月${day}日（${dayOfWeek}） ${startTime} - ${endTime}`;
}

export default function ReservationDetailPage({
  loaderData,
}: Route.ComponentProps) {
  const { reservation } = loaderData;
  const fetcher = useCompositeAction<typeof handlers>();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const [cancelForm] = useForm({
    id: "cancel-form",
    lastResult:
      fetcher.data?.intent === "cancelReservation" ? fetcher.data : undefined,
    constraint: getZodConstraint(handlers.cancelReservation.schema),
    shouldValidate: "onSubmit",
    onValidate({ formData }) {
      return parseWithZod(formData, {
        schema: handlers.cancelReservation.schema,
      });
    },
  });

  fetcher.register("cancelReservation", {
    onSuccess: () => {
      setShowCancelDialog(false);
    },
  });

  const isCancelling = fetcher.isPending("cancelReservation");

  type DetailRow = {
    label: string;
    value: string | null;
    isPrice?: boolean;
    isLink?: boolean;
    linkHref?: string;
    isNote?: boolean;
  };

  const detailRows: DetailRow[] = [
    {
      label: "店舗名",
      value: reservation.tenantName,
      isLink: !!reservation.tenantUrlPath,
      linkHref: reservation.tenantUrlPath
        ? `/shop/${reservation.tenantUrlPath}`
        : undefined,
    },
    { label: "メニュー名", value: reservation.menuName },
    { label: "所要時間", value: `${reservation.menuDuration}分` },
    {
      label: "料金",
      value: `\u00a5${reservation.menuPrice.toLocaleString()}`,
      isPrice: true,
    },
    { label: "担当スタッフ", value: reservation.staffName ?? "指名なし" },
    {
      label: "予約日時",
      value: formatReservationDateTime(
        reservation.date,
        reservation.startTime,
        reservation.endTime,
      ),
    },
    { label: "備考", value: reservation.note, isNote: true },
    { label: "キャンセル理由", value: reservation.cancellationReason },
    { label: "却下理由", value: reservation.rejectionReason },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center gap-4 mb-8">
        <h1 className="font-heading text-2xl font-semibold text-neutral-900 tracking-tight leading-tight">
          予約詳細
        </h1>
        <StatusBadge status={reservation.status} variant="reservation" />
      </div>

      {/* Detail Card */}
      <div className="bg-white border border-neutral-300 rounded-lg p-8 mb-6">
        <h2 className="font-heading text-lg font-semibold text-neutral-800 tracking-tight mb-6 pb-2 border-b border-neutral-200">
          予約情報
        </h2>
        <div className="flex flex-col gap-4">
          {detailRows
            .filter((row) => row.value !== null)
            .map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-[160px_1fr] gap-4 items-baseline"
              >
                <div className="text-sm font-medium text-neutral-500 tracking-wide">
                  {row.label}
                </div>
                <div>
                  {row.isLink && row.linkHref ? (
                    <Link
                      to={row.linkHref}
                      className="text-primary font-medium text-base no-underline"
                    >
                      {row.value}
                    </Link>
                  ) : row.isPrice ? (
                    <span className="text-lg font-semibold text-accent-dark">
                      {row.value}{" "}
                      <span className="text-xs font-normal text-neutral-500">
                        (税込)
                      </span>
                    </span>
                  ) : row.isNote ? (
                    <div className="text-sm text-neutral-600 leading-relaxed bg-neutral-100 p-4 rounded-md">
                      {row.value}
                    </div>
                  ) : (
                    <span className="text-base text-neutral-800">
                      {row.value}
                    </span>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Action Buttons */}
      {(reservation.canModify ||
        reservation.canCancel ||
        reservation.status === "completed") && (
        <div className="flex gap-4 mt-8">
          {reservation.canModify && (
            <Link
              to={`/mypage/reservations/${reservation.id}/edit`}
              className="inline-flex items-center justify-center gap-2 h-[44px] px-6 rounded-md text-base font-medium text-neutral-700 border border-neutral-300 bg-white no-underline transition-[background,border-color] duration-150 hover:border-neutral-400 hover:bg-neutral-100"
            >
              <svg
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="size-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
                />
              </svg>
              予約を変更する
            </Link>
          )}
          {reservation.canCancel && (
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 h-[44px] px-6 rounded-md text-base font-medium text-error border border-error bg-white cursor-pointer font-[inherit] transition-[background] duration-150 hover:bg-[var(--color-error-bg)]"
              onClick={() => setShowCancelDialog(true)}
            >
              <svg
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="size-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              予約をキャンセルする
            </button>
          )}
          {reservation.status === "completed" && reservation.tenantUrlPath && (
            <Link
              to={`/shop/${reservation.tenantUrlPath}/reserve`}
              className="inline-flex items-center justify-center gap-2 h-[44px] px-6 bg-white border border-neutral-300 rounded-md text-base font-medium text-neutral-700 no-underline duration-150"
            >
              再予約する
            </Link>
          )}
        </div>
      )}

      {/* Cancel Modal */}
      <Modal
        open={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        title="予約をキャンセルしますか？"
      >
        <fetcher.Form method="post" {...getFormProps(cancelForm)}>
          <input type="hidden" name="intent" value="cancelReservation" />
          <input type="hidden" name="reservationId" value={reservation.id} />
          <div className="mb-6">
            <label
              htmlFor="cancel-reason"
              className="block text-sm font-medium text-neutral-700 mb-2"
            >
              キャンセル理由（任意）
            </label>
            <Select id="cancel-reason" name="reason">
              <option value="">選択してください</option>
              <option value="schedule_change">予定が変わった</option>
              <option value="found_other">他の店舗に変更</option>
              <option value="feeling_unwell">体調不良</option>
              <option value="other">その他</option>
            </Select>
          </div>
          {cancelForm.errors && (
            <p className="text-sm text-error mb-4">{cancelForm.errors}</p>
          )}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => setShowCancelDialog(false)}
              className="inline-flex items-center justify-center h-[44px] px-6 bg-white border border-neutral-300 rounded-md text-base font-medium text-neutral-700 cursor-pointer font-[inherit]"
            >
              戻る
            </button>
            <button
              type="submit"
              disabled={isCancelling}
              className={`inline-flex items-center justify-center h-[44px] px-6 bg-error border-none rounded-md text-base font-medium text-white font-[inherit] ${isCancelling ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
            >
              {isCancelling ? "キャンセル中..." : "キャンセルする"}
            </button>
          </div>
        </fetcher.Form>
      </Modal>
    </div>
  );
}
