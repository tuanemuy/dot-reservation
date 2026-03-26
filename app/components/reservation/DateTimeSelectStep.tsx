import { useCallback, useState } from "react";
import { useFetcher } from "react-router";
import { BottomActions } from "./BottomActions";
import { MonthCalendar } from "./MonthCalendar";
import { TimeSlotGrid } from "./TimeSlotGrid";
import type { AvailableSlot, GetTenantOutput } from "./types";

type DateTimeSelectStepProps = {
  tenant: GetTenantOutput;
  menuId: string;
  staffId: string | null;
  onSelect: (date: string, startTime: string) => void;
  onBack: () => void;
};

export function DateTimeSelectStep({
  tenant,
  menuId,
  staffId,
  onSelect,
  onBack,
}: DateTimeSelectStepProps) {
  const [selectedDate, setSelectedDate] = useState("");
  const fetcher = useFetcher();

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
    fetcher.data?.intent === "loadSlots" && fetcher.data.data
      ? fetcher.data.data.slots
      : [];
  const isLoadingSlots = fetcher.state !== "idle";

  return (
    <div className="flex flex-col gap-10">
      <MonthCalendar
        regularHolidays={tenant.regularHolidays}
        temporaryHolidays={tenant.temporaryHolidays}
        bookingWindowDays={tenant.reservationSettings.bookingWindowDays}
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
      />

      {selectedDate && (
        <TimeSlotGrid
          slots={slots}
          selectedDate={selectedDate}
          isLoading={isLoadingSlots}
          onSelect={(startTime) => onSelect(selectedDate, startTime)}
        />
      )}

      <BottomActions onBack={onBack} />
    </div>
  );
}
