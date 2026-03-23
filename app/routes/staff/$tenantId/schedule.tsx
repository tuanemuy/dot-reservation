import { useState } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
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

function formatDateLabel(dateStr: string): string {
  const [_year, month, day] = dateStr.split("-");
  const d = new Date(
    Number.parseInt(dateStr.split("-")[0], 10),
    Number.parseInt(month, 10) - 1,
    Number.parseInt(day, 10),
  );
  const dayNames = ["日", "月", "火", "水", "木", "金", "土"];
  return `${Number.parseInt(month, 10)}/${Number.parseInt(day, 10)}(${dayNames[d.getDay()]})`;
}

const viewTabs = [
  { id: "week", label: "週表示" },
  { id: "month", label: "月表示" },
];

export async function loader({ params, request }: Route.LoaderArgs) {
  const { container } = await import("@/core/di/server");
  const tenantId = params.tenantId;

  const now = new Date();
  const weekRange = getWeekRange(now);
  const monthRange = getMonthRange(now);

  // Use the wider range to cover both views
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
    monthRange,
  };
}

export default function StaffSchedulePage({
  loaderData,
}: Route.ComponentProps) {
  const { shifts, reservations, weekRange } = loaderData;
  const [viewMode, setViewMode] = useState("week");

  // Generate week days from weekRange
  const weekDays: string[] = [];
  const startParts = weekRange.start.split("-").map(Number);
  const weekStart = new Date(startParts[0], startParts[1] - 1, startParts[2]);
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    weekDays.push(formatDate(d));
  }

  const today = formatDate(new Date());

  // Hours for the time grid (7:00 - 21:00)
  const hours = Array.from({ length: 15 }, (_, i) => i + 7);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text">スケジュール</h1>
        <Link to="../shift-requests">
          <Button variant="outline" size="sm">
            シフト希望提出
          </Button>
        </Link>
      </div>

      <Tabs tabs={viewTabs} activeTab={viewMode} onTabChange={setViewMode}>
        {viewMode === "week" ? (
          <Card>
            <CardBody className="overflow-x-auto p-0">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="w-16 border-b border-r border-border bg-surface-secondary px-2 py-2 text-xs font-medium text-text-secondary">
                      時間
                    </th>
                    {weekDays.map((day) => (
                      <th
                        key={day}
                        className={`border-b border-r border-border px-2 py-2 text-center text-xs font-medium last:border-r-0 ${
                          day === today
                            ? "bg-primary/5 text-primary"
                            : "bg-surface-secondary text-text-secondary"
                        }`}
                      >
                        {formatDateLabel(day)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hours.map((hour) => (
                    <tr key={hour}>
                      <td className="border-b border-r border-border px-2 py-3 text-center text-xs text-text-muted">
                        {String(hour).padStart(2, "0")}:00
                      </td>
                      {weekDays.map((day) => {
                        const dayShifts = shifts.filter((s) => s.date === day);
                        const dayReservations = reservations.filter(
                          (r) => r.date === day,
                        );

                        const hourStr = `${String(hour).padStart(2, "0")}:00`;
                        const isInShift = dayShifts.some(
                          (s) => s.startTime <= hourStr && s.endTime > hourStr,
                        );
                        const hourReservation = dayReservations.find(
                          (r) => r.startTime <= hourStr && r.endTime > hourStr,
                        );

                        return (
                          <td
                            key={`${day}-${hour}`}
                            className={`relative border-b border-r border-border px-1 py-1 last:border-r-0 ${
                              day === today ? "bg-primary/5" : ""
                            } ${isInShift ? "bg-primary/10" : ""}`}
                          >
                            {hourReservation && (
                              <div className="rounded bg-primary/20 px-1 py-0.5 text-xs text-primary-dark">
                                <span className="font-medium">
                                  {hourReservation.customerName ?? "予約"}
                                </span>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardBody>
              <div className="grid grid-cols-7 gap-px bg-border">
                {["月", "火", "水", "木", "金", "土", "日"].map((dayName) => (
                  <div
                    key={dayName}
                    className="bg-surface-secondary px-2 py-1.5 text-center text-xs font-medium text-text-secondary"
                  >
                    {dayName}
                  </div>
                ))}

                {/* Month calendar cells would go here */}
                {Array.from({ length: 35 }, (_, i) => {
                  const monthStart = new Date();
                  monthStart.setDate(1);
                  const startDay = (monthStart.getDay() + 6) % 7;
                  const cellDate = new Date(monthStart);
                  cellDate.setDate(1 - startDay + i);
                  const cellDateStr = formatDate(cellDate);
                  const isCurrentMonth =
                    cellDate.getMonth() === new Date().getMonth();
                  const dayShifts = shifts.filter(
                    (s) => s.date === cellDateStr,
                  );
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
            </CardBody>
          </Card>
        )}
      </Tabs>
    </div>
  );
}
