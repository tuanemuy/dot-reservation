import { useCallback, useEffect, useState } from "react";
import { data, Link, useFetcher } from "react-router";
import { PublicLayout } from "@/components/layout/PublicLayout";

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
  { id: 1, label: "メニュー" },
  { id: 2, label: "スタッフ" },
  { id: 3, label: "日時" },
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
        <div
          className="mx-auto text-center"
          style={{
            maxWidth: 640,
            padding: "var(--space-section) var(--space-2xl)",
          }}
        >
          <div
            className="mx-auto mb-[var(--space-md)] flex items-center justify-center rounded-full"
            style={{
              width: 64,
              height: 64,
              background: "var(--color-success-bg)",
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-success)"
              strokeWidth="2"
            >
              <title>完了</title>
              <path
                d="M20 6L9 17l-5-5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1
            className="text-neutral-900"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "var(--text-2xl)",
              fontWeight: "var(--weight-semibold)",
              marginBottom: "var(--space-sm)",
            }}
          >
            {reservationResult.status === "confirmed"
              ? "予約が確定しました"
              : "予約リクエストを送信しました"}
          </h1>
          <p
            className="text-neutral-600"
            style={{
              fontSize: "var(--text-base)",
              marginBottom: "var(--space-xl)",
            }}
          >
            {reservationResult.status === "confirmed"
              ? "ご予約ありがとうございます。"
              : "店舗の承認後、予約が確定します。"}
          </p>

          {/* Summary card */}
          <div
            className="overflow-hidden border border-neutral-300 bg-[var(--color-bg-card)] text-left"
            style={{
              borderRadius: "var(--radius-lg)",
              marginBottom: "var(--space-xl)",
            }}
          >
            <div
              className="bg-primary-lighter"
              style={{ padding: "var(--space-lg) var(--space-xl)" }}
            >
              <h3
                className="text-neutral-900"
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "var(--text-lg)",
                  fontWeight: "var(--weight-semibold)",
                  letterSpacing: "var(--tracking-tight)",
                }}
              >
                予約内容
              </h3>
            </div>
            <div
              className="flex flex-col"
              style={{
                padding: "var(--space-xl)",
                gap: "var(--space-lg)",
              }}
            >
              <SummaryItem label="店舗" value={tenant.name} />
              {selectedMenu && (
                <>
                  <div className="bg-neutral-200" style={{ height: 1 }} />
                  <SummaryItem
                    label="メニュー"
                    value={`${selectedMenu.name} ${selectedMenu.duration}分`}
                  />
                </>
              )}
              {reservation.date && (
                <>
                  <div className="bg-neutral-200" style={{ height: 1 }} />
                  <SummaryItem
                    label="日時"
                    value={`${new Date(reservation.date).toLocaleDateString("ja-JP")} ${reservation.startTime}`}
                  />
                </>
              )}
              {selectedMenu && (
                <>
                  <div className="bg-neutral-200" style={{ height: 1 }} />
                  <div className="flex items-baseline justify-between">
                    <span
                      className="text-neutral-600"
                      style={{ fontSize: "var(--text-base)" }}
                    >
                      お支払い金額
                    </span>
                    <span
                      className="text-accent"
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "var(--text-2xl)",
                        fontWeight: "var(--weight-semibold)",
                        letterSpacing: "var(--tracking-tight)",
                      }}
                    >
                      &yen;{selectedMenu.price.toLocaleString()}
                      <span
                        className="text-neutral-500"
                        style={{
                          fontSize: "var(--text-xs)",
                          fontWeight: "var(--weight-normal)",
                        }}
                      >
                        {" "}
                        (税込)
                      </span>
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div
            className="flex justify-center"
            style={{ gap: "var(--space-md)" }}
          >
            <Link
              to={`/shop/${tenant.urlPath}`}
              className="inline-flex items-center justify-center border border-neutral-300 bg-[var(--color-bg-card)] text-neutral-700 no-underline transition-[border-color,background] duration-[0.15s] ease-[ease] hover:border-neutral-400 hover:bg-neutral-100"
              style={{
                height: 48,
                padding: "0 var(--space-xl)",
                borderRadius: "var(--radius-md)",
                fontSize: "var(--text-base)",
                fontWeight: "var(--weight-medium)",
              }}
            >
              店舗ページに戻る
            </Link>
            <Link
              to="/mypage/reservations"
              className="inline-flex items-center justify-center border-none bg-primary text-white no-underline transition-[background] duration-[0.15s] ease-[ease] hover:bg-primary-dark"
              style={{
                height: 48,
                padding: "0 var(--space-xl)",
                borderRadius: "var(--radius-md)",
                fontSize: "var(--text-base)",
                fontWeight: "var(--weight-medium)",
              }}
            >
              予約一覧を確認
            </Link>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div
        className="mx-auto"
        style={{
          maxWidth: 1280,
          padding: "0 var(--space-2xl)",
        }}
      >
        {/* Breadcrumb */}
        <nav
          className="flex items-center text-neutral-500"
          aria-label="パンくずリスト"
          style={{
            padding: "var(--space-md) 0",
            fontSize: "var(--text-sm)",
            gap: "var(--space-sm)",
          }}
        >
          <Link
            to="/"
            className="text-neutral-600 no-underline transition-colors duration-[0.15s] ease-[ease] hover:text-primary"
          >
            トップ
          </Link>
          <span className="text-neutral-300">/</span>
          <Link
            to={`/shop/${tenant.urlPath}`}
            className="text-neutral-600 no-underline transition-colors duration-[0.15s] ease-[ease] hover:text-primary"
          >
            {tenant.name}
          </Link>
          <span className="text-neutral-300">/</span>
          <span className="text-neutral-700">予約</span>
        </nav>

        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} />

        {/* Page Title */}
        <h1
          className="text-neutral-900"
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "var(--text-2xl)",
            fontWeight: "var(--weight-semibold)",
            letterSpacing: "var(--tracking-tight)",
            marginBottom: "var(--space-lg)",
          }}
        >
          {currentStep === 1
            ? "メニューを選択"
            : currentStep === 2
              ? "スタッフを選択"
              : currentStep === 3
                ? "日時を選択"
                : "予約内容の確認"}
        </h1>

        {/* Two Column Layout */}
        <div
          className="grid items-start"
          style={{
            gridTemplateColumns: "1fr 360px",
            gap: "var(--space-2xl)",
            paddingBottom: "var(--space-section)",
          }}
        >
          {/* Main */}
          <div>
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
                reservation={reservation}
                onBack={handleBack}
                onComplete={(result) => {
                  setReservationResult(result);
                  setCompleted(true);
                }}
              />
            )}
          </div>

          {/* Sidebar Summary */}
          <aside className="sticky" style={{ top: 88 }}>
            <div
              className="overflow-hidden border border-neutral-300 bg-[var(--color-bg-card)]"
              style={{ borderRadius: "var(--radius-lg)" }}
            >
              <div
                className="bg-primary-lighter"
                style={{ padding: "var(--space-lg) var(--space-xl)" }}
              >
                <h3
                  className="text-neutral-900"
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "var(--text-lg)",
                    fontWeight: "var(--weight-semibold)",
                    letterSpacing: "var(--tracking-tight)",
                  }}
                >
                  予約内容
                </h3>
              </div>
              <div
                className="flex flex-col"
                style={{
                  padding: "var(--space-xl)",
                  gap: "var(--space-lg)",
                }}
              >
                <SummaryItem label="店舗" value={tenant.name} />

                {selectedMenu && (
                  <>
                    <div className="bg-neutral-200" style={{ height: 1 }} />
                    <SummaryItem
                      label="メニュー"
                      value={`${selectedMenu.name} ${selectedMenu.duration}分`}
                    />
                  </>
                )}

                {reservation.staffId !== null &&
                  reservation.staffId !== undefined && (
                    <>
                      <div className="bg-neutral-200" style={{ height: 1 }} />
                      <SummaryItem
                        label="スタッフ"
                        value={reservation.staffId ? "指名あり" : "指名なし"}
                      />
                    </>
                  )}

                {reservation.date && reservation.startTime && (
                  <>
                    <div className="bg-neutral-200" style={{ height: 1 }} />
                    <div
                      className="flex flex-col"
                      style={{ gap: "var(--space-xs)" }}
                    >
                      <span
                        className="text-neutral-500 uppercase"
                        style={{
                          fontSize: "var(--text-xs)",
                          fontWeight: "var(--weight-medium)",
                          letterSpacing: "var(--tracking-wide)",
                        }}
                      >
                        日時
                      </span>
                      <span
                        className="flex items-center gap-[var(--space-sm)] text-primary"
                        style={{
                          fontSize: "var(--text-base)",
                          fontWeight: "var(--weight-medium)",
                        }}
                      >
                        <svg
                          width="16"
                          height="16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          viewBox="0 0 24 24"
                        >
                          <title>日時</title>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                          />
                        </svg>
                        {new Date(reservation.date).toLocaleDateString("ja-JP")}{" "}
                        {reservation.startTime}
                      </span>
                    </div>
                  </>
                )}

                {selectedMenu && (
                  <>
                    <div className="bg-neutral-200" style={{ height: 1 }} />
                    <div className="flex items-baseline justify-between">
                      <span
                        className="text-neutral-600"
                        style={{ fontSize: "var(--text-base)" }}
                      >
                        お支払い金額
                      </span>
                      <span
                        className="text-accent"
                        style={{
                          fontFamily: "var(--font-heading)",
                          fontSize: "var(--text-2xl)",
                          fontWeight: "var(--weight-semibold)",
                          letterSpacing: "var(--tracking-tight)",
                        }}
                      >
                        &yen;{selectedMenu.price.toLocaleString()}
                        <span
                          className="text-neutral-500"
                          style={{
                            fontSize: "var(--text-xs)",
                            fontWeight: "var(--weight-normal)",
                          }}
                        >
                          {" "}
                          (税込)
                        </span>
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </PublicLayout>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col" style={{ gap: "var(--space-xs)" }}>
      <span
        className="text-neutral-500 uppercase"
        style={{
          fontSize: "var(--text-xs)",
          fontWeight: "var(--weight-medium)",
          letterSpacing: "var(--tracking-wide)",
        }}
      >
        {label}
      </span>
      <span
        className="text-neutral-900"
        style={{
          fontSize: "var(--text-base)",
          fontWeight: "var(--weight-medium)",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div
      className="flex items-center justify-center"
      style={{
        gap: 0,
        padding: "var(--space-xl) 0 var(--space-2xl)",
      }}
    >
      {STEPS.map((step, index) => {
        const isCompleted = step.id < currentStep;
        const isActive = step.id === currentStep;
        const isUpcoming = step.id > currentStep;

        return (
          <div key={step.id} className="flex items-center">
            <div
              className="flex items-center"
              style={{ gap: "var(--space-sm)" }}
            >
              <div
                className="flex items-center justify-center"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "var(--radius-full)",
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--weight-semibold)",
                  fontFamily: "var(--font-heading)",
                  background: isUpcoming
                    ? "var(--color-neutral-200)"
                    : "var(--color-primary)",
                  color: isUpcoming
                    ? "var(--color-neutral-500)"
                    : "var(--color-bg-page)",
                  ...(isActive
                    ? {
                        boxShadow: "0 0 0 4px var(--color-primary-lighter)",
                      }
                    : {}),
                }}
              >
                {isCompleted ? (
                  <svg
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <title>完了</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                ) : (
                  step.id
                )}
              </div>
              <span
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--weight-medium)",
                  color: isCompleted
                    ? "var(--color-primary)"
                    : isActive
                      ? "var(--color-neutral-900)"
                      : "var(--color-neutral-500)",
                }}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                style={{
                  width: 48,
                  height: 2,
                  margin: "0 var(--space-sm)",
                  background:
                    step.id < currentStep
                      ? "var(--color-primary)"
                      : "var(--color-neutral-300)",
                }}
              />
            )}
          </div>
        );
      })}
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
    <div className="flex flex-col" style={{ gap: "var(--space-md)" }}>
      {menus.map((menu) => (
        // biome-ignore lint/a11y/noStaticElementInteractions: interactive card
        <div
          key={menu.id}
          className={`grid cursor-pointer items-center border bg-[var(--color-bg-card)] transition-[border-color,box-shadow] duration-[0.15s] ease-[ease] hover:border-neutral-400 hover:shadow-[var(--shadow-sm)] ${
            selectedMenuId === menu.id ? "border-primary" : "border-neutral-300"
          }`}
          style={{
            gridTemplateColumns: "1fr auto",
            gap: "var(--space-xl)",
            padding: "var(--space-lg) var(--space-xl)",
            borderRadius: "var(--radius-lg)",
          }}
          onClick={() => onSelect(menu.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSelect(menu.id);
          }}
        >
          <div className="flex flex-col" style={{ gap: "var(--space-sm)" }}>
            <div
              className="flex items-center"
              style={{ gap: "var(--space-md)" }}
            >
              <h3
                className="text-neutral-900"
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "var(--text-lg)",
                  fontWeight: "var(--weight-medium)",
                  letterSpacing: "var(--tracking-tight)",
                }}
              >
                {menu.name}
              </h3>
              <span
                className="bg-neutral-100 text-neutral-600"
                style={{
                  fontSize: "var(--text-xs)",
                  padding: "3px var(--space-sm)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                {menu.duration}分
              </span>
            </div>
            {menu.description && (
              <p
                className="text-neutral-600"
                style={{
                  fontSize: "var(--text-base)",
                  fontWeight: "var(--weight-light)",
                }}
              >
                {menu.description}
              </p>
            )}
          </div>
          <div
            className="text-accent whitespace-nowrap"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "var(--text-2xl)",
              fontWeight: "var(--weight-semibold)",
              letterSpacing: "var(--tracking-tight)",
            }}
          >
            &yen;{menu.price.toLocaleString()}
            <span
              className="text-neutral-500"
              style={{
                fontSize: "var(--text-xs)",
                fontWeight: "var(--weight-normal)",
                marginLeft: 2,
              }}
            >
              (税込)
            </span>
          </div>
        </div>
      ))}
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
      {isLoading ? (
        <p className="py-8 text-center text-neutral-500">読み込み中...</p>
      ) : (
        <div className="flex flex-col" style={{ gap: "var(--space-md)" }}>
          {/* No preference */}
          <button
            type="button"
            className={`flex cursor-pointer items-center border bg-[var(--color-bg-card)] transition-[border-color,box-shadow] duration-[0.15s] ease-[ease] hover:border-neutral-400 hover:shadow-[var(--shadow-sm)] ${
              selectedStaffId === null ? "border-primary" : "border-neutral-300"
            }`}
            style={{
              gap: "var(--space-md)",
              padding: "var(--space-lg) var(--space-xl)",
              borderRadius: "var(--radius-lg)",
            }}
            onClick={() => onSelect(null)}
          >
            <div
              className="flex shrink-0 items-center justify-center bg-neutral-200 text-neutral-500"
              style={{
                width: 48,
                height: 48,
                borderRadius: "var(--radius-full)",
                fontSize: "var(--text-base)",
                fontWeight: "var(--weight-medium)",
              }}
            >
              -
            </div>
            <span
              className="text-neutral-900"
              style={{
                fontSize: "var(--text-base)",
                fontWeight: "var(--weight-medium)",
              }}
            >
              指名なし
            </span>
          </button>

          {staff.map((s) => (
            <button
              type="button"
              key={s.id}
              className={`flex cursor-pointer items-center border bg-[var(--color-bg-card)] transition-[border-color,box-shadow] duration-[0.15s] ease-[ease] hover:border-neutral-400 hover:shadow-[var(--shadow-sm)] ${
                selectedStaffId === s.id
                  ? "border-primary"
                  : "border-neutral-300"
              }`}
              style={{
                gap: "var(--space-md)",
                padding: "var(--space-lg) var(--space-xl)",
                borderRadius: "var(--radius-lg)",
              }}
              onClick={() => onSelect(s.id)}
            >
              <div
                className="flex shrink-0 items-center justify-center overflow-hidden text-secondary"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "var(--radius-full)",
                  background:
                    "linear-gradient(135deg, var(--color-secondary-lighter), var(--color-secondary-light))",
                  fontSize: "var(--text-lg)",
                  fontWeight: "var(--weight-medium)",
                }}
              >
                {s.imageUrl ? (
                  <img
                    src={s.imageUrl}
                    alt={s.displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  s.displayName.charAt(0)
                )}
              </div>
              <span
                className="text-neutral-900"
                style={{
                  fontSize: "var(--text-base)",
                  fontWeight: "var(--weight-medium)",
                }}
              >
                {s.displayName}
              </span>
            </button>
          ))}
        </div>
      )}

      <BottomActions onBack={onBack} />
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
  const today = new Date();
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState("");
  const fetcher = useFetcher();

  const bookingWindowDays = tenant.reservationSettings.bookingWindowDays;
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + bookingWindowDays);

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

  // Generate calendar
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay();
  const monthLabel = `${calendarYear}年 ${calendarMonth + 1}月`;

  function prevMonth() {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(calendarYear - 1);
    } else {
      setCalendarMonth(calendarMonth - 1);
    }
  }

  function nextMonth() {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(calendarYear + 1);
    } else {
      setCalendarMonth(calendarMonth + 1);
    }
  }

  const DOW = ["日", "月", "火", "水", "木", "金", "土"];

  return (
    <div className="flex flex-col" style={{ gap: "var(--space-2xl)" }}>
      {/* Calendar */}
      <div
        className="border border-neutral-300 bg-[var(--color-bg-card)]"
        style={{
          borderRadius: "var(--radius-lg)",
          padding: "var(--space-xl)",
        }}
      >
        <div
          className="flex items-center justify-between"
          style={{ marginBottom: "var(--space-lg)" }}
        >
          <h2
            className="text-neutral-900"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "var(--text-xl)",
              fontWeight: "var(--weight-semibold)",
              letterSpacing: "var(--tracking-tight)",
            }}
          >
            {monthLabel}
          </h2>
          <div className="flex items-center" style={{ gap: "var(--space-sm)" }}>
            <button
              type="button"
              onClick={prevMonth}
              className="flex cursor-pointer items-center justify-center border border-neutral-300 bg-[var(--color-bg-card)] text-neutral-600 transition-[border-color,background] duration-[0.15s] ease-[ease] hover:border-neutral-400 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              style={{
                width: 36,
                height: 36,
                borderRadius: "var(--radius-md)",
              }}
              aria-label="前月"
            >
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <title>前月</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5L8.25 12l7.5-7.5"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="flex cursor-pointer items-center justify-center border border-neutral-300 bg-[var(--color-bg-card)] text-neutral-600 transition-[border-color,background] duration-[0.15s] ease-[ease] hover:border-neutral-400 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              style={{
                width: 36,
                height: 36,
                borderRadius: "var(--radius-md)",
              }}
              aria-label="次月"
            >
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <title>次月</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 4.5l7.5 7.5-7.5 7.5"
                />
              </svg>
            </button>
          </div>
        </div>

        <div
          className="grid"
          style={{
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 2,
          }}
        >
          {DOW.map((d, i) => (
            <div
              key={d}
              className="text-center text-neutral-500 uppercase"
              style={{
                fontSize: "var(--text-xs)",
                fontWeight: "var(--weight-medium)",
                padding: "var(--space-sm) 0",
                letterSpacing: "var(--tracking-wide)",
                color:
                  i === 0
                    ? "var(--color-error)"
                    : i === 6
                      ? "var(--color-info)"
                      : undefined,
              }}
            >
              {d}
            </div>
          ))}

          {/* Empty cells */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => {
            const emptyKey = `empty-${calendarYear}-${calendarMonth}-${i}`;
            return <div key={emptyKey} style={{ aspectRatio: "1" }} />;
          })}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const date = new Date(calendarYear, calendarMonth, day);
            const dayOfWeek = date.getDay();
            const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isToday = date.toDateString() === today.toDateString();
            const isPast = date < today && !isToday;
            const isBeyondWindow = date > maxDate;
            const isHoliday =
              tenant.regularHolidays.includes(dayOfWeek) ||
              tenant.temporaryHolidays.some(
                (h) => new Date(h.date).toDateString() === date.toDateString(),
              );
            const isDisabled = isPast || isBeyondWindow || isHoliday;
            const isSelected = selectedDate === dateStr;

            return (
              <button
                key={day}
                type="button"
                disabled={isDisabled}
                onClick={() => {
                  if (!isDisabled) handleDateSelect(dateStr);
                }}
                className="flex items-center justify-center border-2 border-transparent transition-[background,color] duration-[0.15s] ease-[ease] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                style={{
                  aspectRatio: "1",
                  fontSize: "var(--text-base)",
                  fontWeight:
                    isSelected || isToday
                      ? "var(--weight-semibold)"
                      : "var(--weight-normal)",
                  fontFamily: "var(--font-heading)",
                  borderRadius: "var(--radius-md)",
                  cursor: isDisabled ? "not-allowed" : "pointer",
                  background: isSelected
                    ? "var(--color-primary)"
                    : "transparent",
                  color: isSelected
                    ? "var(--color-bg-page)"
                    : isDisabled
                      ? "var(--color-neutral-300)"
                      : isToday
                        ? "var(--color-primary)"
                        : dayOfWeek === 0
                          ? "var(--color-error)"
                          : dayOfWeek === 6
                            ? "var(--color-info)"
                            : "var(--color-neutral-800)",
                }}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div
          className="flex items-center border-t border-neutral-200"
          style={{
            gap: "var(--space-lg)",
            marginTop: "var(--space-md)",
            paddingTop: "var(--space-md)",
          }}
        >
          <div
            className="flex items-center text-neutral-500"
            style={{
              gap: "var(--space-xs)",
              fontSize: "var(--text-xs)",
            }}
          >
            <div
              className="bg-primary"
              style={{
                width: 10,
                height: 10,
                borderRadius: "var(--radius-full)",
              }}
            />
            選択中
          </div>
          <div
            className="flex items-center text-neutral-500"
            style={{
              gap: "var(--space-xs)",
              fontSize: "var(--text-xs)",
            }}
          >
            <div
              className="border border-primary-light bg-primary-lighter"
              style={{
                width: 10,
                height: 10,
                borderRadius: "var(--radius-full)",
              }}
            />
            予約可
          </div>
          <div
            className="flex items-center text-neutral-500"
            style={{
              gap: "var(--space-xs)",
              fontSize: "var(--text-xs)",
            }}
          >
            <div
              className="bg-neutral-200"
              style={{
                width: 10,
                height: 10,
                borderRadius: "var(--radius-full)",
              }}
            />
            休業日
          </div>
        </div>
      </div>

      {/* Time Slots */}
      {selectedDate && (
        <div
          className="border border-neutral-300 bg-[var(--color-bg-card)]"
          style={{
            borderRadius: "var(--radius-lg)",
            padding: "var(--space-xl)",
          }}
        >
          <div
            className="flex items-baseline justify-between"
            style={{ marginBottom: "var(--space-lg)" }}
          >
            <h2
              className="text-neutral-900"
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "var(--text-xl)",
                fontWeight: "var(--weight-semibold)",
                letterSpacing: "var(--tracking-tight)",
              }}
            >
              時間を選択
            </h2>
            <span
              className="text-neutral-500"
              style={{ fontSize: "var(--text-sm)" }}
            >
              {new Date(selectedDate).toLocaleDateString("ja-JP", {
                month: "long",
                day: "numeric",
                weekday: "short",
              })}
            </span>
          </div>

          {isLoadingSlots ? (
            <p className="py-4 text-center text-neutral-500">
              空き時間を確認中...
            </p>
          ) : slots.length === 0 ? (
            <p className="py-4 text-center text-neutral-500">
              この日に空きはありません
            </p>
          ) : (
            <div
              className="grid"
              style={{
                gridTemplateColumns: "repeat(6, 1fr)",
                gap: "var(--space-sm)",
              }}
            >
              {slots.map((slot) => (
                <button
                  key={slot.startTime}
                  type="button"
                  disabled={!slot.available}
                  onClick={() => {
                    if (slot.available) onSelect(selectedDate, slot.startTime);
                  }}
                  className={`flex cursor-pointer items-center justify-center border transition-[border-color,background,color] duration-[0.15s] ease-[ease] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                    !slot.available
                      ? "cursor-not-allowed border-neutral-200 bg-neutral-100 text-neutral-300"
                      : "border-neutral-300 bg-[var(--color-bg-card)] text-neutral-700 hover:border-primary hover:bg-primary-lighter hover:text-primary-dark"
                  }`}
                  style={{
                    height: 44,
                    borderRadius: "var(--radius-md)",
                    fontSize: "var(--text-sm)",
                    fontWeight: "var(--weight-medium)",
                    fontFamily: "var(--font-heading)",
                  }}
                >
                  {slot.startTime}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <BottomActions onBack={onBack} />
    </div>
  );
}

function ConfirmStep({
  reservation,
  onBack,
  onComplete,
}: {
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
      {/* Note */}
      <div style={{ marginBottom: "var(--space-xl)" }}>
        <label
          htmlFor="note"
          className="text-neutral-800"
          style={{
            display: "block",
            fontSize: "var(--text-sm)",
            fontWeight: "var(--weight-medium)",
            marginBottom: "var(--space-sm)",
          }}
        >
          備考（任意）
        </label>
        <textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="w-full border border-neutral-300 bg-white text-neutral-800 placeholder:text-neutral-400 focus:border-primary focus:outline-none"
          style={{
            borderRadius: "var(--radius-md)",
            padding: "var(--space-md)",
            fontSize: "var(--text-base)",
            fontFamily: "var(--font-body)",
            resize: "vertical",
          }}
          placeholder="ご要望やご質問がありましたらご記入ください"
        />
      </div>

      {loginRequired && (
        <div
          className="border"
          style={{
            borderColor: "var(--color-warning-border)",
            background: "var(--color-warning-bg)",
            padding: "var(--space-lg)",
            borderRadius: "var(--radius-md)",
            marginBottom: "var(--space-xl)",
          }}
        >
          <p
            className="text-neutral-800"
            style={{
              fontSize: "var(--text-sm)",
              fontWeight: "var(--weight-medium)",
              marginBottom: "var(--space-md)",
            }}
          >
            予約するにはログインが必要です
          </p>
          <div className="flex" style={{ gap: "var(--space-md)" }}>
            <Link
              to="/customer/login"
              className="inline-flex items-center justify-center border-none bg-primary text-white no-underline transition-[background] duration-[0.15s] ease-[ease] hover:bg-primary-dark"
              style={{
                height: 40,
                padding: "0 var(--space-lg)",
                borderRadius: "var(--radius-md)",
                fontSize: "var(--text-sm)",
                fontWeight: "var(--weight-medium)",
              }}
            >
              ログイン
            </Link>
            <Link
              to="/customer/register"
              className="inline-flex items-center justify-center border border-neutral-300 bg-[var(--color-bg-card)] text-neutral-700 no-underline transition-[border-color,background] duration-[0.15s] ease-[ease] hover:border-neutral-400 hover:bg-neutral-100"
              style={{
                height: 40,
                padding: "0 var(--space-lg)",
                borderRadius: "var(--radius-md)",
                fontSize: "var(--text-sm)",
                fontWeight: "var(--weight-medium)",
              }}
            >
              新規登録
            </Link>
          </div>
        </div>
      )}

      {fetcher.data?.error && !fetcher.data.needsLogin && (
        <div
          className="border"
          style={{
            borderColor: "var(--color-error-border)",
            background: "var(--color-error-bg)",
            padding: "var(--space-lg)",
            borderRadius: "var(--radius-md)",
            marginBottom: "var(--space-xl)",
          }}
        >
          <p
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--color-error)",
            }}
          >
            {fetcher.data.error}
          </p>
        </div>
      )}

      {/* Actions */}
      <div
        className="flex items-center justify-between border-t border-neutral-300"
        style={{
          padding: "var(--space-xl) 0",
          marginTop: "var(--space-xl)",
        }}
      >
        <button
          type="button"
          onClick={onBack}
          className="inline-flex cursor-pointer items-center justify-center gap-[var(--space-sm)] border border-neutral-300 bg-[var(--color-bg-card)] text-neutral-700 transition-[border-color,background] duration-[0.15s] ease-[ease] hover:border-neutral-400 hover:bg-neutral-100 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          style={{
            height: 48,
            padding: "0 var(--space-xl)",
            borderRadius: "var(--radius-md)",
            fontSize: "var(--text-base)",
            fontWeight: "var(--weight-medium)",
            fontFamily: "var(--font-body)",
          }}
        >
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <title>戻る</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
          戻る
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="inline-flex cursor-pointer items-center justify-center gap-[var(--space-sm)] border-none bg-primary text-white transition-[background] duration-[0.15s] ease-[ease] hover:bg-primary-dark active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            height: 48,
            padding: "0 var(--space-2xl)",
            borderRadius: "var(--radius-md)",
            fontSize: "var(--text-base)",
            fontWeight: "var(--weight-medium)",
            fontFamily: "var(--font-body)",
            letterSpacing: "var(--tracking-wide)",
          }}
        >
          {isSubmitting ? "送信中..." : "予約を確定する"}
        </button>
      </div>
    </div>
  );
}

function BottomActions({ onBack }: { onBack: () => void }) {
  return (
    <div
      className="flex items-center justify-between border-t border-neutral-300"
      style={{
        padding: "var(--space-xl) 0",
        marginTop: "var(--space-xl)",
      }}
    >
      <button
        type="button"
        onClick={onBack}
        className="inline-flex cursor-pointer items-center justify-center gap-[var(--space-sm)] border border-neutral-300 bg-[var(--color-bg-card)] text-neutral-700 transition-[border-color,background] duration-[0.15s] ease-[ease] hover:border-neutral-400 hover:bg-neutral-100 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        style={{
          height: 48,
          padding: "0 var(--space-xl)",
          borderRadius: "var(--radius-md)",
          fontSize: "var(--text-base)",
          fontWeight: "var(--weight-medium)",
          fontFamily: "var(--font-body)",
        }}
      >
        <svg
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <title>戻る</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
          />
        </svg>
        戻る
      </button>
    </div>
  );
}
