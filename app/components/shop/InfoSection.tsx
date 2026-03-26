import type { GetTenantOutput } from "@/core/application/tenant/getTenant";

const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

type InfoSectionProps = {
  tenant: GetTenantOutput;
};

export function InfoSection({ tenant }: InfoSectionProps) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="mb-4 text-lg font-medium text-neutral-900">営業時間</h3>
        <div className="flex flex-col gap-1">
          {DAY_LABELS.map((dayLabel, dayIndex) => {
            const hours = tenant.businessHours[dayIndex];
            const isHoliday = tenant.regularHolidays.includes(dayIndex);
            return (
              <div key={dayLabel} className="flex gap-6 text-sm">
                <span className="w-8 font-medium text-neutral-800">
                  {dayLabel}
                </span>
                <span className="text-neutral-600">
                  {isHoliday
                    ? "定休日"
                    : hours
                      ? `${hours.open} - ${hours.close}`
                      : "休業"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {tenant.temporaryHolidays.length > 0 && (
        <div>
          <h3 className="mb-4 text-lg font-medium text-neutral-900">
            臨時休業日
          </h3>
          <div className="flex flex-col gap-1">
            {tenant.temporaryHolidays.map((holiday) => (
              <div key={holiday.date} className="text-sm text-neutral-600">
                {new Date(holiday.date).toLocaleDateString("ja-JP")}
                {holiday.reason && ` - ${holiday.reason}`}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
