import {
  getFormProps,
  getInputProps,
  getTextareaProps,
  useForm,
} from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { useCompositeAction } from "@/lib/compositeAction";
import {
  type handlers,
  updateTenantSchema,
} from "@/routes/admin/$tenantId/settings/action";
import { categoryOptions } from "./constants";
import { ImageManager } from "./ImageManager";
import { inputClass, labelClass } from "./styles";
import { UrlPathField, useUrlPathCheck } from "./UrlPathField";

type TenantData = {
  id: string;
  name: string;
  category: string;
  urlPath: string;
  postalCode: string;
  address: {
    prefecture: string;
    city: string;
    street: string;
  };
  phoneNumber: string;
  description: string | null;
  imageKeys: string[];
  imageUrls: string[];
};

type TenantProfileFormProps = {
  tenant: TenantData;
};

export function TenantProfileForm({ tenant }: TenantProfileFormProps) {
  // 各セクションが独立したフォーム操作を持つため、個別にfetcherを初期化する
  const fetcher = useCompositeAction<typeof handlers>();
  const { urlPathStatus, checkUrlPath } = useUrlPathCheck(tenant.id);

  const [updateForm, updateFields] = useForm({
    id: "update-tenant-form",
    lastResult:
      fetcher.data?.intent === "updateTenant" ? fetcher.data : undefined,
    constraint: getZodConstraint(updateTenantSchema),
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    defaultValue: {
      name: tenant.name,
      category: tenant.category,
      urlPath: tenant.urlPath,
      postalCode: tenant.postalCode,
      prefecture: tenant.address.prefecture,
      city: tenant.address.city,
      street: tenant.address.street,
      phone: tenant.phoneNumber,
      description: tenant.description ?? "",
      imageKeys: tenant.imageKeys.join("\n"),
    },
    onValidate({ formData }) {
      return parseWithZod(formData, {
        schema: updateTenantSchema,
      });
    },
  });

  fetcher.register("updateTenant", {
    onSuccess: () => {
      toast.success("テナント情報を更新しました");
    },
    onHandlerError: ({ error: err }) => {
      toast.error(err?.[""]?.[0] ?? "更新に失敗しました");
    },
  });

  const isPendingUpdate = fetcher.isPending("updateTenant");

  return (
    <section className="rounded-lg border border-neutral-300 bg-white p-6">
      <h2 className="mb-4 font-heading text-lg font-semibold tracking-tight text-neutral-800">
        基本情報
      </h2>
      <fetcher.Form
        method="post"
        {...getFormProps(updateForm)}
        className="space-y-4"
      >
        <input type="hidden" name="intent" value="updateTenant" />

        <div>
          <label htmlFor={updateFields.name.id} className={labelClass}>
            テナント名
          </label>
          <input
            {...getInputProps(updateFields.name, { type: "text" })}
            className={inputClass}
          />
          {updateFields.name.errors && (
            <p className="mt-1 text-xs text-error">
              {updateFields.name.errors}
            </p>
          )}
        </div>

        <div>
          <label htmlFor={updateFields.category.id} className={labelClass}>
            カテゴリー
          </label>
          <select
            {...getInputProps(updateFields.category, { type: "text" })}
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
          {updateFields.category.errors && (
            <p className="mt-1 text-xs text-error">
              {updateFields.category.errors}
            </p>
          )}
        </div>

        <UrlPathField
          field={updateFields.urlPath}
          urlPathStatus={urlPathStatus}
          onUrlPathChange={checkUrlPath}
        />

        <div>
          <label htmlFor={updateFields.postalCode.id} className={labelClass}>
            郵便番号
          </label>
          <input
            {...getInputProps(updateFields.postalCode, { type: "text" })}
            placeholder="123-4567"
            className={`${inputClass} w-48`}
          />
          {updateFields.postalCode.errors && (
            <p className="mt-1 text-xs text-error">
              {updateFields.postalCode.errors}
            </p>
          )}
        </div>

        <div>
          <label htmlFor={updateFields.prefecture.id} className={labelClass}>
            都道府県
          </label>
          <input
            {...getInputProps(updateFields.prefecture, { type: "text" })}
            placeholder="東京都"
            className={inputClass}
          />
          {updateFields.prefecture.errors && (
            <p className="mt-1 text-xs text-error">
              {updateFields.prefecture.errors}
            </p>
          )}
        </div>

        <div>
          <label htmlFor={updateFields.city.id} className={labelClass}>
            市区町村
          </label>
          <input
            {...getInputProps(updateFields.city, { type: "text" })}
            placeholder="渋谷区"
            className={inputClass}
          />
          {updateFields.city.errors && (
            <p className="mt-1 text-xs text-error">
              {updateFields.city.errors}
            </p>
          )}
        </div>

        <div>
          <label htmlFor={updateFields.street.id} className={labelClass}>
            番地
          </label>
          <input
            {...getInputProps(updateFields.street, { type: "text" })}
            placeholder="神南1-2-3"
            className={inputClass}
          />
          {updateFields.street.errors && (
            <p className="mt-1 text-xs text-error">
              {updateFields.street.errors}
            </p>
          )}
        </div>

        <div>
          <label htmlFor={updateFields.phone.id} className={labelClass}>
            電話番号
          </label>
          <input
            {...getInputProps(updateFields.phone, { type: "tel" })}
            placeholder="03-1234-5678"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor={updateFields.description.id} className={labelClass}>
            紹介文
          </label>
          <textarea
            {...getTextareaProps(updateFields.description)}
            rows={4}
            className="min-h-[88px] w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-base text-neutral-800 transition-[border-color] duration-150 hover:border-neutral-400 focus:border-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary"
          />
        </div>

        <ImageManager
          images={tenant.imageKeys.map((key, i) => ({
            key,
            url: tenant.imageUrls[i],
          }))}
        />

        {updateForm.errors && (
          <p className="text-xs text-error">{updateForm.errors}</p>
        )}

        <div className="flex justify-end">
          <Button type="submit" variant="primary" disabled={isPendingUpdate}>
            {isPendingUpdate ? "更新中..." : "更新する"}
          </Button>
        </div>
      </fetcher.Form>
    </section>
  );
}
