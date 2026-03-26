import { getFormProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { useState } from "react";
import { useNavigate } from "react-router";
import { BasicInfoStep } from "@/components/tenant/BasicInfoStep";
import { ConfirmStep } from "@/components/tenant/ConfirmStep";
import { LocationStep } from "@/components/tenant/LocationStep";
import { useUrlPathCheck } from "@/components/tenant/UrlPathField";
import { Button } from "@/components/ui/Button";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { useCompositeAction } from "@/lib/compositeAction";
import type { Route } from "./+types/index";
import { handlers, step1Schema, step2Schema } from "./action";

export { action } from "./action";
export { loader } from "./loader";

const STEPS = [
  { id: 1, label: "基本情報" },
  { id: 2, label: "所在地・連絡先" },
  { id: 3, label: "確認" },
];

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
    <div className="mx-auto w-full max-w-[680px] flex-1 px-10 py-14">
      <div className="mb-14 text-center">
        <h1 className="mb-2 font-heading text-2xl font-semibold leading-tight tracking-tight text-neutral-900">
          テナント登録
        </h1>
        <p className="text-sm text-neutral-500">
          店舗情報を入力して、予約管理を始めましょう
        </p>
      </div>

      <StepIndicator steps={STEPS} currentStep={step} />

      {step === 1 && (
        <BasicInfoStep
          fields={{
            name: fields.name,
            category: fields.category,
            urlPath: fields.urlPath,
          }}
          urlPathStatus={urlPathStatus}
          onUrlPathChange={checkUrlPath}
          getFieldErrors={getFieldErrors}
        />
      )}

      {step === 2 && (
        <LocationStep
          fields={{
            postalCode: fields.postalCode,
            prefecture: fields.prefecture,
            city: fields.city,
            street: fields.street,
            phone: fields.phone,
          }}
          getFieldErrors={getFieldErrors}
        />
      )}

      {step === 3 && (
        <ConfirmStep
          fields={{
            name: fields.name,
            category: fields.category,
            urlPath: fields.urlPath,
            postalCode: fields.postalCode,
            prefecture: fields.prefecture,
            city: fields.city,
            street: fields.street,
            phone: fields.phone,
          }}
          formErrors={form.errors}
        />
      )}

      {/* Form Actions */}
      <div className="mt-10 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          disabled={step === 1}
          onClick={() => setStep((s) => s - 1)}
          className="gap-2"
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
        </Button>

        {step < 3 ? (
          <Button
            type="button"
            variant="primary"
            onClick={handleNextStep}
            className="gap-2"
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
          </Button>
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
            <Button type="submit" variant="primary" disabled={isPending}>
              {isPending ? "登録中..." : "テナントを登録"}
            </Button>
          </fetcher.Form>
        )}
      </div>
    </div>
  );
}
