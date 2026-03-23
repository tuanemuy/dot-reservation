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
      <div
        className="flex items-center"
        style={{ gap: "var(--space-md)", marginBottom: "var(--space-xl)" }}
      >
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "var(--text-2xl)",
            fontWeight: "var(--weight-semibold)",
            color: "var(--color-neutral-900)",
            letterSpacing: "var(--tracking-tight)",
            lineHeight: "var(--leading-tight)",
          }}
        >
          予約詳細
        </h1>
        <StatusBadge status={reservation.status} variant="reservation" />
      </div>

      {/* Detail Card */}
      <div
        style={{
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-neutral-300)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--space-xl)",
          marginBottom: "var(--space-lg)",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "var(--text-lg)",
            fontWeight: "var(--weight-semibold)",
            color: "var(--color-neutral-800)",
            letterSpacing: "var(--tracking-tight)",
            marginBottom: "var(--space-lg)",
            paddingBottom: "var(--space-sm)",
            borderBottom: "1px solid var(--color-neutral-200)",
          }}
        >
          予約情報
        </h2>
        <div className="flex flex-col" style={{ gap: "var(--space-md)" }}>
          {detailRows
            .filter((row) => row.value !== null)
            .map((row) => (
              <div
                key={row.label}
                style={{
                  display: "grid",
                  gridTemplateColumns: "160px 1fr",
                  gap: "var(--space-md)",
                  alignItems: "baseline",
                }}
              >
                <div
                  style={{
                    fontSize: "var(--text-sm)",
                    fontWeight: "var(--weight-medium)",
                    color: "var(--color-neutral-500)",
                    letterSpacing: "var(--tracking-wide)",
                  }}
                >
                  {row.label}
                </div>
                <div>
                  {row.isLink && row.linkHref ? (
                    <Link
                      to={row.linkHref}
                      style={{
                        color: "var(--color-primary)",
                        textDecoration: "none",
                        fontWeight: "var(--weight-medium)",
                        fontSize: "var(--text-base)",
                      }}
                    >
                      {row.value}
                    </Link>
                  ) : row.isPrice ? (
                    <span
                      style={{
                        fontSize: "var(--text-lg)",
                        fontWeight: "var(--weight-semibold)",
                        color: "var(--color-accent-dark)",
                      }}
                    >
                      {row.value}{" "}
                      <span
                        style={{
                          fontSize: "var(--text-xs)",
                          fontWeight: "var(--weight-normal)",
                          color: "var(--color-neutral-500)",
                        }}
                      >
                        (税込)
                      </span>
                    </span>
                  ) : row.isNote ? (
                    <div
                      style={{
                        fontSize: "var(--text-sm)",
                        color: "var(--color-neutral-600)",
                        lineHeight: "var(--leading-relaxed)",
                        background: "var(--color-neutral-100)",
                        padding: "var(--space-md)",
                        borderRadius: "var(--radius-md)",
                      }}
                    >
                      {row.value}
                    </div>
                  ) : (
                    <span
                      style={{
                        fontSize: "var(--text-base)",
                        color: "var(--color-neutral-800)",
                      }}
                    >
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
        <div
          className="flex"
          style={{ gap: "var(--space-md)", marginTop: "var(--space-xl)" }}
        >
          {reservation.canModify && (
            <Link
              to={`/mypage/reservations/${reservation.id}/edit`}
              className="inline-flex items-center justify-center border border-neutral-300 bg-[var(--color-bg-card)] no-underline transition-[background,border-color] duration-[0.15s] ease-[ease] hover:border-neutral-400 hover:bg-neutral-100"
              style={{
                gap: "var(--space-sm)",
                height: "44px",
                padding: "0 var(--space-lg)",
                borderRadius: "var(--radius-md)",
                fontSize: "var(--text-base)",
                fontWeight: "var(--weight-medium)",
                color: "var(--color-neutral-700)",
              }}
            >
              <svg
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
                aria-hidden="true"
                style={{ width: "16px", height: "16px" }}
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
              className="inline-flex items-center justify-center border border-error bg-[var(--color-bg-card)] transition-[background] duration-[0.15s] ease-[ease] hover:bg-[var(--color-error-bg)]"
              onClick={() => setShowCancelDialog(true)}
              style={{
                gap: "var(--space-sm)",
                height: "44px",
                padding: "0 var(--space-lg)",
                borderRadius: "var(--radius-md)",
                fontSize: "var(--text-base)",
                fontWeight: "var(--weight-medium)",
                color: "var(--color-error)",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <svg
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
                aria-hidden="true"
                style={{ width: "16px", height: "16px" }}
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
              className="inline-flex items-center justify-center"
              style={{
                gap: "var(--space-sm)",
                height: "44px",
                padding: "0 var(--space-lg)",
                background: "var(--color-bg-card)",
                border: "1px solid var(--color-neutral-300)",
                borderRadius: "var(--radius-md)",
                fontSize: "var(--text-base)",
                fontWeight: "var(--weight-medium)",
                color: "var(--color-neutral-700)",
                textDecoration: "none",
                transition:
                  "background var(--transition-default), border-color var(--transition-default)",
              }}
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
          <div style={{ marginBottom: "var(--space-lg)" }}>
            <label
              htmlFor="cancel-reason"
              className="block"
              style={{
                fontSize: "var(--text-sm)",
                fontWeight: "var(--weight-medium)",
                color: "var(--color-neutral-700)",
                marginBottom: "var(--space-sm)",
              }}
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
            <p
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--color-error)",
                marginBottom: "var(--space-md)",
              }}
            >
              {cancelForm.errors}
            </p>
          )}
          <div className="flex justify-end" style={{ gap: "var(--space-md)" }}>
            <button
              type="button"
              onClick={() => setShowCancelDialog(false)}
              className="inline-flex items-center justify-center"
              style={{
                height: "44px",
                padding: "0 var(--space-lg)",
                background: "var(--color-bg-card)",
                border: "1px solid var(--color-neutral-300)",
                borderRadius: "var(--radius-md)",
                fontSize: "var(--text-base)",
                fontWeight: "var(--weight-medium)",
                color: "var(--color-neutral-700)",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              戻る
            </button>
            <button
              type="submit"
              disabled={isCancelling}
              className="inline-flex items-center justify-center"
              style={{
                height: "44px",
                padding: "0 var(--space-lg)",
                background: "var(--color-error)",
                border: "none",
                borderRadius: "var(--radius-md)",
                fontSize: "var(--text-base)",
                fontWeight: "var(--weight-medium)",
                color: "#FFFFFF",
                cursor: isCancelling ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                opacity: isCancelling ? 0.5 : 1,
              }}
            >
              {isCancelling ? "キャンセル中..." : "キャンセルする"}
            </button>
          </div>
        </fetcher.Form>
      </Modal>
    </div>
  );
}
