import { Link } from "react-router";
import type { StaffProfileSummary } from "@/core/application/staff/listStaffProfiles";
import { StaffAvatar } from "./StaffAvatar";

type StaffSectionProps = {
  staff: StaffProfileSummary[];
  urlPath: string;
  onSelectStaff: (staffId: string) => void;
};

export function StaffSection({
  staff,
  urlPath,
  onSelectStaff,
}: StaffSectionProps) {
  if (staff.length === 0) {
    return (
      <p className="py-8 text-center text-neutral-500">
        スタッフが登録されていません
      </p>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-baseline justify-between">
        <h2 className="font-heading text-xl font-semibold tracking-tight text-neutral-900">
          スタッフ
        </h2>
        <span className="text-sm font-normal text-neutral-500">
          {staff.length}名
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {staff.map((s) => (
          <div
            key={s.id}
            className="flex items-center gap-4 rounded-lg bg-neutral-100 p-6 transition-[background] duration-150 hover:bg-neutral-200"
          >
            <StaffAvatar
              displayName={s.displayName}
              imageUrl={s.imageUrl}
              size="md"
            />
            <div className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => onSelectStaff(s.id)}
                className="cursor-pointer border-none bg-transparent p-0 text-base font-medium text-neutral-900 hover:text-primary"
              >
                {s.displayName}
              </button>
            </div>
            <Link
              to={`/shop/${urlPath}/reserve?staffId=${s.id}`}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-md border border-primary bg-white px-4 font-body text-xs font-medium text-primary no-underline transition-[background,color] duration-150 hover:bg-primary hover:text-white active:scale-[0.99]"
            >
              指名予約
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
