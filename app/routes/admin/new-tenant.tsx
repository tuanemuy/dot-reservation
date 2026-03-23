import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { useState } from "react";
import { redirect } from "react-router";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  createCompositeAction,
  defineHandler,
  success,
  useCompositeAction,
} from "@/lib/compositeAction";
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
    handler: async (value, _args) => {
      // TODO: 認証ユーザーの情報を取得して createTenant ユースケースを呼び出す
      // const result = await handleUseCase(() =>
      //   createTenant({
      //     container,
      //     headers: args.request.headers,
      //     input: {
      //       authUserId,
      //       name: value.name,
      //       category: value.category,
      //       urlPath: value.urlPath,
      //       postalCode: value.postalCode,
      //       address: { prefecture: value.prefecture, city: value.city, street: value.street },
      //       phoneNumber: value.phone,
      //       creatorName,
      //       creatorEmail,
      //     },
      //   }),
      // ).match(
      //   (result) => result,
      //   (e) => error({ "": [e.message] }),
      // );
      console.log("Create tenant:", value);
      return success({ tenantId: "new-tenant-id" });
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}

export default function AdminNewTenantPage(_props: Route.ComponentProps) {
  const fetcher = useCompositeAction<typeof handlers>();
  const [step, setStep] = useState(1);

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
      // TODO: 作成後のテナントダッシュボードへリダイレクト
      console.log("Tenant created:", result);
    },
    onHandlerError: ({ error: err }) => {
      console.error("Tenant creation failed:", err);
    },
  });

  const isPending = fetcher.isPending("createTenant");

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text">テナント新規登録</h1>
          <p className="mt-2 text-sm text-text-secondary">
            新しい店舗を登録します
          </p>
        </div>

        {/* ステップインジケーター */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  s === step
                    ? "bg-primary text-white"
                    : s < step
                      ? "bg-primary/20 text-primary"
                      : "bg-surface-secondary text-text-muted"
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={`mx-2 h-0.5 w-12 ${
                    s < step ? "bg-primary" : "bg-surface-secondary"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* ステップ1: 基本情報 */}
        {step === 1 && (
          <Card>
            <CardBody>
              <h2 className="mb-4 text-lg font-semibold text-text">基本情報</h2>
              <div className="space-y-5">
                <FormField
                  label="テナント名"
                  htmlFor={fields.name.id}
                  error={fields.name.errors}
                  required
                >
                  <Input
                    {...getInputProps(fields.name, { type: "text" })}
                    placeholder="例: ヘアサロン dot"
                    error={fields.name.errors?.[0]}
                  />
                </FormField>

                <FormField
                  label="カテゴリー"
                  htmlFor={fields.category.id}
                  error={fields.category.errors}
                  required
                >
                  <Select
                    {...getInputProps(fields.category, { type: "text" })}
                    error={fields.category.errors?.[0]}
                  >
                    <option value="">選択してください</option>
                    <option value="hair">美容室</option>
                    <option value="nail">ネイルサロン</option>
                    <option value="esthetic">エステサロン</option>
                    <option value="clinic">クリニック</option>
                    <option value="other">その他</option>
                  </Select>
                </FormField>

                <FormField
                  label="URLパス"
                  htmlFor={fields.urlPath.id}
                  error={fields.urlPath.errors}
                  required
                >
                  <Input
                    {...getInputProps(fields.urlPath, { type: "text" })}
                    placeholder="例: hair-salon-dot"
                    error={fields.urlPath.errors?.[0]}
                  />
                  <p className="mt-1 text-xs text-text-muted">
                    公開ページのURLに使用されます
                  </p>
                </FormField>

                <div className="flex justify-end">
                  <Button type="button" onClick={() => setStep(2)}>
                    次へ
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* ステップ2: 所在地・連絡先 */}
        {step === 2 && (
          <Card>
            <CardBody>
              <h2 className="mb-4 text-lg font-semibold text-text">
                所在地・連絡先
              </h2>
              <div className="space-y-5">
                <FormField
                  label="郵便番号"
                  htmlFor={fields.postalCode.id}
                  error={fields.postalCode.errors}
                  required
                >
                  <Input
                    {...getInputProps(fields.postalCode, { type: "text" })}
                    placeholder="123-4567"
                    className="w-48"
                    error={fields.postalCode.errors?.[0]}
                  />
                </FormField>

                <FormField
                  label="都道府県"
                  htmlFor={fields.prefecture.id}
                  error={fields.prefecture.errors}
                  required
                >
                  <Input
                    {...getInputProps(fields.prefecture, { type: "text" })}
                    placeholder="東京都"
                    error={fields.prefecture.errors?.[0]}
                  />
                </FormField>

                <FormField
                  label="市区町村"
                  htmlFor={fields.city.id}
                  error={fields.city.errors}
                  required
                >
                  <Input
                    {...getInputProps(fields.city, { type: "text" })}
                    placeholder="渋谷区"
                    error={fields.city.errors?.[0]}
                  />
                </FormField>

                <FormField
                  label="番地"
                  htmlFor={fields.street.id}
                  error={fields.street.errors}
                  required
                >
                  <Input
                    {...getInputProps(fields.street, { type: "text" })}
                    placeholder="神南1-2-3"
                    error={fields.street.errors?.[0]}
                  />
                </FormField>

                <FormField
                  label="電話番号"
                  htmlFor={fields.phone.id}
                  error={fields.phone.errors}
                  required
                >
                  <Input
                    {...getInputProps(fields.phone, { type: "tel" })}
                    placeholder="03-1234-5678"
                    error={fields.phone.errors?.[0]}
                  />
                </FormField>

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                  >
                    戻る
                  </Button>
                  <Button type="button" onClick={() => setStep(3)}>
                    次へ
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* ステップ3: 確認 */}
        {step === 3 && (
          <Card>
            <CardBody>
              <h2 className="mb-4 text-lg font-semibold text-text">
                入力内容の確認
              </h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-text-secondary">
                    テナント名
                  </dt>
                  <dd className="mt-1 text-sm text-text">
                    {fields.name.value || "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-text-secondary">
                    カテゴリー
                  </dt>
                  <dd className="mt-1 text-sm text-text">
                    {fields.category.value || "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-text-secondary">
                    URLパス
                  </dt>
                  <dd className="mt-1 text-sm text-text">
                    {fields.urlPath.value || "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-text-secondary">
                    郵便番号
                  </dt>
                  <dd className="mt-1 text-sm text-text">
                    {fields.postalCode.value || "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-text-secondary">
                    住所
                  </dt>
                  <dd className="mt-1 text-sm text-text">
                    {[
                      fields.prefecture.value,
                      fields.city.value,
                      fields.street.value,
                    ]
                      .filter(Boolean)
                      .join("") || "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-text-secondary">
                    電話番号
                  </dt>
                  <dd className="mt-1 text-sm text-text">
                    {fields.phone.value || "-"}
                  </dd>
                </div>
              </dl>

              {form.errors && (
                <p className="mt-4 text-xs text-destructive">{form.errors}</p>
              )}

              <fetcher.Form
                method="post"
                {...getFormProps(form)}
                className="mt-6"
              >
                <input type="hidden" name="intent" value="createTenant" />
                <input
                  type="hidden"
                  name="name"
                  value={fields.name.value ?? ""}
                />
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
                <input
                  type="hidden"
                  name="city"
                  value={fields.city.value ?? ""}
                />
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

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(2)}
                  >
                    戻る
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? "登録中..." : "テナントを登録"}
                  </Button>
                </div>
              </fetcher.Form>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
