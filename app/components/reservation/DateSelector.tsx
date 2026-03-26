type DateSelectorProps = {
  dates: string[];
  selectedDate: string;
  onSelect: (dateStr: string) => void;
  error?: string | string[];
};

const DAY_SHORT = ["日", "月", "火", "水", "木", "金", "土"];

export function DateSelector({
  dates,
  selectedDate,
  onSelect,
  error,
}: DateSelectorProps) {
  const errorMessage = Array.isArray(error) ? error[0] : error;

  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-neutral-700">日付を選択</h3>
      <div className="flex flex-wrap gap-2">
        {dates.map((dateStr) => {
          const d = new Date(dateStr);
          const dayLabel = DAY_SHORT[d.getDay()];
          const isSelected = selectedDate === dateStr;
          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onSelect(dateStr)}
              className={`flex cursor-pointer flex-col items-center rounded-md px-4 py-2 text-sm transition-all duration-150 ${
                isSelected
                  ? "border border-primary bg-primary-lighter text-primary"
                  : "border border-neutral-300 bg-white text-neutral-700"
              }`}
            >
              <span className="text-xs text-neutral-500">{dayLabel}</span>
              <span className="font-medium">{d.getDate()}</span>
              <span className="text-xs text-neutral-500">
                {d.getMonth() + 1}月
              </span>
            </button>
          );
        })}
      </div>
      {errorMessage && (
        <p className="mt-1 text-sm text-error">{errorMessage}</p>
      )}
    </div>
  );
}
