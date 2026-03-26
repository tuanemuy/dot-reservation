import { Button } from "@/components/ui/Button";

type BottomActionsProps = {
  onBack: () => void;
};

export function BottomActions({ onBack }: BottomActionsProps) {
  return (
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
    </div>
  );
}
