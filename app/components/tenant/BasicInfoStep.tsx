import type { FieldMetadata } from "@conform-to/react";
import { getInputProps } from "@conform-to/react";
import { categoryOptions } from "./constants";
import { inputClass, labelClass } from "./styles";
import { UrlPathField } from "./UrlPathField";

type BasicInfoStepProps = {
  fields: {
    name: FieldMetadata<string>;
    category: FieldMetadata<string>;
    urlPath: FieldMetadata<string>;
  };
  urlPathStatus: "idle" | "checking" | "available" | "taken";
  onUrlPathChange: (value: string) => void;
  getFieldErrors: (fieldName: string) => string[] | undefined;
};

export function BasicInfoStep({
  fields,
  urlPathStatus,
  onUrlPathChange,
  getFieldErrors,
}: BasicInfoStepProps) {
  return (
    <div className="rounded-lg border border-neutral-300 bg-white p-10">
      <h2 className="mb-6 border-b border-neutral-200 pb-6 font-heading text-xl font-semibold tracking-tight text-neutral-800">
        基本情報
      </h2>

      <div className="space-y-6">
        <div>
          <label htmlFor={fields.name.id} className={labelClass}>
            テナント名
            <span className="ml-1 text-xs font-medium text-error">必須</span>
          </label>
          <input
            {...getInputProps(fields.name, { type: "text" })}
            placeholder="例: リラクゼーションサロン Calm"
            className={inputClass}
          />
          {getFieldErrors("name") && (
            <p className="mt-1 text-xs text-error">{getFieldErrors("name")}</p>
          )}
        </div>

        <div>
          <label htmlFor={fields.category.id} className={labelClass}>
            カテゴリー
            <span className="ml-1 text-xs font-medium text-error">必須</span>
          </label>
          <select
            {...getInputProps(fields.category, { type: "text" })}
            className={`${inputClass} cursor-pointer appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='2' stroke='%23B8B5B1'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5' /%3E%3C/svg%3E")] bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-10`}
          >
            <option value="" disabled>
              カテゴリーを選択
            </option>
            {categoryOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {getFieldErrors("category") && (
            <p className="mt-1 text-xs text-error">
              {getFieldErrors("category")}
            </p>
          )}
        </div>

        <UrlPathField
          field={fields.urlPath}
          urlPathStatus={urlPathStatus}
          onUrlPathChange={onUrlPathChange}
          showRequired
          placeholder="salon-calm"
        />
        {getFieldErrors("urlPath") && (
          <p className="mt-1 text-xs text-error">{getFieldErrors("urlPath")}</p>
        )}
      </div>
    </div>
  );
}
