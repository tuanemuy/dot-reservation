import { useEffect } from "react";
import { useFetcher } from "react-router";
import { BottomActions } from "./BottomActions";
import type { StaffProfileSummary } from "./types";

type StaffSelectStepProps = {
  menuId: string;
  selectedStaffId: string | null;
  onSelect: (staffId: string | null) => void;
  onBack: () => void;
};

export function StaffSelectStep({
  menuId,
  selectedStaffId,
  onSelect,
  onBack,
}: StaffSelectStepProps) {
  const fetcher = useFetcher();
  const fetcherSubmit = fetcher.submit;

  useEffect(() => {
    fetcherSubmit({ intent: "loadStaff", menuId }, { method: "post" });
  }, [menuId, fetcherSubmit]);

  const staff: StaffProfileSummary[] =
    fetcher.data?.intent === "loadStaff" && fetcher.data.data
      ? fetcher.data.data.staff
      : [];
  const isLoading = fetcher.state !== "idle";

  return (
    <div>
      {isLoading ? (
        <p className="py-8 text-center text-neutral-500">読み込み中...</p>
      ) : (
        <div className="flex flex-col gap-4">
          {/* No preference */}
          <button
            type="button"
            className={`flex cursor-pointer items-center gap-4 rounded-lg border bg-white px-8 py-6 transition-[border-color,box-shadow] duration-150 hover:border-neutral-400 hover:shadow-sm ${
              selectedStaffId === null ? "border-primary" : "border-neutral-300"
            }`}
            onClick={() => onSelect(null)}
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-base font-medium text-neutral-500">
              -
            </div>
            <span className="text-base font-medium text-neutral-900">
              指名なし
            </span>
          </button>

          {staff.map((s) => (
            <button
              type="button"
              key={s.id}
              className={`flex cursor-pointer items-center gap-4 rounded-lg border bg-white px-8 py-6 transition-[border-color,box-shadow] duration-150 hover:border-neutral-400 hover:shadow-sm ${
                selectedStaffId === s.id
                  ? "border-primary"
                  : "border-neutral-300"
              }`}
              onClick={() => onSelect(s.id)}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(135deg,var(--color-secondary-lighter),var(--color-secondary-light))] text-lg font-medium text-secondary">
                {s.imageUrl ? (
                  <img
                    src={s.imageUrl}
                    alt={s.displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  s.displayName.charAt(0)
                )}
              </div>
              <span className="text-base font-medium text-neutral-900">
                {s.displayName}
              </span>
            </button>
          ))}
        </div>
      )}

      <BottomActions onBack={onBack} />
    </div>
  );
}
