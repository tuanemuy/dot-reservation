import { PriceDisplay } from "./PriceDisplay";
import { SummaryItem } from "./SummaryItem";
import type { MenuDetail, ReservationState } from "./types";

type ReservationSummaryProps = {
  tenantName: string;
  selectedMenu: MenuDetail | undefined;
  reservation: ReservationState;
};

export function ReservationSummary({
  tenantName,
  selectedMenu,
  reservation,
}: ReservationSummaryProps) {
  return (
    <aside className="sticky top-[88px]">
      <div className="overflow-hidden rounded-lg border border-neutral-300 bg-white">
        <div className="bg-primary-lighter px-8 py-6">
          <h3 className="font-heading text-lg font-semibold tracking-tight text-neutral-900">
            予約内容
          </h3>
        </div>
        <div className="flex flex-col gap-6 p-8">
          <SummaryItem label="店舗" value={tenantName} />

          {selectedMenu && (
            <>
              <div className="h-px bg-neutral-200" />
              <SummaryItem
                label="メニュー"
                value={`${selectedMenu.name} ${selectedMenu.duration}分`}
              />
            </>
          )}

          {reservation.staffId !== null &&
            reservation.staffId !== undefined && (
              <>
                <div className="h-px bg-neutral-200" />
                <SummaryItem
                  label="スタッフ"
                  value={reservation.staffId ? "指名あり" : "指名なし"}
                />
              </>
            )}

          {reservation.date && reservation.startTime && (
            <>
              <div className="h-px bg-neutral-200" />
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
                  日時
                </span>
                <span className="flex items-center gap-2 text-base font-medium text-primary">
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                  >
                    <title>日時</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                    />
                  </svg>
                  {new Date(reservation.date).toLocaleDateString("ja-JP")}{" "}
                  {reservation.startTime}
                </span>
              </div>
            </>
          )}

          {selectedMenu && (
            <>
              <div className="h-px bg-neutral-200" />
              <PriceDisplay price={selectedMenu.price} />
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
