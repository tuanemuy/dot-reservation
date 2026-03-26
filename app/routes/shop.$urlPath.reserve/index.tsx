import { useEffect, useState } from "react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { CompletionView } from "@/components/reservation/CompletionView";
import { ConfirmStep } from "@/components/reservation/ConfirmStep";
import { DateTimeSelectStep } from "@/components/reservation/DateTimeSelectStep";
import { MenuSelectStep } from "@/components/reservation/MenuSelectStep";
import { ReservationSummary } from "@/components/reservation/ReservationSummary";
import { StaffSelectStep } from "@/components/reservation/StaffSelectStep";
import type { ReservationState } from "@/components/reservation/types";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";
import { StepIndicator } from "@/components/ui/StepIndicator";
import type { Route } from "./+types/index";

export { action } from "./action";
export { loader } from "./loader";

const RESERVATION_STEPS = [
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: Only run on presetMenuId change, not on currentStep change to avoid loops
  useEffect(() => {
    if (presetMenuId && currentStep === 1) {
      setCurrentStep(2);
    }
  }, [presetMenuId]);

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
        <CompletionView
          tenant={tenant}
          selectedMenu={selectedMenu}
          reservation={reservation}
          reservationResult={reservationResult}
        />
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <Container>
        <Breadcrumb
          items={[
            { label: "トップ", to: "/" },
            { label: tenant.name, to: `/shop/${tenant.urlPath}` },
            { label: "予約" },
          ]}
        />

        {/* Step Indicator */}
        <StepIndicator steps={RESERVATION_STEPS} currentStep={currentStep} />

        {/* Page Title */}
        <h1 className="mb-6 font-heading text-2xl font-semibold tracking-tight text-neutral-900">
          {currentStep === 1
            ? "メニューを選択"
            : currentStep === 2
              ? "スタッフを選択"
              : currentStep === 3
                ? "日時を選択"
                : "予約内容の確認"}
        </h1>

        {/* Two Column Layout */}
        <div className="grid items-start gap-10 pb-20 max-lg:grid-cols-1 lg:grid-cols-[1fr_360px]">
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
          <ReservationSummary
            tenantName={tenant.name}
            selectedMenu={selectedMenu}
            reservation={reservation}
          />
        </div>
      </Container>
    </PublicLayout>
  );
}
