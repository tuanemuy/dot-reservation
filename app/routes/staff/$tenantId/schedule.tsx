import { useState } from "react";
import { Link, useParams } from "react-router";
import type { ReservationSummary } from "@/core/application/reservation/listReservations";
import { listReservations } from "@/core/application/reservation/listReservations";
import type { ShiftDetail } from "@/core/application/shift/listShifts";
import { listShifts } from "@/core/application/shift/listShifts";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/schedule";

function getWeekRange(baseDate: Date): { start: string; end: string } {
  const day = baseDate.getDay();
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() - ((day + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    start: formatDate(monday),
    end: formatDate(sunday),
  };
}

function getMonthRange(baseDate: Date): { start: string; end: string } {
  const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  const end = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
  return {
    start: formatDate(start),
    end: formatDate(end),
  };
}

function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const dayNames = ["日", "月", "火", "水", "木", "金", "土"];

function formatWeekHeaderDate(dateStr: string): { day: string; date: number } {
  const parts = dateStr.split("-").map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return {
    day: dayNames[d.getDay()],
    date: d.getDate(),
  };
}

function formatWeekPeriod(start: string, end: string): string {
  const s = start.split("-").map(Number);
  const e = end.split("-").map(Number);
  return `${s[0]}年${s[1]}月${s[2]}日 - ${e[1]}月${e[2]}日`;
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { container } = await import("@/core/di/server");
  const tenantId = params.tenantId;

  const now = new Date();
  const weekRange = getWeekRange(now);
  const monthRange = getMonthRange(now);

  const startDate =
    weekRange.start < monthRange.start ? weekRange.start : monthRange.start;
  const endDate =
    weekRange.end > monthRange.end ? weekRange.end : monthRange.end;

  const shiftsResult = await handleUseCase(() =>
    listShifts({
      container,
      headers: request.headers,
      input: {
        tenantId,
        startDate,
        endDate,
        staffProfileId: null,
      },
    }),
  ).match(
    (result) => result.items,
    () => [] as ShiftDetail[],
  );

  const reservationsResult = await handleUseCase(() =>
    listReservations({
      container,
      headers: request.headers,
      input: {
        tenantId,
        status: null,
        startDate,
        endDate,
        page: 1,
        limit: 200,
      },
    }),
  ).match(
    (result) => result.items,
    () => [] as ReservationSummary[],
  );

  return {
    shifts: shiftsResult,
    reservations: reservationsResult,
    weekRange,
  };
}

export default function StaffSchedulePage({
  loaderData,
}: Route.ComponentProps) {
  const { shifts, reservations, weekRange } = loaderData;
  const { tenantId } = useParams();
  const [viewMode, setViewMode] = useState<"week" | "month">("week");

  const weekDays: string[] = [];
  const startParts = weekRange.start.split("-").map(Number);
  const weekStart = new Date(startParts[0], startParts[1] - 1, startParts[2]);
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    weekDays.push(formatDate(d));
  }

  const today = formatDate(new Date());

  const hours = Array.from({ length: 12 }, (_, i) => i + 8);

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-neutral-900">
            スケジュール
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            シフトと予約のスケジュールを確認できます
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to={`/staff/${tenantId}/shift-requests`}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary no-underline transition-colors duration-150 hover:text-primary-dark"
          >
            <svg
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
            シフト希望を提出
          </Link>
          <div className="inline-flex overflow-hidden rounded-[10px] border border-border">
            <button
              type="button"
              onClick={() => setViewMode("week")}
              className={`border-none px-4 py-2 font-body text-sm font-medium transition-colors duration-150 ${
                viewMode === "week"
                  ? "bg-primary text-white"
                  : "bg-white text-text-secondary hover:bg-surface-secondary"
              }`}
            >
              週
            </button>
            <button
              type="button"
              onClick={() => setViewMode("month")}
              className={`border-l border-border px-4 py-2 font-body text-sm font-medium transition-colors duration-150 ${
                viewMode === "month"
                  ? "bg-primary text-white"
                  : "bg-white text-text-secondary hover:bg-surface-secondary"
              }`}
            >
              月
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-heading text-lg font-semibold tracking-tight text-text">
            {formatWeekPeriod(weekRange.start, weekRange.end)}
          </span>
        </div>
      </div>

      {viewMode === "week" ? (
        <div className="overflow-hidden rounded-[14px] border border-border bg-white">
          {/* Weekly Header */}
          <div className="grid grid-cols-[50px_repeat(7,1fr)] border-b border-border">
            <div className="border-r border-border" />
            {weekDays.map((day) => {
              const info = formatWeekHeaderDate(day);
              const isToday = day === today;
              return (
                <div
                  key={day}
                  className={`px-1 py-2 text-center text-xs font-medium ${isToday ? "text-primary" : "text-text-muted"}`}
                >
                  {info.day}
                  <span
                    className={`mt-0.5 block font-heading text-lg font-semibold tracking-tight ${
                      isToday
                        ? "mx-auto inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary-lighter text-primary"
                        : "text-text"
                    }`}
                  >
                    {info.date}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Weekly Body */}
          <div className="grid grid-cols-[50px_repeat(7,1fr)]">
            {/* Time Column */}
            <div className="border-r border-border">
              {hours.map((hour, i) => (
                <div
                  key={hour}
                  className={`flex h-12 items-start justify-end pr-2 pt-0.5 text-xs font-medium text-text-muted ${i > 0 ? "border-t border-surface-secondary" : ""}`}
                >
                  {String(hour).padStart(2, "0")}:00
                </div>
              ))}
            </div>

            {/* Day Columns */}
            {weekDays.map((day) => {
              const dayShifts = shifts.filter((s) => s.date === day);
              const dayReservations = reservations.filter(
                (r) => r.date === day,
              );

              return (
                <div
                  key={day}
                  className="relative border-r border-surface-secondary last:border-r-0"
                >
                  {hours.map((hour, i) => (
                    <div
                      key={`${day}-${hour}`}
                      className={`h-12 ${i > 0 ? "border-t border-surface-secondary" : ""}`}
                    />
                  ))}

                  {/* Shift blocks */}
                  {dayShifts.map((shift) => {
                    const startHour =
                      Number.parseInt(shift.startTime.split(":")[0], 10) - 8;
                    const startMin = Number.parseInt(
                      shift.startTime.split(":")[1],
                      10,
                    );
                    const endHour =
                      Number.parseInt(shift.endTime.split(":")[0], 10) - 8;
                    const endMin = Number.parseInt(
                      shift.endTime.split(":")[1],
                      10,
                    );
                    const top = (startHour * 60 + startMin) * (48 / 60);
                    const height =
                      ((endHour - startHour) * 60 + (endMin - startMin)) *
                      (48 / 60);

                    return (
                      <div
                        key={shift.id}
                        className="absolute left-0.5 right-0.5 rounded-[6px] bg-primary-lighter"
                        style={{ top: `${top}px`, height: `${height}px` }}
                      />
                    );
                  })}

                  {/* Reservation blocks */}
                  {dayReservations.map((res) => {
                    const startHour =
                      Number.parseInt(res.startTime.split(":")[0], 10) - 8;
                    const startMin = Number.parseInt(
                      res.startTime.split(":")[1],
                      10,
                    );
                    const endHour =
                      Number.parseInt(res.endTime.split(":")[0], 10) - 8;
                    const endMin = Number.parseInt(
                      res.endTime.split(":")[1],
                      10,
                    );
                    const top = (startHour * 60 + startMin) * (48 / 60);
                    const height =
                      ((endHour - startHour) * 60 + (endMin - startMin)) *
                      (48 / 60);

                    return (
                      <Link
                        key={res.id}
                        to={`/staff/${tenantId}/reservations/${res.id}`}
                        className="absolute left-1 right-1 z-10 overflow-hidden rounded-[6px] border border-border bg-white px-1 py-0.5 text-xs no-underline transition-all duration-150 hover:border-primary-light hover:shadow-sm"
                        style={{ top: `${top}px`, height: `${height}px` }}
                      >
                        <span className="block overflow-hidden text-ellipsis whitespace-nowrap font-medium text-text">
                          {res.customerName ?? "予約"}
                        </span>
                        <span className="block overflow-hidden text-ellipsis whitespace-nowrap text-text-muted">
                          {res.menuName}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[14px] border border-border bg-white">
          <div className="grid grid-cols-7 gap-px bg-border">
            {["月", "火", "水", "木", "金", "土", "日"].map((d) => (
              <div
                key={d}
                className="bg-surface-secondary px-2 py-1.5 text-center text-xs font-medium text-text-secondary"
              >
                {d}
              </div>
            ))}

            {Array.from({ length: 35 }, (_, i) => {
              const monthStart = new Date();
              monthStart.setDate(1);
              const startDay = (monthStart.getDay() + 6) % 7;
              const cellDate = new Date(monthStart);
              cellDate.setDate(1 - startDay + i);
              const cellDateStr = formatDate(cellDate);
              const isCurrentMonth =
                cellDate.getMonth() === new Date().getMonth();
              const dayShifts = shifts.filter((s) => s.date === cellDateStr);
              const dayReservations = reservations.filter(
                (r) => r.date === cellDateStr,
              );

              return (
                <div
                  key={`month-${cellDateStr}`}
                  className={`min-h-16 bg-white p-1.5 ${
                    !isCurrentMonth ? "opacity-40" : ""
                  } ${cellDateStr === today ? "ring-1 ring-inset ring-primary" : ""}`}
                >
                  <span className="text-xs text-text-secondary">
                    {cellDate.getDate()}
                  </span>
                  {dayShifts.length > 0 && (
                    <div className="mt-0.5 text-xs text-primary">
                      {dayShifts[0].startTime}-{dayShifts[0].endTime}
                    </div>
                  )}
                  {dayReservations.length > 0 && (
                    <div className="mt-0.5 text-xs text-text-muted">
                      予約 {dayReservations.length}件
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
