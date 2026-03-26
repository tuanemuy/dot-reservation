import type { ReactNode } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Select } from "@/components/ui/Select";
import type { AvailableSlot } from "@/core/application/reservation/getAvailableSlots";
import type { StaffProfileSummary } from "@/core/application/staff/listStaffProfiles";
import { DateSelector } from "./DateSelector";
import { EditTimeSlotSelector } from "./EditTimeSlotSelector";

type MenuOption = {
  id: string;
  name: string;
  duration: number;
  price: number;
};

type FieldMeta = {
  id?: string;
  name: string;
  errors?: string[];
};

type EditSelectStepProps = {
  menus: MenuOption[];
  staff: StaffProfileSummary[];
  slots: AvailableSlot[];
  dates: string[];
  selectedMenuId: string;
  selectedStaffProfileId: string;
  selectedDate: string;
  selectedStartTime: string;
  isLoadingSlots: boolean;
  canProceed: boolean;
  cancelLink: string;
  fields: {
    menuId: FieldMeta;
    staffProfileId: FieldMeta;
    date: FieldMeta;
    startTime: FieldMeta;
  };
  onMenuChange: (menuId: string) => void;
  onStaffChange: (staffProfileId: string) => void;
  onDateSelect: (dateStr: string) => void;
  onTimeSelect: (startTime: string) => void;
  onProceed: () => void;
  children?: ReactNode;
};

export function EditSelectStep({
  menus,
  staff,
  slots,
  dates,
  selectedMenuId,
  selectedStaffProfileId,
  selectedDate,
  selectedStartTime,
  isLoadingSlots,
  canProceed,
  cancelLink,
  fields,
  onMenuChange,
  onStaffChange,
  onDateSelect,
  onTimeSelect,
  onProceed,
}: EditSelectStepProps) {
  return (
    <>
      {/* Form Card */}
      <div className="mb-6 rounded-lg border border-neutral-300 bg-white p-8">
        <div className="flex flex-col gap-6">
          {/* Menu */}
          <FormField
            label="メニュー"
            htmlFor={fields.menuId.id}
            error={fields.menuId.errors}
            required
          >
            <Select
              id={fields.menuId.id}
              name={fields.menuId.name}
              value={selectedMenuId}
              onChange={(e) => onMenuChange(e.target.value)}
              error={fields.menuId.errors?.[0]}
            >
              {menus.map((menu) => (
                <option key={menu.id} value={menu.id}>
                  {menu.name} ({menu.duration}分 / {menu.price.toLocaleString()}
                  円)
                </option>
              ))}
            </Select>
          </FormField>

          {/* Staff */}
          <FormField label="担当スタッフ" htmlFor={fields.staffProfileId.id}>
            <Select
              id={fields.staffProfileId.id}
              name={fields.staffProfileId.name}
              value={selectedStaffProfileId}
              onChange={(e) => onStaffChange(e.target.value)}
            >
              <option value="">指名なし</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.displayName}
                </option>
              ))}
            </Select>
          </FormField>

          {/* Date */}
          <DateSelector
            dates={dates}
            selectedDate={selectedDate}
            onSelect={onDateSelect}
            error={fields.date.errors}
          />

          {/* Time */}
          {selectedDate && (
            <EditTimeSlotSelector
              slots={slots}
              selectedStartTime={selectedStartTime}
              isLoading={isLoadingSlots}
              onSelect={onTimeSelect}
              error={fields.startTime.errors}
            />
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex justify-end gap-4">
        <Link
          to={cancelLink}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-6 text-base font-medium text-neutral-700 no-underline"
        >
          キャンセル
        </Link>
        <Button
          type="button"
          variant="primary"
          size="md"
          disabled={!canProceed}
          onClick={onProceed}
          className="gap-2"
        >
          確認画面へ
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
              d="M8.25 4.5l7.5 7.5-7.5 7.5"
            />
          </svg>
        </Button>
      </div>
    </>
  );
}
