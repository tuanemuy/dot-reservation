import type { FieldMetadata } from "@conform-to/react";
import { getInputProps } from "@conform-to/react";
import { inputClass, labelClass } from "./styles";

type LocationStepProps = {
  fields: {
    postalCode: FieldMetadata<string>;
    prefecture: FieldMetadata<string>;
    city: FieldMetadata<string>;
    street: FieldMetadata<string>;
    phone: FieldMetadata<string>;
  };
  getFieldErrors: (fieldName: string) => string[] | undefined;
};

export function LocationStep({ fields, getFieldErrors }: LocationStepProps) {
  return (
    <div className="rounded-lg border border-neutral-300 bg-white p-10">
      <h2 className="mb-6 border-b border-neutral-200 pb-6 font-heading text-xl font-semibold tracking-tight text-neutral-800">
        所在地・連絡先
      </h2>

      <div className="space-y-6">
        <div>
          <label htmlFor={fields.postalCode.id} className={labelClass}>
            郵便番号
            <span className="ml-1 text-xs font-medium text-error">必須</span>
          </label>
          <input
            {...getInputProps(fields.postalCode, { type: "text" })}
            placeholder="123-4567"
            className={`${inputClass} w-48`}
          />
          {getFieldErrors("postalCode") && (
            <p className="mt-1 text-xs text-error">
              {getFieldErrors("postalCode")}
            </p>
          )}
        </div>

        <div>
          <label htmlFor={fields.prefecture.id} className={labelClass}>
            都道府県
            <span className="ml-1 text-xs font-medium text-error">必須</span>
          </label>
          <input
            {...getInputProps(fields.prefecture, { type: "text" })}
            placeholder="東京都"
            className={inputClass}
          />
          {getFieldErrors("prefecture") && (
            <p className="mt-1 text-xs text-error">
              {getFieldErrors("prefecture")}
            </p>
          )}
        </div>

        <div>
          <label htmlFor={fields.city.id} className={labelClass}>
            市区町村
            <span className="ml-1 text-xs font-medium text-error">必須</span>
          </label>
          <input
            {...getInputProps(fields.city, { type: "text" })}
            placeholder="渋谷区"
            className={inputClass}
          />
          {getFieldErrors("city") && (
            <p className="mt-1 text-xs text-error">{getFieldErrors("city")}</p>
          )}
        </div>

        <div>
          <label htmlFor={fields.street.id} className={labelClass}>
            番地
            <span className="ml-1 text-xs font-medium text-error">必須</span>
          </label>
          <input
            {...getInputProps(fields.street, { type: "text" })}
            placeholder="神南1-2-3"
            className={inputClass}
          />
          {getFieldErrors("street") && (
            <p className="mt-1 text-xs text-error">
              {getFieldErrors("street")}
            </p>
          )}
        </div>

        <div>
          <label htmlFor={fields.phone.id} className={labelClass}>
            電話番号
            <span className="ml-1 text-xs font-medium text-error">必須</span>
          </label>
          <input
            {...getInputProps(fields.phone, { type: "tel" })}
            placeholder="03-1234-5678"
            className={inputClass}
          />
          {getFieldErrors("phone") && (
            <p className="mt-1 text-xs text-error">{getFieldErrors("phone")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
