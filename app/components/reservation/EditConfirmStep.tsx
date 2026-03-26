import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { ComparisonCard } from "./ComparisonCard";

type ComparisonRow = {
  label: string;
  before: string;
  after: string;
  changed: boolean;
};

type EditConfirmStepProps = {
  rows: ComparisonRow[];
  submitForm: ReactNode;
  formErrors?: string[];
  isPending: boolean;
  onBack: () => void;
};

export function EditConfirmStep({
  rows,
  submitForm,
  formErrors,
  isPending,
  onBack,
}: EditConfirmStepProps) {
  return (
    <>
      <InfoBanner />

      <ComparisonCard rows={rows} />

      <div className="mt-6 flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isPending}
          className="gap-2"
        >
          <svg
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-4 w-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
          戻る
        </Button>
        {submitForm}
      </div>
      {formErrors && formErrors.length > 0 && (
        <div className="mt-4 text-right">
          {formErrors.map((error) => (
            <p key={error} className="text-sm text-error">
              {error}
            </p>
          ))}
        </div>
      )}
    </>
  );
}

function InfoBanner() {
  return (
    <div className="mb-8 flex items-start gap-2 rounded-md bg-[var(--color-info-bg)] px-6 py-4 text-sm leading-normal text-info">
      <svg
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="mt-[2px] h-[18px] w-[18px] shrink-0"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
        />
      </svg>
      <span>
        変更内容をご確認の上、「変更を確定する」ボタンを押してください。変更後、店舗の承認が必要な場合があります。
      </span>
    </div>
  );
}
