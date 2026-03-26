import { useState } from "react";

type TemporaryHoliday = {
  date: string;
  reason: string | null;
};

type MonthCalendarProps = {
  regularHolidays: number[];
  temporaryHolidays: TemporaryHoliday[];
  bookingWindowDays: number;
  selectedDate: string;
  onDateSelect: (dateStr: string) => void;
};

const DOW = ["日", "月", "火", "水", "木", "金", "土"];

function getDowColorClass(i: number): string {
  if (i === 0) return "text-error";
  if (i === 6) return "text-info";
  return "";
}

function getDayCellClasses({
  isSelected,
  isDisabled,
  isToday,
  dayOfWeek,
}: {
  isSelected: boolean;
  isDisabled: boolean;
  isToday: boolean;
  dayOfWeek: number;
}): string {
  const base =
    "flex items-center justify-center border-2 border-transparent rounded-md font-heading text-base transition-[background,color] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary aspect-square";

  const weight = isSelected || isToday ? "font-semibold" : "font-normal";
  const cursor = isDisabled ? "cursor-not-allowed" : "cursor-pointer";

  let colorClasses: string;
  if (isSelected) {
    colorClasses = "bg-primary text-white";
  } else if (isDisabled) {
    colorClasses = "bg-transparent text-neutral-300";
  } else if (isToday) {
    colorClasses = "bg-transparent text-primary";
  } else if (dayOfWeek === 0) {
    colorClasses = "bg-transparent text-error";
  } else if (dayOfWeek === 6) {
    colorClasses = "bg-transparent text-info";
  } else {
    colorClasses = "bg-transparent text-neutral-800";
  }

  return `${base} ${weight} ${cursor} ${colorClasses}`;
}

export function MonthCalendar({
  regularHolidays,
  temporaryHolidays,
  bookingWindowDays,
  selectedDate,
  onDateSelect,
}: MonthCalendarProps) {
  const today = new Date();
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());

  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + bookingWindowDays);

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

  return (
    <div className="rounded-lg border border-neutral-300 bg-white p-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-heading text-xl font-semibold tracking-tight text-neutral-900">
          {monthLabel}
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prevMonth}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-neutral-300 bg-white text-neutral-600 transition-[border-color,background] duration-150 hover:border-neutral-400 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-neutral-300 bg-white text-neutral-600 transition-[border-color,background] duration-150 hover:border-neutral-400 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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

      <div className="grid grid-cols-7 gap-[2px]">
        {DOW.map((d, i) => (
          <div
            key={d}
            className={`py-2 text-center text-xs font-medium tracking-wide text-neutral-500 uppercase ${getDowColorClass(i)}`}
          >
            {d}
          </div>
        ))}

        {/* Empty cells */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => {
          const emptyKey = `empty-${calendarYear}-${calendarMonth}-${i}`;
          return <div key={emptyKey} className="aspect-square" />;
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
            regularHolidays.includes(dayOfWeek) ||
            temporaryHolidays.some(
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
                if (!isDisabled) onDateSelect(dateStr);
              }}
              className={getDayCellClasses({
                isSelected,
                isDisabled,
                isToday,
                dayOfWeek,
              })}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-6 border-t border-neutral-200 pt-4">
        <div className="flex items-center gap-1 text-xs text-neutral-500">
          <div className="h-2.5 w-2.5 rounded-full bg-primary" />
          選択中
        </div>
        <div className="flex items-center gap-1 text-xs text-neutral-500">
          <div className="h-2.5 w-2.5 rounded-full border border-primary-light bg-primary-lighter" />
          予約可
        </div>
        <div className="flex items-center gap-1 text-xs text-neutral-500">
          <div className="h-2.5 w-2.5 rounded-full bg-neutral-200" />
          休業日
        </div>
      </div>
    </div>
  );
}
