import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { useCallback, useEffect, useRef, useState } from "react";
import { redirect, useNavigate } from "react-router";
import { z } from "zod";
import { createTenant } from "@/core/application/tenant/createTenant";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
  useCompositeAction,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/new-tenant";

export async function loader({ request }: Route.LoaderArgs) {
  const { container } = await import("@/core/di/server");

  const session = await container.authProvider.getSession(request.headers);
  if (!session) {
    throw redirect("/admin/login");
  }

  const members = await container.memberRepository.findByAuthUserId(
    session.user.id,
  );
  if (members.length === 0) {
    throw redirect("/admin/setup");
  }

  return null;
}

const createTenantSchema = z.object({
  name: z.string().min(1, "テナント名を入力してください"),
  category: z.string().min(1, "カテゴリーを選択してください"),
  urlPath: z.string().min(1, "URLパスを入力してください"),
  postalCode: z.string().min(1, "郵便番号を入力してください"),
  prefecture: z.string().min(1, "都道府県を入力してください"),
  city: z.string().min(1, "市区町村を入力してください"),
  street: z.string().min(1, "番地を入力してください"),
  phone: z.string().min(1, "電話番号を入力してください"),
});

const handlers = {
  createTenant: defineHandler({
    schema: createTenantSchema,
    handler: async (value, args) => {
      const { container } = await import("@/core/di/server");

      const session = await container.authProvider.getSession(
        args.request.headers,
      );
      if (!session) {
        throw redirect("/admin/login");
      }

      return handleUseCase(() =>
        createTenant({
          container,
          headers: args.request.headers,
          input: {
            authUserId: session.user.id,
            name: value.name,
            category: value.category,
            urlPath: value.urlPath,
            postalCode: value.postalCode,
            address: {
              prefecture: value.prefecture,
              city: value.city,
              street: value.street,
            },
            phoneNumber: value.phone,
            creatorName: session.user.name,
            creatorEmail: session.user.email,
          },
        }),
      ).match(
        (result) => success({ tenantId: result.id }),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}

const step1Schema = z.object({
  name: z.string().min(1, "テナント名を入力してください"),
  category: z.string().min(1, "カテゴリーを選択してください"),
  urlPath: z.string().min(1, "URLパスを入力してください"),
});

const step2Schema = z.object({
  postalCode: z.string().min(1, "郵便番号を入力してください"),
  prefecture: z.string().min(1, "都道府県を入力してください"),
  city: z.string().min(1, "市区町村を入力してください"),
  street: z.string().min(1, "番地を入力してください"),
  phone: z.string().min(1, "電話番号を入力してください"),
});

const stepLabels = ["基本情報", "所在地・連絡先", "確認"];

const inputClass =
  "h-11 w-full rounded-[var(--radius-md)] border border-neutral-300 bg-white px-[var(--space-md)] font-[var(--font-body)] text-[length:var(--text-base)] text-neutral-800 placeholder:text-neutral-500 transition-[border-color,box-shadow] duration-[0.15s] ease-[ease] hover:border-neutral-400 focus:border-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary";

const labelClass =
  "mb-[var(--space-sm)] block text-[length:var(--text-sm)] font-[var(--weight-medium)] text-neutral-700";

function useUrlPathCheck() {
  const [urlPathStatus, setUrlPathStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const checkUrlPath = useCallback((value: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!value || value.length < 3) {
      setUrlPathStatus("idle");
      return;
    }

    setUrlPathStatus("checking");

    debounceRef.current = setTimeout(async () => {
      const params = new URLSearchParams({ urlPath: value });
      const res = await fetch(`/api/check-url-path?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setUrlPathStatus(json.available ? "available" : "taken");
      } else {
        setUrlPathStatus("idle");
      }
    }, 400);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return { urlPathStatus, checkUrlPath };
}

function UrlPathIndicator({
  status,
}: {
  status: "idle" | "checking" | "available" | "taken";
}) {
  if (status === "idle") return null;

  if (status === "checking") {
    return (
      <p className="mt-[var(--space-xs)] text-[length:var(--text-xs)] text-neutral-500">
        確認中...
      </p>
    );
  }

  if (status === "available") {
    return (
      <p className="mt-[var(--space-xs)] flex items-center gap-1 text-[length:var(--text-xs)] text-success">
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 12.75l6 6 9-13.5"
          />
        </svg>
        利用可能
      </p>
    );
  }

  return (
    <p className="mt-[var(--space-xs)] flex items-center gap-1 text-[length:var(--text-xs)] text-error">
      <svg
        className="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
      既に使用されています
    </p>
  );
}

export default function AdminNewTenantPage(_props: Route.ComponentProps) {
  const navigate = useNavigate();
  const fetcher = useCompositeAction<typeof handlers>();
  const [step, setStep] = useState(1);
  const [stepErrors, setStepErrors] = useState<Record<string, string[]>>({});
  const { urlPathStatus, checkUrlPath } = useUrlPathCheck();

  const [form, fields] = useForm({
    id: "new-tenant-form",
    lastResult:
      fetcher.data?.intent === "createTenant" ? fetcher.data : undefined,
    constraint: getZodConstraint(handlers.createTenant.schema),
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, {
        schema: handlers.createTenant.schema,
      });
    },
  });

  fetcher.register("createTenant", {
    onSuccess: ({ data: result }) => {
      navigate(`/admin/${result.tenantId}/dashboard`);
    },
  });

  const isPending = fetcher.isPending("createTenant");

  const handleNextStep = () => {
    const schema = step === 1 ? step1Schema : step === 2 ? step2Schema : null;
    if (!schema) {
      setStep((s) => s + 1);
      return;
    }

    const values: Record<string, string> = {};
    for (const key of Object.keys(schema.shape)) {
      values[key] = fields[key as keyof typeof fields]?.value ?? "";
    }

    const result = schema.safeParse(values);
    if (!result.success) {
      const errors: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        if (!errors[field]) {
          errors[field] = [];
        }
        errors[field].push(issue.message);
      }
      setStepErrors(errors);
      return;
    }

    if (step === 1 && urlPathStatus === "taken") {
      setStepErrors({
        urlPath: ["このURLパスは既に使用されています"],
      });
      return;
    }

    setStepErrors({});
    setStep((s) => s + 1);
  };

  const getFieldErrors = (fieldName: string): string[] | undefined => {
    const conformErrors = fields[fieldName as keyof typeof fields]?.errors;
    const localErrors = stepErrors[fieldName];
    if (conformErrors) return conformErrors as string[];
    if (localErrors) return localErrors;
    return undefined;
  };

  return (
    <div className="mx-auto w-full max-w-[680px] flex-1 px-[var(--space-2xl)] py-[var(--space-3xl)]">
      <div className="mb-[var(--space-3xl)] text-center">
        <h1 className="mb-[var(--space-sm)] font-[var(--font-heading)] text-[length:var(--text-2xl)] font-[var(--weight-semibold)] leading-[var(--leading-tight)] tracking-[var(--tracking-tight)] text-neutral-900">
          テナント登録
        </h1>
        <p className="text-[length:var(--text-sm)] text-neutral-500">
          店舗情報を入力して、予約管理を始めましょう
        </p>
      </div>

      {/* Step Indicator */}
      <div className="mb-[var(--space-2xl)] flex items-center justify-center">
        {stepLabels.map((label, i) => {
          const stepNum = i + 1;
          const isActive = stepNum <= step;
          return (
            <div key={label} className="flex items-center">
              <div className="flex items-center gap-[var(--space-sm)]">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-[var(--font-heading)] text-[length:var(--text-sm)] font-[var(--weight-semibold)] ${
                    isActive
                      ? "bg-primary text-white"
                      : "bg-neutral-200 text-neutral-500"
                  }`}
                >
                  {stepNum}
                </span>
                <span
                  className={`text-[length:var(--text-sm)] font-[var(--weight-medium)] ${
                    isActive ? "text-neutral-800" : "text-neutral-500"
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < stepLabels.length - 1 && (
                <div className="mx-[var(--space-md)] h-px w-12 bg-neutral-300" />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="rounded-[var(--radius-lg)] border border-neutral-300 bg-white p-[var(--space-2xl)]">
          <h2 className="mb-[var(--space-lg)] border-b border-neutral-200 pb-[var(--space-lg)] font-[var(--font-heading)] text-[length:var(--text-xl)] font-[var(--weight-semibold)] tracking-[var(--tracking-tight)] text-neutral-800">
            基本情報
          </h2>

          <div className="space-y-[var(--space-lg)]">
            <div>
              <label htmlFor={fields.name.id} className={labelClass}>
                テナント名
                <span className="ml-[var(--space-xs)] text-[length:var(--text-xs)] font-[var(--weight-medium)] text-error">
                  必須
                </span>
              </label>
              <input
                {...getInputProps(fields.name, { type: "text" })}
                placeholder="例: リラクゼーションサロン Calm"
                className={inputClass}
              />
              {getFieldErrors("name") && (
                <p className="mt-1 text-[length:var(--text-xs)] text-error">
                  {getFieldErrors("name")}
                </p>
              )}
            </div>

            <div>
              <label htmlFor={fields.category.id} className={labelClass}>
                カテゴリー
                <span className="ml-[var(--space-xs)] text-[length:var(--text-xs)] font-[var(--weight-medium)] text-error">
                  必須
                </span>
              </label>
              <select
                {...getInputProps(fields.category, { type: "text" })}
                className={`${inputClass} cursor-pointer appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='2' stroke='%23B8B5B1'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5' /%3E%3C/svg%3E")] bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-10`}
              >
                <option value="" disabled>
                  カテゴリーを選択
                </option>
                <option value="seitai">整体院</option>
                <option value="gym">ジム</option>
                <option value="biyoin">美容院</option>
                <option value="nail">ネイルサロン</option>
                <option value="esthe">エステサロン</option>
                <option value="relaxation">リラクゼーションサロン</option>
                <option value="other">その他</option>
              </select>
              {getFieldErrors("category") && (
                <p className="mt-1 text-[length:var(--text-xs)] text-error">
                  {getFieldErrors("category")}
                </p>
              )}
            </div>

            <div>
              <label htmlFor={fields.urlPath.id} className={labelClass}>
                URLパス
                <span className="ml-[var(--space-xs)] text-[length:var(--text-xs)] font-[var(--weight-medium)] text-error">
                  必須
                </span>
              </label>
              <div className="flex items-center overflow-hidden rounded-[var(--radius-md)] border border-neutral-300 transition-[border-color] duration-[0.15s] ease-[ease] hover:border-neutral-400 focus-within:border-primary focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary">
                <span className="flex h-11 shrink-0 items-center border-r border-neutral-300 bg-neutral-100 px-[var(--space-md)] text-[length:var(--text-sm)] text-neutral-500">
                  dot-reservation.com/
                </span>
                <input
                  {...getInputProps(fields.urlPath, { type: "text" })}
                  placeholder="salon-calm"
                  onChange={(e) => {
                    checkUrlPath(e.target.value);
                  }}
                  className="h-11 min-w-0 flex-1 border-none bg-white px-[var(--space-md)] font-[var(--font-body)] text-[length:var(--text-base)] text-neutral-800 placeholder:text-neutral-500 focus:outline-none"
                />
              </div>
              <UrlPathIndicator status={urlPathStatus} />
              <p className="mt-[var(--space-xs)] text-[length:var(--text-xs)] text-neutral-500">
                英数字とハイフンのみ使用できます。公開ページのURLになります。
              </p>
              {getFieldErrors("urlPath") && (
                <p className="mt-1 text-[length:var(--text-xs)] text-error">
                  {getFieldErrors("urlPath")}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Location */}
      {step === 2 && (
        <div className="rounded-[var(--radius-lg)] border border-neutral-300 bg-white p-[var(--space-2xl)]">
          <h2 className="mb-[var(--space-lg)] border-b border-neutral-200 pb-[var(--space-lg)] font-[var(--font-heading)] text-[length:var(--text-xl)] font-[var(--weight-semibold)] tracking-[var(--tracking-tight)] text-neutral-800">
            所在地・連絡先
          </h2>

          <div className="space-y-[var(--space-lg)]">
            <div>
              <label htmlFor={fields.postalCode.id} className={labelClass}>
                郵便番号
                <span className="ml-[var(--space-xs)] text-[length:var(--text-xs)] font-[var(--weight-medium)] text-error">
                  必須
                </span>
              </label>
              <input
                {...getInputProps(fields.postalCode, { type: "text" })}
                placeholder="123-4567"
                className={`${inputClass} w-48`}
              />
              {getFieldErrors("postalCode") && (
                <p className="mt-1 text-[length:var(--text-xs)] text-error">
                  {getFieldErrors("postalCode")}
                </p>
              )}
            </div>

            <div>
              <label htmlFor={fields.prefecture.id} className={labelClass}>
                都道府県
                <span className="ml-[var(--space-xs)] text-[length:var(--text-xs)] font-[var(--weight-medium)] text-error">
                  必須
                </span>
              </label>
              <input
                {...getInputProps(fields.prefecture, { type: "text" })}
                placeholder="東京都"
                className={inputClass}
              />
              {getFieldErrors("prefecture") && (
                <p className="mt-1 text-[length:var(--text-xs)] text-error">
                  {getFieldErrors("prefecture")}
                </p>
              )}
            </div>

            <div>
              <label htmlFor={fields.city.id} className={labelClass}>
                市区町村
                <span className="ml-[var(--space-xs)] text-[length:var(--text-xs)] font-[var(--weight-medium)] text-error">
                  必須
                </span>
              </label>
              <input
                {...getInputProps(fields.city, { type: "text" })}
                placeholder="渋谷区"
                className={inputClass}
              />
              {getFieldErrors("city") && (
                <p className="mt-1 text-[length:var(--text-xs)] text-error">
                  {getFieldErrors("city")}
                </p>
              )}
            </div>

            <div>
              <label htmlFor={fields.street.id} className={labelClass}>
                番地
                <span className="ml-[var(--space-xs)] text-[length:var(--text-xs)] font-[var(--weight-medium)] text-error">
                  必須
                </span>
              </label>
              <input
                {...getInputProps(fields.street, { type: "text" })}
                placeholder="神南1-2-3"
                className={inputClass}
              />
              {getFieldErrors("street") && (
                <p className="mt-1 text-[length:var(--text-xs)] text-error">
                  {getFieldErrors("street")}
                </p>
              )}
            </div>

            <div>
              <label htmlFor={fields.phone.id} className={labelClass}>
                電話番号
                <span className="ml-[var(--space-xs)] text-[length:var(--text-xs)] font-[var(--weight-medium)] text-error">
                  必須
                </span>
              </label>
              <input
                {...getInputProps(fields.phone, { type: "tel" })}
                placeholder="03-1234-5678"
                className={inputClass}
              />
              {getFieldErrors("phone") && (
                <p className="mt-1 text-[length:var(--text-xs)] text-error">
                  {getFieldErrors("phone")}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <div className="rounded-[var(--radius-lg)] border border-neutral-300 bg-white p-[var(--space-2xl)]">
          <h2 className="mb-[var(--space-lg)] border-b border-neutral-200 pb-[var(--space-lg)] font-[var(--font-heading)] text-[length:var(--text-xl)] font-[var(--weight-semibold)] tracking-[var(--tracking-tight)] text-neutral-800">
            入力内容の確認
          </h2>

          <dl className="space-y-[var(--space-md)]">
            {[
              { label: "テナント名", value: fields.name.value },
              { label: "カテゴリー", value: fields.category.value },
              { label: "URLパス", value: fields.urlPath.value },
              { label: "郵便番号", value: fields.postalCode.value },
              {
                label: "住所",
                value: [
                  fields.prefecture.value,
                  fields.city.value,
                  fields.street.value,
                ]
                  .filter(Boolean)
                  .join(""),
              },
              { label: "電話番号", value: fields.phone.value },
            ].map((item) => (
              <div key={item.label}>
                <dt className="text-[length:var(--text-xs)] tracking-[var(--tracking-wide)] text-neutral-500">
                  {item.label}
                </dt>
                <dd className="mt-0.5 text-[length:var(--text-sm)] text-neutral-800">
                  {item.value || "-"}
                </dd>
              </div>
            ))}
          </dl>

          {form.errors && (
            <p className="mt-4 text-[length:var(--text-xs)] text-error">
              {form.errors}
            </p>
          )}
        </div>
      )}

      {/* Form Actions */}
      <div className="mt-[var(--space-2xl)] flex items-center justify-between">
        <button
          type="button"
          disabled={step === 1}
          onClick={() => setStep((s) => s - 1)}
          className="inline-flex h-11 items-center gap-[var(--space-sm)] rounded-[var(--radius-md)] bg-transparent px-[var(--space-lg)] text-[length:var(--text-sm)] font-[var(--weight-medium)] text-neutral-600 transition-[color,background] duration-[0.15s] ease-[ease] hover:bg-neutral-200 hover:text-neutral-800 disabled:opacity-30"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
          戻る
        </button>

        {step < 3 ? (
          <button
            type="button"
            onClick={handleNextStep}
            className="inline-flex h-11 items-center gap-[var(--space-sm)] rounded-[var(--radius-md)] bg-primary px-[var(--space-xl)] text-[length:var(--text-sm)] font-[var(--weight-medium)] tracking-[var(--tracking-wide)] text-white transition-[background,transform] duration-[0.15s] ease-[ease] hover:bg-primary-dark active:scale-[0.99]"
          >
            次へ
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </button>
        ) : (
          <fetcher.Form method="post" {...getFormProps(form)}>
            <input type="hidden" name="intent" value="createTenant" />
            <input type="hidden" name="name" value={fields.name.value ?? ""} />
            <input
              type="hidden"
              name="category"
              value={fields.category.value ?? ""}
            />
            <input
              type="hidden"
              name="urlPath"
              value={fields.urlPath.value ?? ""}
            />
            <input
              type="hidden"
              name="postalCode"
              value={fields.postalCode.value ?? ""}
            />
            <input
              type="hidden"
              name="prefecture"
              value={fields.prefecture.value ?? ""}
            />
            <input type="hidden" name="city" value={fields.city.value ?? ""} />
            <input
              type="hidden"
              name="street"
              value={fields.street.value ?? ""}
            />
            <input
              type="hidden"
              name="phone"
              value={fields.phone.value ?? ""}
            />
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex h-11 items-center gap-[var(--space-sm)] rounded-[var(--radius-md)] bg-primary px-[var(--space-xl)] text-[length:var(--text-sm)] font-[var(--weight-medium)] tracking-[var(--tracking-wide)] text-white transition-[background,transform] duration-[0.15s] ease-[ease] hover:bg-primary-dark active:scale-[0.99] disabled:opacity-50"
            >
              {isPending ? "登録中..." : "テナントを登録"}
            </button>
          </fetcher.Form>
        )}
      </div>
    </div>
  );
}
