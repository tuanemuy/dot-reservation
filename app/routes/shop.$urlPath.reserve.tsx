import { useCallback, useEffect, useState } from "react";
import { data, Link, useFetcher } from "react-router";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";

import { getCustomer } from "@/core/application/customer/getCustomer";
import type { MenuDetail } from "@/core/application/menu/listMenus";
import { listMenus } from "@/core/application/menu/listMenus";
import { createReservation } from "@/core/application/reservation/createReservation";
import type { AvailableSlot } from "@/core/application/reservation/getAvailableSlots";
import { getAvailableSlots } from "@/core/application/reservation/getAvailableSlots";
import type { StaffProfileSummary } from "@/core/application/staff/listStaffProfiles";
import { listStaffsByMenu } from "@/core/application/staff/listStaffsByMenu";
import type { GetTenantOutput } from "@/core/application/tenant/getTenant";
import { getTenant } from "@/core/application/tenant/getTenant";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/shop.$urlPath.reserve";

type ReservationState = {
  menuId: string | null;
  staffId: string | null;
  date: string | null;
  startTime: string | null;
  note: string;
};

export async function loader({ params, request }: Route.LoaderArgs) {
  const { container } = await import("@/core/di/server");
  const url = new URL(request.url);
  const presetMenuId = url.searchParams.get("menuId");
  const presetStaffId = url.searchParams.get("staffId");

  const tenant = await handleUseCase(() =>
    getTenant({
      container,
      headers: request.headers,
      input: { urlPath: params.urlPath },
    }),
  ).match(
    (r) => r,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  const menusResult = await handleUseCase(() =>
    listMenus({
      container,
      headers: request.headers,
      input: { tenantId: tenant.id },
    }),
  ).match(
    (r) => r,
    () => ({ items: [] as MenuDetail[] }),
  );

  return {
    tenant,
    menus: menusResult.items,
    presetMenuId,
    presetStaffId,
  };
}

export async function action({ params, request }: Route.ActionArgs) {
  const { container } = await import("@/core/di/server");
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "loadStaff") {
    const menuId = formData.get("menuId") as string;
    const tenant = await handleUseCase(() =>
      getTenant({
        container,
        headers: request.headers,
        input: { urlPath: params.urlPath },
      }),
    ).match(
      (r) => r,
      (e) => {
        throw data({ message: e.message }, { status: e.status });
      },
    );

    const result = await handleUseCase(() =>
      listStaffsByMenu({
        container,
        headers: request.headers,
        input: { tenantId: tenant.id, menuId },
      }),
    ).match(
      (r) => r,
      () => ({ items: [] as StaffProfileSummary[] }),
    );

    return { intent: "loadStaff", staff: result.items };
  }

  if (intent === "loadSlots") {
    const menuId = formData.get("menuId") as string;
    const staffId = formData.get("staffId") as string | null;
    const dateStr = formData.get("date") as string;
    const tenant = await handleUseCase(() =>
      getTenant({
        container,
        headers: request.headers,
        input: { urlPath: params.urlPath },
      }),
    ).match(
      (r) => r,
      (e) => {
        throw data({ message: e.message }, { status: e.status });
      },
    );

    const result = await handleUseCase(() =>
      getAvailableSlots({
        container,
        headers: request.headers,
        input: {
          tenantId: tenant.id,
          menuId,
          staffProfileId: staffId || null,
          date: dateStr,
        },
      }),
    ).match(
      (r) => r,
      () => ({ slots: [] as AvailableSlot[] }),
    );

    return { intent: "loadSlots", slots: result.slots };
  }

  if (intent === "createReservation") {
    const menuId = formData.get("menuId") as string;
    const staffId = formData.get("staffId") as string | null;
    const dateStr = formData.get("date") as string;
    const startTime = formData.get("startTime") as string;
    const note = formData.get("note") as string;

    const tenant = await handleUseCase(() =>
      getTenant({
        container,
        headers: request.headers,
        input: { urlPath: params.urlPath },
      }),
    ).match(
      (r) => r,
      (e) => {
        throw data({ message: e.message }, { status: e.status });
      },
    );

    const session = await container.authProvider.getSession(request.headers);
    if (!session) {
      return {
        intent: "createReservation",
        error: "予約するにはログインが必要です",
        needsLogin: true,
      };
    }
    const customerResult = await handleUseCase(() =>
      getCustomer({
        container,
        headers: request.headers,
        input: { authUserId: session.user.id },
      }),
    ).match(
      (r) => ({ customerId: r.id, error: null }),
      () => ({ customerId: null, error: "予約するにはログインが必要です" }),
    );

    if (!customerResult.customerId) {
      return {
        intent: "createReservation",
        error: customerResult.error,
        needsLogin: true,
      };
    }
    const customerId = customerResult.customerId;

    const result = await handleUseCase(() =>
      createReservation({
        container,
        headers: request.headers,
        input: {
          tenantId: tenant.id,
          customerId,
          menuId,
          staffProfileId: staffId || null,
          date: dateStr,
          startTime,
          note: note || null,
        },
      }),
    ).match(
      (r) => ({ ...r, error: null }),
      (e) => ({ id: null, status: null, error: e.message }),
    );

    return { intent: "createReservation", ...result };
  }

  throw data({ message: "Invalid intent" }, { status: 400 });
}

const STEPS = [
  { id: 1, label: "メニュー選択" },
  { id: 2, label: "スタッフ選択" },
  { id: 3, label: "日時選択" },
  { id: 4, label: "確認" },
];

export default function ReservationPage({ loaderData }: Route.ComponentProps) {
  const { tenant, menus, presetMenuId, presetStaffId } = loaderData;
  const [currentStep, setCurrentStep] = useState(1);
  const [completed, setCompleted] = useState(false);
  const [reservationResult, setReservationResult] = useState<{
    id: string;
    status: string;
  } | null>(null);

  const [reservation, setReservation] = useState<ReservationState>({
    menuId: presetMenuId,
    staffId: presetStaffId,
    date: null,
    startTime: null,
    note: "",
  });

  // Auto-advance if preset
  useEffect(() => {
    if (presetMenuId && currentStep === 1) {
      setCurrentStep(2);
    }
  }, [presetMenuId, currentStep]);

  const selectedMenu = menus.find((m) => m.id === reservation.menuId);

  function handleSelectMenu(menuId: string) {
    setReservation((prev) => ({
      ...prev,
      menuId,
      staffId: null,
      date: null,
      startTime: null,
    }));
    setCurrentStep(2);
  }

  function handleSelectStaff(staffId: string | null) {
    setReservation((prev) => ({
      ...prev,
      staffId,
      date: null,
      startTime: null,
    }));
    setCurrentStep(3);
  }

  function handleSelectSlot(date: string, startTime: string) {
    setReservation((prev) => ({ ...prev, date, startTime }));
    setCurrentStep(4);
  }

  function handleBack() {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  }

  if (completed && reservationResult) {
    return (
      <PublicLayout>
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <div className="mb-6">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-success"
              >
                <title>完了</title>
                <path
                  d="M20 6L9 17l-5-5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h1 className="mb-2 text-2xl font-bold">
              {reservationResult.status === "confirmed"
                ? "予約が確定しました"
                : "予約リクエストを送信しました"}
            </h1>
            <p className="text-text-secondary">
              {reservationResult.status === "confirmed"
                ? "ご予約ありがとうございます。"
                : "店舗の承認後、予約が確定します。"}
            </p>
          </div>

          <Card>
            <CardBody>
              <div className="space-y-3 text-left text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">店舗</span>
                  <span className="font-medium">{tenant.name}</span>
                </div>
                {selectedMenu && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">メニュー</span>
                      <span className="font-medium">{selectedMenu.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">所要時間</span>
                      <span>{selectedMenu.duration}分</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">料金</span>
                      <span>{selectedMenu.price.toLocaleString()}円</span>
                    </div>
                  </>
                )}
                {reservation.date && (
                  <div className="flex justify-between">
                    <span className="text-text-secondary">日時</span>
                    <span>
                      {new Date(reservation.date).toLocaleDateString("ja-JP")}{" "}
                      {reservation.startTime}
                    </span>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          <div className="mt-8 flex justify-center gap-4">
            <Link to={`/shop/${tenant.urlPath}`}>
              <Button variant="outline">店舗ページに戻る</Button>
            </Link>
            <Link to="/mypage/reservations">
              <Button>予約一覧を確認</Button>
            </Link>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to={`/shop/${tenant.urlPath}`}
            className="mb-2 inline-block text-sm text-text-secondary hover:text-text"
          >
            &larr; {tenant.name}
          </Link>
          <h1 className="text-2xl font-bold">予約</h1>
        </div>

        {/* Step indicator */}
        <StepIndicator currentStep={currentStep} />

        {/* Step content */}
        <div className="mt-8">
          {currentStep === 1 && (
            <MenuSelectStep
              menus={menus}
              selectedMenuId={reservation.menuId}
              onSelect={handleSelectMenu}
            />
          )}
          {currentStep === 2 && reservation.menuId && (
            <StaffSelectStep
              tenant={tenant}
              menuId={reservation.menuId}
              selectedStaffId={reservation.staffId}
              onSelect={handleSelectStaff}
              onBack={handleBack}
            />
          )}
          {currentStep === 3 && reservation.menuId && (
            <DateTimeSelectStep
              tenant={tenant}
              menuId={reservation.menuId}
              staffId={reservation.staffId}
              onSelect={handleSelectSlot}
              onBack={handleBack}
            />
          )}
          {currentStep === 4 && selectedMenu && (
            <ConfirmStep
              tenant={tenant}
              menu={selectedMenu}
              reservation={reservation}
              onBack={handleBack}
              onComplete={(result) => {
                setReservationResult(result);
                setCompleted(true);
              }}
            />
          )}
        </div>
      </div>
    </PublicLayout>
  );
}

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-between">
      {STEPS.map((step, index) => (
        <div key={step.id} className="flex flex-1 items-center">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                step.id <= currentStep
                  ? "bg-primary text-white"
                  : "bg-surface-secondary text-text-muted"
              }`}
            >
              {step.id}
            </div>
            <span
              className={`hidden text-sm sm:inline ${
                step.id <= currentStep ? "text-text" : "text-text-muted"
              }`}
            >
              {step.label}
            </span>
          </div>
          {index < STEPS.length - 1 && (
            <div
              className={`mx-2 h-px flex-1 ${
                step.id < currentStep ? "bg-primary" : "bg-border"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function MenuSelectStep({
  menus,
  selectedMenuId,
  onSelect,
}: {
  menus: MenuDetail[];
  selectedMenuId: string | null;
  onSelect: (menuId: string) => void;
}) {
  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">メニューを選択</h2>
      <div className="space-y-3">
        {menus.map((menu) => (
          <Card
            key={menu.id}
            className={`cursor-pointer transition-all ${
              selectedMenuId === menu.id ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => onSelect(menu.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSelect(menu.id);
            }}
            role="button"
            tabIndex={0}
          >
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{menu.name}</h3>
                    {menu.category && (
                      <Badge variant="default">{menu.category}</Badge>
                    )}
                  </div>
                  {menu.description && (
                    <p className="mt-1 text-sm text-text-secondary">
                      {menu.description}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {menu.price.toLocaleString()}円
                  </div>
                  <div className="text-sm text-text-secondary">
                    {menu.duration}分
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StaffSelectStep({
  menuId,
  selectedStaffId,
  onSelect,
  onBack,
}: {
  tenant: GetTenantOutput;
  menuId: string;
  selectedStaffId: string | null;
  onSelect: (staffId: string | null) => void;
  onBack: () => void;
}) {
  const fetcher = useFetcher();
  const fetcherSubmit = fetcher.submit;

  useEffect(() => {
    fetcherSubmit({ intent: "loadStaff", menuId }, { method: "post" });
  }, [menuId, fetcherSubmit]);

  const staff: StaffProfileSummary[] =
    fetcher.data?.intent === "loadStaff" ? fetcher.data.staff : [];
  const isLoading = fetcher.state !== "idle";

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">スタッフを選択</h2>

      {isLoading ? (
        <p className="py-8 text-center text-text-secondary">読み込み中...</p>
      ) : (
        <div className="space-y-3">
          {/* No preference option */}
          <Card
            className={`cursor-pointer transition-all ${
              selectedStaffId === null ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => onSelect(null)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSelect(null);
            }}
            role="button"
            tabIndex={0}
          >
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-secondary">
                  <span className="text-sm text-text-muted">-</span>
                </div>
                <span className="font-medium">指名なし</span>
              </div>
            </CardBody>
          </Card>

          {staff.map((s) => (
            <Card
              key={s.id}
              className={`cursor-pointer transition-all ${
                selectedStaffId === s.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => onSelect(s.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSelect(s.id);
              }}
              role="button"
              tabIndex={0}
            >
              <CardBody>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-surface-secondary">
                    {s.imageUrl ? (
                      <img
                        src={s.imageUrl}
                        alt={s.displayName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-sm text-text-muted">
                        {s.displayName.charAt(0)}
                      </span>
                    )}
                  </div>
                  <span className="font-medium">{s.displayName}</span>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-6">
        <Button variant="outline" onClick={onBack}>
          戻る
        </Button>
      </div>
    </div>
  );
}

function DateTimeSelectStep({
  tenant,
  menuId,
  staffId,
  onSelect,
  onBack,
}: {
  tenant: GetTenantOutput;
  menuId: string;
  staffId: string | null;
  onSelect: (date: string, startTime: string) => void;
  onBack: () => void;
}) {
  const [selectedDate, setSelectedDate] = useState("");
  const fetcher = useFetcher();

  // Generate available dates (next N days based on booking window)
  const bookingWindowDays = tenant.reservationSettings.bookingWindowDays;
  const dates: string[] = [];
  const today = new Date();
  for (let i = 0; i < bookingWindowDays && i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dayOfWeek = d.getDay();
    const isHoliday = tenant.regularHolidays.includes(dayOfWeek);
    if (!isHoliday) {
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      dates.push(dateStr);
    }
  }

  const fetcherSubmit = fetcher.submit;
  const handleDateSelect = useCallback(
    (dateStr: string) => {
      setSelectedDate(dateStr);
      fetcherSubmit(
        {
          intent: "loadSlots",
          menuId,
          staffId: staffId || "",
          date: dateStr,
        },
        { method: "post" },
      );
    },
    [menuId, staffId, fetcherSubmit],
  );

  const slots: AvailableSlot[] =
    fetcher.data?.intent === "loadSlots" ? fetcher.data.slots : [];
  const isLoadingSlots = fetcher.state !== "idle";

  const DAY_SHORT = ["日", "月", "火", "水", "木", "金", "土"];

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">日時を選択</h2>

      {/* Date selector */}
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-medium text-text-secondary">
          日付を選択
        </h3>
        <div className="flex flex-wrap gap-2">
          {dates.map((dateStr) => {
            const d = new Date(dateStr);
            const dayLabel = DAY_SHORT[d.getDay()];
            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => handleDateSelect(dateStr)}
                className={`flex flex-col items-center rounded-lg border px-3 py-2 text-sm transition-colors ${
                  selectedDate === dateStr
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <span className="text-xs text-text-muted">{dayLabel}</span>
                <span className="font-medium">{d.getDate()}</span>
                <span className="text-xs text-text-muted">
                  {d.getMonth() + 1}月
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time slots */}
      {selectedDate && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-text-secondary">
            時間を選択
          </h3>
          {isLoadingSlots ? (
            <p className="py-4 text-center text-text-secondary">
              空き時間を確認中...
            </p>
          ) : slots.length === 0 ? (
            <p className="py-4 text-center text-text-secondary">
              この日に空きはありません
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {slots.map((slot) => (
                <button
                  key={slot.startTime}
                  type="button"
                  disabled={!slot.available}
                  onClick={() => onSelect(selectedDate, slot.startTime)}
                  className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                    slot.available
                      ? "border-border hover:border-primary hover:bg-primary/5"
                      : "cursor-not-allowed border-border bg-surface-secondary text-text-muted line-through"
                  }`}
                >
                  {slot.startTime}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-6">
        <Button variant="outline" onClick={onBack}>
          戻る
        </Button>
      </div>
    </div>
  );
}

function ConfirmStep({
  tenant,
  menu,
  reservation,
  onBack,
  onComplete,
}: {
  tenant: GetTenantOutput;
  menu: MenuDetail;
  reservation: ReservationState;
  onBack: () => void;
  onComplete: (result: { id: string; status: string }) => void;
}) {
  const fetcher = useFetcher();
  const [note, setNote] = useState(reservation.note);
  const [loginRequired, setLoginRequired] = useState(false);

  useEffect(() => {
    if (fetcher.data?.intent === "createReservation") {
      if (fetcher.data.needsLogin) {
        setLoginRequired(true);
      } else if (fetcher.data.id) {
        onComplete({ id: fetcher.data.id, status: fetcher.data.status });
      }
    }
  }, [fetcher.data, onComplete]);

  function handleSubmit() {
    fetcher.submit(
      {
        intent: "createReservation",
        menuId: reservation.menuId || "",
        staffId: reservation.staffId || "",
        date: reservation.date || "",
        startTime: reservation.startTime || "",
        note: note,
      },
      { method: "post" },
    );
  }

  const isSubmitting = fetcher.state !== "idle";

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">予約内容の確認</h2>

      <Card className="mb-6">
        <CardBody>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">店舗</span>
              <span className="font-medium">{tenant.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">メニュー</span>
              <span className="font-medium">{menu.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">所要時間</span>
              <span>{menu.duration}分</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">料金</span>
              <span>{menu.price.toLocaleString()}円</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">スタッフ</span>
              <span>{reservation.staffId ? "指名あり" : "指名なし"}</span>
            </div>
            {reservation.date && (
              <div className="flex justify-between">
                <span className="text-text-secondary">日時</span>
                <span>
                  {new Date(reservation.date).toLocaleDateString("ja-JP")}{" "}
                  {reservation.startTime}
                </span>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Note */}
      <div className="mb-6">
        <label htmlFor="note" className="mb-2 block text-sm font-medium">
          備考（任意）
        </label>
        <textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="ご要望やご質問がありましたらご記入ください"
        />
      </div>

      {loginRequired && (
        <div className="mb-6 rounded-md border border-warning/30 bg-warning/5 p-4">
          <p className="mb-3 text-sm font-medium">
            予約するにはログインが必要です
          </p>
          <div className="flex gap-3">
            <Link to="/customer/login">
              <Button size="sm">ログイン</Button>
            </Link>
            <Link to="/customer/register">
              <Button variant="outline" size="sm">
                新規登録
              </Button>
            </Link>
          </div>
        </div>
      )}

      {fetcher.data?.error && !fetcher.data.needsLogin && (
        <div className="mb-6 rounded-md border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">{fetcher.data.error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack}>
          戻る
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "送信中..." : "予約を確定する"}
        </Button>
      </div>
    </div>
  );
}
