import type { FieldMetadata, FormMetadata } from "@conform-to/react";

type ConfirmStepProps = {
  fields: {
    name: FieldMetadata<string>;
    category: FieldMetadata<string>;
    urlPath: FieldMetadata<string>;
    postalCode: FieldMetadata<string>;
    prefecture: FieldMetadata<string>;
    city: FieldMetadata<string>;
    street: FieldMetadata<string>;
    phone: FieldMetadata<string>;
  };
  formErrors: FormMetadata["errors"];
};

export function ConfirmStep({ fields, formErrors }: ConfirmStepProps) {
  const items = [
    { label: "テナント名", value: fields.name.value },
    { label: "カテゴリー", value: fields.category.value },
    { label: "URLパス", value: fields.urlPath.value },
    { label: "郵便番号", value: fields.postalCode.value },
    {
      label: "住所",
      value: [fields.prefecture.value, fields.city.value, fields.street.value]
        .filter(Boolean)
        .join(""),
    },
    { label: "電話番号", value: fields.phone.value },
  ];

  return (
    <div className="rounded-lg border border-neutral-300 bg-white p-10">
      <h2 className="mb-6 border-b border-neutral-200 pb-6 font-heading text-xl font-semibold tracking-tight text-neutral-800">
        入力内容の確認
      </h2>

      <dl className="space-y-4">
        {items.map((item) => (
          <div key={item.label}>
            <dt className="text-xs tracking-wide text-neutral-500">
              {item.label}
            </dt>
            <dd className="mt-0.5 text-sm text-neutral-800">
              {item.value || "-"}
            </dd>
          </div>
        ))}
      </dl>

      {formErrors && <p className="mt-4 text-xs text-error">{formErrors}</p>}
    </div>
  );
}
