import { getFormProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { useCallback, useEffect, useState } from "react";
import { useFetcher, useNavigate } from "react-router";
import { EditConfirmStep } from "@/components/reservation/EditConfirmStep";
import { EditSelectStep } from "@/components/reservation/EditSelectStep";
import { Button } from "@/components/ui/Button";
import { StepIndicator } from "@/components/ui/StepIndicator";
import type { AvailableSlot } from "@/core/application/reservation/getAvailableSlots";
import type { StaffProfileSummary } from "@/core/application/staff/listStaffProfiles";
import { useCompositeAction } from "@/lib/compositeAction";
import { buildAvailableDates, formatDateJa } from "@/presentation/date";
import type { Route } from "./+types/index";
import { type handlers, updateReservationSchema } from "./action";

export { action } from "./action";
export { loader } from "./loader";

const EDIT_STEPS = [
  { id: 1, label: "日時選択" },
  { id: 2, label: "変更確認" },
];

export default function ReservationEditPage({
  loaderData,
}: Route.ComponentProps) {
  const { reservation, tenant, menus } = loaderData;
  const fetcher = useCompositeAction<typeof handlers>();
  const staffFetcher = useFetcher();
  const slotsFetcher = useFetcher();
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState(reservation.date);
  const [selectedStartTime, setSelectedStartTime] = useState(
    reservation.startTime,
  );
  const [selectedMenuId, setSelectedMenuId] = useState(
    menus.find((m) => m.name === reservation.menuName)?.id ?? "",
  );
  const [selectedStaffProfileId, setSelectedStaffProfileId] = useState("");
  const [step, setStep] = useState<"select" | "confirm">("select");

  const staffFetcherSubmit = staffFetcher.submit;
  useEffect(() => {
    if (selectedMenuId) {
      staffFetcherSubmit(
        {
          intent: "loadStaff",
          tenantId: tenant.id,
          menuId: selectedMenuId,
        },
        { method: "post" },
      );
    }
  }, [selectedMenuId, tenant.id, staffFetcherSubmit]);

  const slotsFetcherSubmit = slotsFetcher.submit;
  const handleDateSelect = useCallback(
    (dateStr: string) => {
      setSelectedDate(dateStr);
      setSelectedStartTime("");
      if (selectedMenuId) {
        slotsFetcherSubmit(
          {
            intent: "loadSlots",
            tenantId: tenant.id,
            menuId: selectedMenuId,
            staffProfileId: selectedStaffProfileId || "",
            date: dateStr,
          },
          { method: "post" },
        );
      }
    },
    [selectedMenuId, selectedStaffProfileId, tenant.id, slotsFetcherSubmit],
  );

  const staff: StaffProfileSummary[] = staffFetcher.data?.data?.staff ?? [];
  const slots: AvailableSlot[] = slotsFetcher.data?.data?.slots ?? [];
  const isLoadingSlots = slotsFetcher.state !== "idle";

  const [form, fields] = useForm({
    id: "update-reservation-form",
    defaultValue: {
      reservationId: reservation.id,
      menuId: selectedMenuId,
      staffProfileId: selectedStaffProfileId,
      date: reservation.date,
      startTime: reservation.startTime,
      note: reservation.note ?? "",
    },
    lastResult:
      fetcher.data?.intent === "updateReservation" ? fetcher.data : undefined,
    constraint: getZodConstraint(updateReservationSchema),
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, {
        schema: updateReservationSchema,
      });
    },
  });

  fetcher.register("updateReservation", {
    onSuccess: () => {
      navigate(`/mypage/reservations/${reservation.id}`);
    },
  });

  const isPending = fetcher.isPending("updateReservation");

  const dates = buildAvailableDates(
    tenant.reservationSettings.bookingWindowDays,
    tenant.regularHolidays,
  );

  const selectedMenu = menus.find((m) => m.id === selectedMenuId);
  const selectedStaff = staff.find((s) => s.id === selectedStaffProfileId);
  const canProceed = selectedMenu && selectedDate && selectedStartTime;
  const currentStepNumber = step === "select" ? 1 : 2;

  if (step === "confirm" && canProceed) {
    return (
      <div>
        <PageTitle />
        <StepIndicator currentStep={currentStepNumber} steps={EDIT_STEPS} />
        <EditConfirmStep
          rows={[
            {
              label: "メニュー",
              before: `${reservation.menuName} ${reservation.menuDuration}分`,
              after: `${selectedMenu.name} ${selectedMenu.duration}分`,
              changed: selectedMenu.name !== reservation.menuName,
            },
            {
              label: "担当スタッフ",
              before: reservation.staffName ?? "指名なし",
              after: selectedStaff?.displayName ?? "指名なし",
              changed:
                selectedStaff?.displayName !== reservation.staffName &&
                !(!selectedStaff?.displayName && !reservation.staffName),
            },
            {
              label: "予約日時",
              before: `${formatDateJa(reservation.date)} ${reservation.startTime} - ${reservation.endTime}`,
              after: `${formatDateJa(selectedDate)} ${selectedStartTime}`,
              changed:
                selectedDate !== reservation.date ||
                selectedStartTime !== reservation.startTime,
            },
            {
              label: "料金",
              before: `\u00a5${reservation.menuPrice.toLocaleString()}（税込）`,
              after: `\u00a5${selectedMenu.price.toLocaleString()}（税込）`,
              changed: reservation.menuPrice !== selectedMenu.price,
            },
          ]}
          submitForm={
            <fetcher.Form method="post" {...getFormProps(form)}>
              <input type="hidden" name="intent" value="updateReservation" />
              <input
                type="hidden"
                name="reservationId"
                value={reservation.id}
              />
              <input type="hidden" name="menuId" value={selectedMenuId} />
              <input
                type="hidden"
                name="staffProfileId"
                value={selectedStaffProfileId}
              />
              <input type="hidden" name="date" value={selectedDate} />
              <input type="hidden" name="startTime" value={selectedStartTime} />
              <input type="hidden" name="note" value={reservation.note ?? ""} />
              <SubmitButton isPending={isPending} />
            </fetcher.Form>
          }
          formErrors={form.errors}
          isPending={isPending}
          onBack={() => setStep("select")}
        />
      </div>
    );
  }

  return (
    <div>
      <PageTitle />
      <StepIndicator currentStep={currentStepNumber} steps={EDIT_STEPS} />
      <EditSelectStep
        menus={menus}
        staff={staff}
        slots={slots}
        dates={dates}
        selectedMenuId={selectedMenuId}
        selectedStaffProfileId={selectedStaffProfileId}
        selectedDate={selectedDate}
        selectedStartTime={selectedStartTime}
        isLoadingSlots={isLoadingSlots}
        canProceed={!!canProceed}
        cancelLink={`/mypage/reservations/${reservation.id}`}
        fields={{
          menuId: fields.menuId,
          staffProfileId: fields.staffProfileId,
          date: fields.date,
          startTime: fields.startTime,
        }}
        onMenuChange={setSelectedMenuId}
        onStaffChange={setSelectedStaffProfileId}
        onDateSelect={handleDateSelect}
        onTimeSelect={setSelectedStartTime}
        onProceed={() => setStep("confirm")}
      />
    </div>
  );
}

function PageTitle() {
  return (
    <h1 className="font-heading text-2xl font-semibold text-neutral-900 tracking-tight leading-tight mb-6">
      予約変更
    </h1>
  );
}

function SubmitButton({ isPending }: { isPending: boolean }) {
  return (
    <Button
      type="submit"
      variant="primary"
      disabled={isPending}
      className="gap-2"
    >
      {isPending ? "変更中..." : "変更を確定する"}
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
          d="M4.5 12.75l6 6 9-13.5"
        />
      </svg>
    </Button>
  );
}
