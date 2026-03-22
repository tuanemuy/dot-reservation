import { getFormProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { useState } from "react";
import { data, Link, redirect, useParams } from "react-router";
import { z } from "zod";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { cancelReservation } from "@/core/application/reservation/cancelReservation";
import type { GetReservationOutput } from "@/core/application/reservation/getReservation";
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

type BadgeVariant =
  | "default"
  | "primary"
  | "accent"
  | "success"
  | "warning"
  | "destructive";

const statusLabels: Record<string, string> = {
  confirmed: "確定",
  pending: "承認待ち",
  cancelled: "キャンセル",
  completed: "完了",
  rejected: "却下",
};

const statusBadgeVariants: Record<string, BadgeVariant> = {
  pending: "warning",
  confirmed: "success",
  completed: "default",
  cancelled: "destructive",
  rejected: "destructive",
};

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
    },
    onHandlerError: ({ error: err }) => {
      console.error("Cancellation failed:", err);
    },
  });

  const isCancelling = fetcher.isPending("cancel");

  const detailRows: { label: string; value: string | null }[] = [
    { label: "顧客名", value: reservation.customerName },
    {
      label: "電話番号",
      value: reservation.customerPhoneNumber,
    },
    { label: "メニュー", value: reservation.menuName },
    { label: "所要時間", value: `${reservation.menuDuration}分` },
    {
      label: "料金",
      value: `${reservation.menuPrice.toLocaleString()}円`,
    },
    {
      label: "予約日時",
      value: `${reservation.date} ${reservation.startTime} - ${reservation.endTime}`,
    },
    { label: "備考", value: reservation.note },
    {
      label: "キャンセル理由",
      value: reservation.cancellationReason,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <Link
          to={`/staff/${tenantId}/reservations`}
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

        {canModify && (
          <CardFooter className="flex gap-3">
            <Link to={`/staff/${tenantId}/reservations/${reservation.id}/edit`}>
              <Button variant="outline" size="md">
                変更する
              </Button>
            </Link>
            <Button
              variant="destructive"
              size="md"
              onClick={() => setShowCancelDialog(true)}
            >
              キャンセルする
            </Button>
          </CardFooter>
        )}
      </Card>

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
          <div className="mb-4 space-y-1.5">
            <label
              htmlFor="cancel-reason"
              className="block text-sm font-medium text-text"
            >
              キャンセル理由（任意）
            </label>
            <textarea
              id="cancel-reason"
              name="reason"
              rows={3}
              placeholder="キャンセル理由を入力してください"
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm transition-colors placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
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
