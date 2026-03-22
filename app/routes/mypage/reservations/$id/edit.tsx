import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { Link } from "react-router";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  createCompositeAction,
  defineHandler,
  success,
  useCompositeAction,
} from "@/lib/compositeAction";
import type { Route } from "./+types/edit";

type ReservationForEdit = {
  id: string;
  storeName: string;
  menuId: string;
  menuName: string;
  staffProfileId: string | null;
  staffName: string | null;
  date: string;
  startTime: string;
  endTime: string;
  note: string | null;
};

type MenuOption = {
  id: string;
  name: string;
  duration: number;
  price: number;
};

type StaffOption = {
  id: string;
  name: string;
};

const updateReservationSchema = z.object({
  menuId: z.string().min(1, "メニューを選択してください"),
  staffProfileId: z.string().optional(),
  date: z.string().min(1, "日付を選択してください"),
  startTime: z.string().min(1, "開始時刻を選択してください"),
  note: z.string().optional(),
});

const handlers = {
  updateReservation: defineHandler({
    schema: updateReservationSchema,
    handler: async (value, _args) => {
      // TODO: 予約変更ユースケースを実装
      console.log("Update reservation:", value);
      return success();
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}

export async function loader({ params }: Route.LoaderArgs) {
  const reservationId = params.id;

  // TODO: 予約詳細・メニュー一覧・スタッフ一覧を取得
  const dummyReservation: ReservationForEdit = {
    id: reservationId,
    storeName: "サンプル美容室",
    menuId: "menu-1",
    menuName: "カット",
    staffProfileId: "staff-1",
    staffName: "田中 花子",
    date: "2026-03-25",
    startTime: "10:00",
    endTime: "11:00",
    note: null,
  };

  const dummyMenus: MenuOption[] = [
    { id: "menu-1", name: "カット", duration: 60, price: 5000 },
    { id: "menu-2", name: "カラー", duration: 90, price: 8000 },
    { id: "menu-3", name: "パーマ", duration: 120, price: 10000 },
  ];

  const dummyStaff: StaffOption[] = [
    { id: "staff-1", name: "田中 花子" },
    { id: "staff-2", name: "佐藤 次郎" },
  ];

  return {
    reservation: dummyReservation,
    menus: dummyMenus,
    staff: dummyStaff,
  };
}

export default function ReservationEditPage({
  loaderData,
}: Route.ComponentProps) {
  const { reservation, menus, staff } = loaderData;
  const fetcher = useCompositeAction<typeof handlers>();

  const [form, fields] = useForm({
    id: "update-reservation-form",
    defaultValue: {
      menuId: reservation.menuId,
      staffProfileId: reservation.staffProfileId ?? "",
      date: reservation.date,
      startTime: reservation.startTime,
      note: reservation.note ?? "",
    },
    lastResult:
      fetcher.data?.intent === "updateReservation" ? fetcher.data : undefined,
    constraint: getZodConstraint(handlers.updateReservation.schema),
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, {
        schema: handlers.updateReservation.schema,
      });
    },
  });

  fetcher.register("updateReservation", {
    onSuccess: () => {
      // TODO: 成功時にリダイレクト
      console.log("Reservation updated");
    },
    onHandlerError: ({ error: err }) => {
      console.error("Update failed:", err);
    },
  });

  const isPending = fetcher.isPending("updateReservation");

  return (
    <div>
      <div className="mb-6">
        <Link
          to={`/mypage/reservations/${reservation.id}`}
          className="text-sm text-text-secondary hover:text-text"
        >
          予約詳細に戻る
        </Link>
      </div>

      <h1 className="mb-6 text-2xl font-bold text-text">予約変更</h1>

      <Card className="mb-6 bg-surface-secondary">
        <CardBody>
          <h2 className="mb-2 text-sm font-medium text-text-secondary">
            現在の予約内容
          </h2>
          <p className="text-sm text-text">
            {reservation.storeName} / {reservation.menuName}
            {reservation.staffName && ` / ${reservation.staffName}`}
          </p>
          <p className="text-sm text-text-secondary">
            {reservation.date} {reservation.startTime} - {reservation.endTime}
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <fetcher.Form method="post" {...getFormProps(form)}>
            <input type="hidden" name="intent" value="updateReservation" />

            <div className="space-y-5">
              <FormField
                label="メニュー"
                htmlFor={fields.menuId.id}
                error={fields.menuId.errors}
                required
              >
                <Select
                  {...getInputProps(fields.menuId, { type: "text" })}
                  error={fields.menuId.errors?.[0]}
                >
                  {menus.map((menu) => (
                    <option key={menu.id} value={menu.id}>
                      {menu.name} ({menu.duration}分 /{" "}
                      {menu.price.toLocaleString()}円)
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField
                label="担当スタッフ"
                htmlFor={fields.staffProfileId.id}
              >
                <Select
                  {...getInputProps(fields.staffProfileId, { type: "text" })}
                >
                  <option value="">指名なし</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField
                label="日付"
                htmlFor={fields.date.id}
                error={fields.date.errors}
                required
              >
                <Input
                  {...getInputProps(fields.date, { type: "date" })}
                  error={fields.date.errors?.[0]}
                />
              </FormField>

              <FormField
                label="開始時刻"
                htmlFor={fields.startTime.id}
                error={fields.startTime.errors}
                required
              >
                {/* TODO: 空き時間枠から選択するUIに変更 */}
                <Input
                  {...getInputProps(fields.startTime, { type: "time" })}
                  error={fields.startTime.errors?.[0]}
                />
              </FormField>

              <FormField label="備考" htmlFor={fields.note.id}>
                <textarea
                  id={fields.note.id}
                  name={fields.note.name}
                  defaultValue={fields.note.initialValue}
                  rows={3}
                  className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm transition-colors placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="ご要望があればご記入ください"
                />
              </FormField>

              {form.errors && (
                <p className="text-xs text-destructive">{form.errors}</p>
              )}

              <div className="flex gap-3">
                <Link to={`/mypage/reservations/${reservation.id}`}>
                  <Button type="button" variant="outline">
                    キャンセル
                  </Button>
                </Link>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "変更中..." : "変更を確定"}
                </Button>
              </div>
            </div>
          </fetcher.Form>
        </CardBody>
      </Card>
    </div>
  );
}
