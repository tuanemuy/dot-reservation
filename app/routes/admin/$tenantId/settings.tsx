import {
  getFormProps,
  getInputProps,
  getTextareaProps,
  useForm,
} from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { useState } from "react";
import { data, redirect } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { deleteTenant } from "@/core/application/tenant/deleteTenant";
import { getTenant } from "@/core/application/tenant/getTenant";
import { updateTenantProfile } from "@/core/application/tenant/updateTenantProfile";
import { container } from "@/core/di/server";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
  useCompositeAction,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/settings";

export async function loader({ params, request }: Route.LoaderArgs) {
  const tenantResult = await handleUseCase(() =>
    getTenant({
      container,
      headers: request.headers,
      input: { tenantId: params.tenantId },
    }),
  ).match(
    (result) => result,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  return { tenant: tenantResult };
}

const updateTenantSchema = z.object({
  name: z.string().min(1, "テナント名を入力してください"),
  category: z.string().min(1, "カテゴリーを選択してください"),
  urlPath: z.string().min(1, "URLパスを入力してください"),
  address: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  description: z.string().optional().default(""),
});

const deleteTenantSchema = z.object({
  confirmName: z.string().min(1, "テナント名を入力してください"),
});

export const handlers = {
  updateTenant: defineHandler({
    schema: updateTenantSchema,
    handler: async (value, args) => {
      return handleUseCase(() =>
        updateTenantProfile({
          container,
          headers: args.request.headers,
          input: {
            tenantId: args.params.tenantId as string,
            name: value.name,
            category: value.category,
            urlPath: value.urlPath,
            postalCode: "",
            address: { prefecture: "", city: "", street: value.address },
            phoneNumber: value.phone,
            description: value.description || null,
            imageUrls: [],
          },
        }),
      ).match(
        (result) => success({ tenant: result }),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
  deleteTenant: defineHandler({
    schema: deleteTenantSchema,
    handler: async (_value, args) => {
      return handleUseCase(() =>
        deleteTenant({
          container,
          headers: args.request.headers,
          input: { tenantId: args.params.tenantId as string },
        }),
      ).match(
        () => success(),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  const result = await createCompositeAction(args, handlers);

  if (result.intent === "deleteTenant" && result.status === "success") {
    throw redirect("/admin/tenants");
  }

  return result;
}

export default function TenantSettingsPage({
  loaderData,
}: Route.ComponentProps) {
  const { tenant } = loaderData;
  const fetcher = useCompositeAction<typeof handlers>();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");

  const [updateForm, updateFields] = useForm({
    id: "update-tenant-form",
    lastResult:
      fetcher.data?.intent === "updateTenant" ? fetcher.data : undefined,
    constraint: getZodConstraint(handlers.updateTenant.schema),
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    defaultValue: {
      name: tenant.name,
      category: tenant.category,
      urlPath: tenant.urlPath,
      address: tenant.address.street,
      phone: tenant.phoneNumber,
      description: tenant.description ?? "",
    },
    onValidate({ formData }) {
      return parseWithZod(formData, {
        schema: handlers.updateTenant.schema,
      });
    },
  });

  const [deleteForm, deleteFields] = useForm({
    id: "delete-tenant-form",
    lastResult:
      fetcher.data?.intent === "deleteTenant" ? fetcher.data : undefined,
    constraint: getZodConstraint(handlers.deleteTenant.schema),
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, {
        schema: handlers.deleteTenant.schema,
      });
    },
  });

  fetcher.register("updateTenant", {
    onHandlerError: ({ error: err }) => {
      toast.error(err?.[""]?.[0] ?? "更新に失敗しました");
    },
  });

  fetcher.register("deleteTenant", {
    onHandlerError: ({ error: err }) => {
      toast.error(err?.[""]?.[0] ?? "削除に失敗しました");
    },
  });

  const isPendingUpdate = fetcher.isPending("updateTenant");
  const isPendingDelete = fetcher.isPending("deleteTenant");

  return (
    <div>
      <h1 className="mb-[var(--space-xl)] font-[var(--font-heading)] text-[length:var(--text-2xl)] font-[var(--weight-semibold)] leading-[var(--leading-tight)] tracking-[var(--tracking-tight)] text-neutral-900">
        テナント設定
      </h1>

      <div className="max-w-2xl space-y-[var(--space-xl)]">
        <section className="rounded-[var(--radius-lg)] border border-neutral-300 bg-white p-[var(--space-lg)]">
          <h2 className="mb-[var(--space-md)] font-[var(--font-heading)] text-[length:var(--text-lg)] font-[var(--weight-semibold)] tracking-[var(--tracking-tight)] text-neutral-800">
            基本情報
          </h2>
          <fetcher.Form
            method="post"
            {...getFormProps(updateForm)}
            className="space-y-4"
          >
            <input type="hidden" name="intent" value="updateTenant" />

            <div>
              <label
                htmlFor={updateFields.name.id}
                className="mb-[var(--space-sm)] block text-[length:var(--text-sm)] font-[var(--weight-medium)] text-neutral-700"
              >
                テナント名
              </label>
              <input
                {...getInputProps(updateFields.name, { type: "text" })}
                className="h-11 w-full rounded-[var(--radius-md)] border border-neutral-300 bg-white px-[var(--space-md)] text-[length:var(--text-base)] text-neutral-800 transition-[border-color] duration-[0.15s] ease-[ease] hover:border-neutral-400 focus:border-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary"
              />
              {updateFields.name.errors && (
                <p className="mt-1 text-[length:var(--text-xs)] text-error">
                  {updateFields.name.errors}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor={updateFields.category.id}
                className="mb-[var(--space-sm)] block text-[length:var(--text-sm)] font-[var(--weight-medium)] text-neutral-700"
              >
                カテゴリー
              </label>
              <select
                {...getInputProps(updateFields.category, { type: "text" })}
                className="h-11 w-full rounded-[var(--radius-md)] border border-neutral-300 bg-white px-[var(--space-md)] text-[length:var(--text-base)] text-neutral-800 transition-[border-color] duration-[0.15s] ease-[ease] hover:border-neutral-400 focus:border-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary"
              >
                <option value="hair">美容室</option>
                <option value="nail">ネイルサロン</option>
                <option value="esthetic">エステサロン</option>
                <option value="clinic">クリニック</option>
                <option value="other">その他</option>
              </select>
              {updateFields.category.errors && (
                <p className="mt-1 text-[length:var(--text-xs)] text-error">
                  {updateFields.category.errors}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor={updateFields.urlPath.id}
                className="mb-[var(--space-sm)] block text-[length:var(--text-sm)] font-[var(--weight-medium)] text-neutral-700"
              >
                URLパス
              </label>
              <input
                {...getInputProps(updateFields.urlPath, { type: "text" })}
                className="h-11 w-full rounded-[var(--radius-md)] border border-neutral-300 bg-white px-[var(--space-md)] text-[length:var(--text-base)] text-neutral-800 transition-[border-color] duration-[0.15s] ease-[ease] hover:border-neutral-400 focus:border-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary"
              />
              {updateFields.urlPath.errors && (
                <p className="mt-1 text-[length:var(--text-xs)] text-error">
                  {updateFields.urlPath.errors}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor={updateFields.address.id}
                className="mb-[var(--space-sm)] block text-[length:var(--text-sm)] font-[var(--weight-medium)] text-neutral-700"
              >
                住所
              </label>
              <input
                {...getInputProps(updateFields.address, { type: "text" })}
                className="h-11 w-full rounded-[var(--radius-md)] border border-neutral-300 bg-white px-[var(--space-md)] text-[length:var(--text-base)] text-neutral-800 transition-[border-color] duration-[0.15s] ease-[ease] hover:border-neutral-400 focus:border-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary"
              />
            </div>

            <div>
              <label
                htmlFor={updateFields.phone.id}
                className="mb-[var(--space-sm)] block text-[length:var(--text-sm)] font-[var(--weight-medium)] text-neutral-700"
              >
                電話番号
              </label>
              <input
                {...getInputProps(updateFields.phone, { type: "tel" })}
                className="h-11 w-full rounded-[var(--radius-md)] border border-neutral-300 bg-white px-[var(--space-md)] text-[length:var(--text-base)] text-neutral-800 transition-[border-color] duration-[0.15s] ease-[ease] hover:border-neutral-400 focus:border-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary"
              />
            </div>

            <div>
              <label
                htmlFor={updateFields.description.id}
                className="mb-[var(--space-sm)] block text-[length:var(--text-sm)] font-[var(--weight-medium)] text-neutral-700"
              >
                紹介文
              </label>
              <textarea
                {...getTextareaProps(updateFields.description)}
                rows={4}
                className="min-h-[88px] w-full rounded-[var(--radius-md)] border border-neutral-300 bg-white px-[var(--space-md)] py-[var(--space-sm)] text-[length:var(--text-base)] text-neutral-800 transition-[border-color] duration-[0.15s] ease-[ease] hover:border-neutral-400 focus:border-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary"
              />
            </div>

            <div>
              <span className="mb-[var(--space-sm)] block text-[length:var(--text-sm)] font-[var(--weight-medium)] text-neutral-700">
                店舗画像
              </span>
              <div className="mt-1 rounded-[var(--radius-md)] border-2 border-dashed border-neutral-300 p-[var(--space-lg)] text-center">
                <p className="text-[length:var(--text-sm)] text-neutral-500">
                  画像をドラッグ&ドロップまたはクリックしてアップロード（最大10枚）
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isPendingUpdate}
                className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] bg-primary px-[var(--space-lg)] text-[length:var(--text-sm)] font-[var(--weight-medium)] tracking-[var(--tracking-wide)] text-white transition-[background,transform] duration-[0.15s] ease-[ease] hover:bg-primary-dark active:scale-[0.99] disabled:opacity-50"
              >
                {isPendingUpdate ? "更新中..." : "更新する"}
              </button>
            </div>
          </fetcher.Form>
        </section>

        {/* テナント削除 */}
        <section className="rounded-[var(--radius-lg)] border border-error bg-white p-[var(--space-lg)]">
          <h2 className="mb-[var(--space-md)] font-[var(--font-heading)] text-[length:var(--text-lg)] font-[var(--weight-semibold)] tracking-[var(--tracking-tight)] text-error">
            テナント削除
          </h2>
          <p className="mb-[var(--space-md)] text-[length:var(--text-sm)] text-neutral-600">
            テナントを削除すると、すべてのデータ（メニュー、スタッフ、予約など）が完全に削除されます。この操作は取り消せません。
          </p>

          {showDeleteConfirm ? (
            <fetcher.Form
              method="post"
              {...getFormProps(deleteForm)}
              className="space-y-4"
            >
              <input type="hidden" name="intent" value="deleteTenant" />
              <div>
                <label
                  htmlFor={deleteFields.confirmName.id}
                  className="mb-[var(--space-sm)] block text-[length:var(--text-sm)] font-[var(--weight-medium)] text-neutral-700"
                >
                  確認のためテナント名「{tenant.name}」を入力
                </label>
                <input
                  {...getInputProps(deleteFields.confirmName, { type: "text" })}
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
                  className="h-11 w-full rounded-[var(--radius-md)] border border-neutral-300 bg-white px-[var(--space-md)] text-[length:var(--text-base)] text-neutral-800 transition-[border-color] duration-[0.15s] ease-[ease] focus:border-error focus:outline-2 focus:outline-offset-2 focus:outline-error"
                />
                {deleteFields.confirmName.errors && (
                  <p className="mt-1 text-[length:var(--text-xs)] text-error">
                    {deleteFields.confirmName.errors}
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={
                    isPendingDelete || deleteConfirmName !== tenant.name
                  }
                  className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] border border-error bg-white px-[var(--space-lg)] text-[length:var(--text-sm)] font-[var(--weight-medium)] text-error transition-[background,color] hover:bg-error hover:text-white disabled:opacity-50"
                >
                  {isPendingDelete ? "削除中..." : "テナントを削除"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmName("");
                  }}
                  className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] border border-neutral-300 bg-white px-[var(--space-lg)] text-[length:var(--text-sm)] font-[var(--weight-medium)] text-neutral-600 transition-colors hover:bg-neutral-200"
                >
                  キャンセル
                </button>
              </div>
            </fetcher.Form>
          ) : (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] border border-error bg-white px-[var(--space-lg)] text-[length:var(--text-sm)] font-[var(--weight-medium)] text-error transition-[background,color] hover:bg-error hover:text-white"
            >
              テナントを削除する
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
