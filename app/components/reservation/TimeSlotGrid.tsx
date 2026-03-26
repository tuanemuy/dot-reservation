import type { AvailableSlot } from "./types";

type TimeSlotGridProps = {
  slots: AvailableSlot[];
  selectedDate: string;
  isLoading: boolean;
  onSelect: (startTime: string) => void;
};

export function TimeSlotGrid({
  slots,
  selectedDate,
  isLoading,
  onSelect,
}: TimeSlotGridProps) {
  return (
    <div className="rounded-lg border border-neutral-300 bg-white p-8">
      <div className="mb-6 flex items-baseline justify-between">
        <h2 className="font-heading text-xl font-semibold tracking-tight text-neutral-900">
          時間を選択
        </h2>
        <span className="text-sm text-neutral-500">
          {new Date(selectedDate).toLocaleDateString("ja-JP", {
            month: "long",
            day: "numeric",
            weekday: "short",
          })}
        </span>
      </div>

      {isLoading ? (
        <p className="py-4 text-center text-neutral-500">空き時間を確認中...</p>
      ) : slots.length === 0 ? (
        <p className="py-4 text-center text-neutral-500">
          この日に空きはありません
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {slots.map((slot) => (
            <button
              key={slot.startTime}
              type="button"
              disabled={!slot.available}
              onClick={() => {
                if (slot.available) onSelect(slot.startTime);
              }}
              className={`flex h-11 cursor-pointer items-center justify-center rounded-md border font-heading text-sm font-medium transition-[border-color,background,color] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                !slot.available
                  ? "cursor-not-allowed border-neutral-200 bg-neutral-100 text-neutral-300"
                  : "border-neutral-300 bg-white text-neutral-700 hover:border-primary hover:bg-primary-lighter hover:text-primary-dark"
              }`}
            >
              {slot.startTime}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
