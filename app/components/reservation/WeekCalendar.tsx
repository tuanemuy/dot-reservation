import { Link } from "react-router";

const DAY_NAMES = ["月", "火", "水", "木", "金", "土", "日"] as const;

const HOUR_START = 8;
const HOUR_END = 22;
const SLOTS_PER_HOUR = 2;
const TOTAL_SLOTS = (HOUR_END - HOUR_START) * SLOTS_PER_HOUR;
const SLOT_HEIGHT_PX = 28;

type ReservationItem = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  customerName: string | null;
  menuName: string;
};

type WeekCalendarProps = {
  reservations: readonly ReservationItem[];
  weekStart: Date;
  onWeekChange: (newWeekStart: Date) => void;
  buildDetailPath: (reservationId: string) => string;
};

function formatDateShort(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}/${day}`;
}

function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonday(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayOfWeek = d.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  d.setDate(d.getDate() + diff);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() + days);
  return d;
}

function getWeekDates(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

function timeToSlotIndex(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours - HOUR_START) * SLOTS_PER_HOUR + Math.floor(minutes / 30);
}

function slotSpan(startTime: string, endTime: string): number {
  const startIndex = timeToSlotIndex(startTime);
  const endIndex = timeToSlotIndex(endTime);
  return Math.max(1, endIndex - startIndex);
}

function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

const statusColors: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  pending: {
    bg: "oklch(0.72 0.14 70 / 0.15)",
    border: "oklch(0.72 0.14 70 / 0.4)",
    text: "oklch(0.45 0.1 70)",
  },
  confirmed: {
    bg: "oklch(0.55 0.12 145 / 0.12)",
    border: "oklch(0.55 0.12 145 / 0.4)",
    text: "oklch(0.35 0.08 145)",
  },
  completed: {
    bg: "oklch(0.65 0.006 80 / 0.2)",
    border: "oklch(0.65 0.006 80 / 0.4)",
    text: "oklch(0.45 0.006 80)",
  },
  cancelled: {
    bg: "oklch(0.55 0.16 25 / 0.1)",
    border: "oklch(0.55 0.16 25 / 0.3)",
    text: "oklch(0.45 0.12 25)",
  },
  rejected: {
    bg: "oklch(0.55 0.16 25 / 0.1)",
    border: "oklch(0.55 0.16 25 / 0.3)",
    text: "oklch(0.45 0.12 25)",
  },
};

const defaultStatusColor = {
  bg: "oklch(0.65 0.006 80 / 0.2)",
  border: "oklch(0.65 0.006 80 / 0.4)",
  text: "oklch(0.45 0.006 80)",
};

function getStatusColor(status: string) {
  return statusColors[status] ?? defaultStatusColor;
}

function generateTimeLabels(): string[] {
  const labels: string[] = [];
  for (let hour = HOUR_START; hour < HOUR_END; hour++) {
    for (let half = 0; half < SLOTS_PER_HOUR; half++) {
      const minutes = half * 30;
      labels.push(
        `${String(hour).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
      );
    }
  }
  return labels;
}

type DayReservation = {
  reservation: ReservationItem;
  startSlot: number;
  span: number;
};

function groupReservationsByDay(
  reservations: readonly ReservationItem[],
  weekDates: Date[],
): Map<number, DayReservation[]> {
  const map = new Map<number, DayReservation[]>();
  for (let i = 0; i < 7; i++) {
    map.set(i, []);
  }

  const dateToIndex = new Map<string, number>();
  for (let i = 0; i < weekDates.length; i++) {
    dateToIndex.set(formatDateISO(weekDates[i]), i);
  }

  for (const reservation of reservations) {
    const dayIndex = dateToIndex.get(reservation.date);
    if (dayIndex === undefined) {
      continue;
    }

    const startSlot = timeToSlotIndex(reservation.startTime);
    const span = slotSpan(reservation.startTime, reservation.endTime);

    if (startSlot < 0 || startSlot >= TOTAL_SLOTS) {
      continue;
    }

    const items = map.get(dayIndex);
    if (items) {
      items.push({ reservation, startSlot, span });
    }
  }

  return map;
}

export function WeekCalendar({
  reservations,
  weekStart,
  onWeekChange,
  buildDetailPath,
}: WeekCalendarProps) {
  const weekDates = getWeekDates(weekStart);
  const sunday = weekDates[6];
  const timeLabels = generateTimeLabels();
  const reservationsByDay = groupReservationsByDay(reservations, weekDates);

  const weekRangeLabel = `${formatDateShort(weekStart)} (${DAY_NAMES[0]}) - ${formatDateShort(sunday)} (${DAY_NAMES[6]})`;

  function handlePrevWeek() {
    onWeekChange(addDays(weekStart, -7));
  }

  function handleNextWeek() {
    onWeekChange(addDays(weekStart, 7));
  }

  function handleToday() {
    onWeekChange(getMonday(new Date()));
  }

  return (
    <div>
      {/* Navigation */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevWeek}
            className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-200"
          >
            前の週
          </button>
          <button
            type="button"
            onClick={handleToday}
            className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-200"
          >
            今日
          </button>
          <button
            type="button"
            onClick={handleNextWeek}
            className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-200"
          >
            次の週
          </button>
        </div>
        <span className="text-sm font-medium text-neutral-700">
          {weekRangeLabel}
        </span>
      </div>

      {/* Calendar grid */}
      <div
        className="overflow-x-auto rounded-[var(--radius-lg)] border border-neutral-300 bg-white"
        style={{ minWidth: 0 }}
      >
        <div style={{ minWidth: "800px" }}>
          {/* Header row: day names */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "60px repeat(7, 1fr)",
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            {/* Empty corner cell */}
            <div
              style={{
                borderRight: "1px solid var(--color-border)",
                background: "var(--color-surface)",
              }}
            />
            {weekDates.map((date, i) => {
              const today = isToday(date);
              return (
                <div
                  key={formatDateISO(date)}
                  style={{
                    padding: "8px 4px",
                    textAlign: "center",
                    borderRight:
                      i < 6 ? "1px solid var(--color-border)" : "none",
                    background: today
                      ? "var(--color-primary-lighter)"
                      : "var(--color-surface)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "var(--text-xs)",
                      fontWeight: 500,
                      color: today
                        ? "var(--color-primary)"
                        : "var(--color-text-secondary)",
                    }}
                  >
                    {DAY_NAMES[i]}
                  </div>
                  <div
                    style={{
                      fontSize: "var(--text-sm)",
                      fontWeight: today ? 600 : 400,
                      color: today
                        ? "var(--color-primary)"
                        : "var(--color-text)",
                    }}
                  >
                    {formatDateShort(date)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time grid body */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "60px repeat(7, 1fr)",
              position: "relative",
            }}
          >
            {/* Time labels column */}
            <div style={{ borderRight: "1px solid var(--color-border)" }}>
              {timeLabels.map((label, slotIndex) => {
                const isHourMark = slotIndex % SLOTS_PER_HOUR === 0;
                return (
                  <div
                    key={label}
                    style={{
                      height: `${SLOT_HEIGHT_PX}px`,
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "flex-end",
                      paddingRight: "8px",
                      paddingTop: "0px",
                      fontSize: "var(--text-xs)",
                      color: isHourMark
                        ? "var(--color-text-secondary)"
                        : "transparent",
                      borderBottom: isHourMark
                        ? "1px solid var(--color-border)"
                        : "1px solid var(--color-surface-secondary)",
                      transform: "translateY(-6px)",
                    }}
                  >
                    {isHourMark ? label : ""}
                  </div>
                );
              })}
            </div>

            {/* Day columns */}
            {weekDates.map((date, dayIndex) => {
              const dayReservations = reservationsByDay.get(dayIndex) ?? [];
              const today = isToday(date);

              return (
                <div
                  key={formatDateISO(date)}
                  style={{
                    position: "relative",
                    borderRight:
                      dayIndex < 6 ? "1px solid var(--color-border)" : "none",
                    background: today
                      ? "oklch(0.96 0.02 155 / 0.3)"
                      : "transparent",
                  }}
                >
                  {/* Slot lines */}
                  {timeLabels.map((label, slotIndex) => {
                    const isHourMark = slotIndex % SLOTS_PER_HOUR === 0;
                    return (
                      <div
                        key={label}
                        style={{
                          height: `${SLOT_HEIGHT_PX}px`,
                          borderBottom: isHourMark
                            ? "1px solid var(--color-border)"
                            : "1px solid var(--color-surface-secondary)",
                        }}
                      />
                    );
                  })}

                  {/* Reservation blocks */}
                  {dayReservations.map(({ reservation, startSlot, span }) => {
                    const color = getStatusColor(reservation.status);
                    const topPx = startSlot * SLOT_HEIGHT_PX;
                    const heightPx = span * SLOT_HEIGHT_PX - 2;

                    return (
                      <Link
                        key={reservation.id}
                        to={buildDetailPath(reservation.id)}
                        style={{
                          position: "absolute",
                          top: `${topPx}px`,
                          left: "2px",
                          right: "2px",
                          height: `${heightPx}px`,
                          background: color.bg,
                          borderLeft: `3px solid ${color.border}`,
                          borderRadius: "var(--radius-sm)",
                          padding: "2px 4px",
                          overflow: "hidden",
                          textDecoration: "none",
                          cursor: "pointer",
                          zIndex: 1,
                          transition: "opacity var(--transition-default)",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.opacity =
                            "0.8";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.opacity = "1";
                        }}
                      >
                        <div
                          style={{
                            fontSize: "var(--text-xs)",
                            fontWeight: 500,
                            color: color.text,
                            lineHeight: 1.3,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {reservation.customerName ?? "-"}
                        </div>
                        {span >= 2 && (
                          <div
                            style={{
                              fontSize: "var(--text-xs)",
                              color: color.text,
                              opacity: 0.8,
                              lineHeight: 1.3,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {reservation.menuName}
                          </div>
                        )}
                        {span >= 3 && (
                          <div
                            style={{
                              fontSize: "var(--text-xs)",
                              color: color.text,
                              opacity: 0.7,
                              lineHeight: 1.3,
                            }}
                          >
                            {reservation.startTime}-{reservation.endTime}
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export { getMonday, addDays, formatDateISO };
export type { ReservationItem };
