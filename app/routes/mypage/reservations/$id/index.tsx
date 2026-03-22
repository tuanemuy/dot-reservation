import { getFormProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { useState } from "react";
import { data, Link } from "react-router";
import { z } from "zod";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { cancelReservation } from "@/core/application/reservation/cancelReservation";
import type { GetReservationOutput } from "@/core/application/reservation/getReservation";
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

const statusLabels: Record<string, string> = {
  pending: "承認待ち",
  confirmed: "確定",
  completed: "完了",
  cancelled: "キャンセル",
  rejected: "却下",
};

type BadgeVariant =
  | "default"
  | "primary"
  | "accent"
  | "success"
  | "warning"
  | "destructive";

const statusBadgeVariants: Record<string, BadgeVariant> = {
  pending: "warning",
  confirmed: "success",
  completed: "default",
  cancelled: "destructive",
  rejected: "destructive",
};

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

  // テナント情報を取得して canModify/canCancel を判定
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
    },
  };
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

  const detailRows: { label: string; value: string | null }[] = [
    { label: "メニュー", value: reservation.menuName },
    { label: "所要時間", value: `${reservation.menuDuration}分` },
    { label: "料金", value: `${reservation.menuPrice.toLocaleString()}円` },
    { label: "担当スタッフ", value: reservation.staffName ?? "指名なし" },
    {
      label: "予約日時",
      value: `${new Date(reservation.date).toLocaleDateString("ja-JP")} ${reservation.startTime} - ${reservation.endTime}`,
    },
    { label: "備考", value: reservation.note },
    { label: "キャンセル理由", value: reservation.cancellationReason },
    { label: "却下理由", value: reservation.rejectionReason },
  ];

  return (
    <div>
      <div className="mb-6">
        <Link
          to="/mypage/reservations"
          className="text-sm text-text-secondary hover:text-text"
        >
          予約一覧に戻る
        </Link>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-text">予約詳細</h1>
          <Badge variant={statusBadgeVariants[reservation.status] ?? "default"}>
            {statusLabels[reservation.status] ?? reservation.status}
          </Badge>
        </CardHeader>

        <CardBody>
          <dl className="divide-y divide-border">
            {detailRows
              .filter((row) => row.value !== null)
              .map((row) => (
                <div key={row.label} className="flex py-3">
                  <dt className="w-32 shrink-0 text-sm text-text-secondary">
                    {row.label}
                  </dt>
                  <dd className="text-sm text-text">{row.value}</dd>
                </div>
              ))}
          </dl>
        </CardBody>

        {(reservation.canModify ||
          reservation.canCancel ||
          reservation.status === "completed") && (
          <CardFooter className="flex gap-3">
            {reservation.canModify && (
              <Link to={`/mypage/reservations/${reservation.id}/edit`}>
                <Button variant="outline" size="md">
                  予約を変更
                </Button>
              </Link>
            )}
            {reservation.canCancel && (
              <Button
                variant="destructive"
                size="md"
                onClick={() => setShowCancelDialog(true)}
              >
                キャンセル
              </Button>
            )}
            {reservation.status === "completed" && (
              <Button size="md">再予約</Button>
            )}
          </CardFooter>
        )}
      </Card>

      <Modal
        open={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        title="予約をキャンセルしますか？"
      >
        <fetcher.Form method="post" {...getFormProps(cancelForm)}>
          <input type="hidden" name="intent" value="cancelReservation" />
          <input type="hidden" name="reservationId" value={reservation.id} />
          <div className="mb-4 space-y-1.5">
            <label
              htmlFor="cancel-reason"
              className="block text-sm font-medium text-text"
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
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
            >
              戻る
            </Button>
            <Button type="submit" variant="destructive" disabled={isCancelling}>
              {isCancelling ? "キャンセル中..." : "キャンセルする"}
            </Button>
          </div>
        </fetcher.Form>
      </Modal>
    </div>
  );
}
