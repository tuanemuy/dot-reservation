import type { AvailableSlot } from "@/core/application/reservation/getAvailableSlots";

type EditTimeSlotSelectorProps = {
  slots: AvailableSlot[];
  selectedStartTime: string;
  isLoading: boolean;
  onSelect: (startTime: string) => void;
  error?: string | string[];
};

export function EditTimeSlotSelector({
  slots,
  selectedStartTime,
  isLoading,
  onSelect,
  error,
}: EditTimeSlotSelectorProps) {
  const errorMessage = Array.isArray(error) ? error[0] : error;

  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-neutral-700">時間を選択</h3>
      {isLoading ? (
        <p className="py-4 text-center text-neutral-500">空き時間を確認中...</p>
      ) : slots.length === 0 ? (
        <p className="py-4 text-center text-neutral-500">
          この日に空きはありません
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {slots.map((slot) => {
            const isSelected = selectedStartTime === slot.startTime;
            return (
              <button
                key={slot.startTime}
                type="button"
                disabled={!slot.available}
                onClick={() => onSelect(slot.startTime)}
                className={`rounded-md border px-4 py-2 text-sm transition-all duration-150 ${
                  isSelected
                    ? "border-primary bg-primary-lighter text-primary"
                    : slot.available
                      ? "border-neutral-300 bg-white text-neutral-700"
                      : "border-neutral-300 bg-neutral-100 text-neutral-400 line-through"
                } ${slot.available ? "cursor-pointer" : "cursor-not-allowed"}`}
              >
                {slot.startTime}
              </button>
            );
          })}
        </div>
      )}
      {errorMessage && (
        <p className="mt-1 text-sm text-error">{errorMessage}</p>
      )}
    </div>
  );
}
