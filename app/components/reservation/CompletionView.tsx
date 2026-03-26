import { Link } from "react-router";
import { formatDateJa } from "@/presentation/date";
import { PriceDisplay } from "./PriceDisplay";
import { SummaryItem } from "./SummaryItem";
import type { GetTenantOutput, MenuDetail, ReservationState } from "./types";

type CompletionViewProps = {
  tenant: GetTenantOutput;
  selectedMenu: MenuDetail | undefined;
  reservation: ReservationState;
  reservationResult: { id: string; status: string };
};

export function CompletionView({
  tenant,
  selectedMenu,
  reservation,
  reservationResult,
}: CompletionViewProps) {
  return (
    <div className="mx-auto max-w-[640px] px-10 py-20 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-success-bg)]">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-success)"
          strokeWidth="2"
        >
          <title>完了</title>
          <path
            d="M20 6L9 17l-5-5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h1 className="mb-2 font-heading text-2xl font-semibold text-neutral-900">
        {reservationResult.status === "confirmed"
          ? "予約が確定しました"
          : "予約リクエストを送信しました"}
      </h1>
      <p className="mb-8 text-base text-neutral-600">
        {reservationResult.status === "confirmed"
          ? "ご予約ありがとうございます。"
          : "店舗の承認後、予約が確定します。"}
      </p>

      {/* Summary card */}
      <div className="mb-8 overflow-hidden rounded-lg border border-neutral-300 bg-white text-left">
        <div className="bg-primary-lighter px-8 py-6">
          <h3 className="font-heading text-lg font-semibold tracking-tight text-neutral-900">
            予約内容
          </h3>
        </div>
        <div className="flex flex-col gap-6 p-8">
          <SummaryItem label="店舗" value={tenant.name} />
          {selectedMenu && (
            <>
              <div className="h-px bg-neutral-200" />
              <SummaryItem
                label="メニュー"
                value={`${selectedMenu.name} ${selectedMenu.duration}分`}
              />
            </>
          )}
          {reservation.date && (
            <>
              <div className="h-px bg-neutral-200" />
              <SummaryItem
                label="日時"
                value={`${formatDateJa(reservation.date)} ${reservation.startTime}`}
              />
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

      <div className="flex justify-center gap-4">
        <Link
          to={`/shop/${tenant.urlPath}`}
          className="inline-flex h-12 items-center justify-center rounded-md border border-neutral-300 bg-white px-8 text-base font-medium text-neutral-700 no-underline transition-[border-color,background] duration-150 hover:border-neutral-400 hover:bg-neutral-100"
        >
          店舗ページに戻る
        </Link>
        <Link
          to="/mypage/reservations"
          className="inline-flex h-12 items-center justify-center rounded-md border-none bg-primary px-8 text-base font-medium text-white no-underline transition-[background] duration-150 hover:bg-primary-dark"
        >
          予約一覧を確認
        </Link>
      </div>
    </div>
  );
}
