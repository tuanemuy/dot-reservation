import { useEffect, useRef, useState } from "react";
import { Link, useFetcher } from "react-router";
import { Button } from "@/components/ui/Button";
import type { ReservationState } from "./types";

type ConfirmStepProps = {
  reservation: ReservationState;
  onBack: () => void;
  onComplete: (result: { id: string; status: string }) => void;
};

export function ConfirmStep({
  reservation,
  onBack,
  onComplete,
}: ConfirmStepProps) {
  const fetcher = useFetcher();
  const [note, setNote] = useState(reservation.note);
  const [loginRequired, setLoginRequired] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (fetcher.data?.intent === "createReservation" && fetcher.data.data) {
      const result = fetcher.data.data;
      if (result.needsLogin) {
        setLoginRequired(true);
      } else if (result.id) {
        onCompleteRef.current({
          id: result.id,
          status: result.status,
        });
      }
    }
  }, [fetcher.data]);

  function handleSubmit() {
    fetcher.submit(
      {
        intent: "createReservation",
        menuId: reservation.menuId || "",
        staffId: reservation.staffId || "",
        date: reservation.date || "",
        startTime: reservation.startTime || "",
        note: note,
      },
      { method: "post" },
    );
  }

  const isSubmitting = fetcher.state !== "idle";

  return (
    <div>
      {/* Note */}
      <div className="mb-8">
        <label
          htmlFor="note"
          className="mb-2 block text-sm font-medium text-neutral-800"
        >
          備考（任意）
        </label>
        <textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="w-full resize-y rounded-md border border-neutral-300 bg-white p-4 font-body text-base text-neutral-800 placeholder:text-neutral-400 focus:border-primary focus:outline-none"
          placeholder="ご要望やご質問がありましたらご記入ください"
        />
      </div>

      {loginRequired && (
        <div className="mb-8 rounded-md border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] p-6">
          <p className="mb-4 text-sm font-medium text-neutral-800">
            予約するにはログインが必要です
          </p>
          <div className="flex gap-4">
            <Link
              to="/customer/login"
              className="inline-flex h-10 items-center justify-center rounded-md border-none bg-primary px-6 text-sm font-medium text-white no-underline transition-[background] duration-150 hover:bg-primary-dark"
            >
              ログイン
            </Link>
            <Link
              to="/customer/register"
              className="inline-flex h-10 items-center justify-center rounded-md border border-neutral-300 bg-white px-6 text-sm font-medium text-neutral-700 no-underline transition-[border-color,background] duration-150 hover:border-neutral-400 hover:bg-neutral-100"
            >
              新規登録
            </Link>
          </div>
        </div>
      )}

      {fetcher.data?.intent === "createReservation" &&
        fetcher.data.data?.error &&
        !fetcher.data.data?.needsLogin && (
          <div className="mb-8 rounded-md border border-[var(--color-error-border)] bg-[var(--color-error-bg)] p-6">
            <p className="text-sm text-error">{fetcher.data.data?.error}</p>
          </div>
        )}

      {/* Actions */}
      <div className="mt-8 flex items-center justify-between border-t border-neutral-300 pt-8">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onBack}
          className="gap-2"
        >
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <title>戻る</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
          戻る
        </Button>
        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="gap-2 px-10"
        >
          {isSubmitting ? "送信中..." : "予約を確定する"}
        </Button>
      </div>
    </div>
  );
}
