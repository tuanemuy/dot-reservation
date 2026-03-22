import {
  getFormProps,
  getInputProps,
  getTextareaProps,
  useForm,
} from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { useState } from "react";
import { data, redirect } from "react-router";
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
            tenantId: args.params.tenantId!,
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
          input: { tenantId: args.params.tenantId! },
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
      console.error(err?.[""]?.[0] ?? "更新に失敗しました");
    },
  });

  fetcher.register("deleteTenant", {
    onHandlerError: ({ error: err }) => {
      console.error(err?.[""]?.[0] ?? "削除に失敗しました");
    },
  });

  const isPendingUpdate = fetcher.isPending("updateTenant");
  const isPendingDelete = fetcher.isPending("deleteTenant");

  return (
    <div className="p-8">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">テナント設定</h1>

      <div className="max-w-2xl space-y-8">
        {/* テナント情報編集 */}
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">基本情報</h2>
          <fetcher.Form
            method="post"
            {...getFormProps(updateForm)}
            className="space-y-4"
          >
            <input type="hidden" name="intent" value="updateTenant" />

            <div>
              <label
                htmlFor={updateFields.name.id}
                className="block text-sm font-medium text-gray-700"
              >
                テナント名
              </label>
              <input
                {...getInputProps(updateFields.name, { type: "text" })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {updateFields.name.errors && (
                <p className="mt-1 text-sm text-red-600">
                  {updateFields.name.errors}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor={updateFields.category.id}
                className="block text-sm font-medium text-gray-700"
              >
                カテゴリー
              </label>
              <select
                {...getInputProps(updateFields.category, { type: "text" })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="hair">美容室</option>
                <option value="nail">ネイルサロン</option>
                <option value="esthetic">エステサロン</option>
                <option value="clinic">クリニック</option>
                <option value="other">その他</option>
              </select>
              {updateFields.category.errors && (
                <p className="mt-1 text-sm text-red-600">
                  {updateFields.category.errors}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor={updateFields.urlPath.id}
                className="block text-sm font-medium text-gray-700"
              >
                URLパス
              </label>
              <input
                {...getInputProps(updateFields.urlPath, { type: "text" })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {updateFields.urlPath.errors && (
                <p className="mt-1 text-sm text-red-600">
                  {updateFields.urlPath.errors}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor={updateFields.address.id}
                className="block text-sm font-medium text-gray-700"
              >
                住所
              </label>
              <input
                {...getInputProps(updateFields.address, { type: "text" })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor={updateFields.phone.id}
                className="block text-sm font-medium text-gray-700"
              >
                電話番号
              </label>
              <input
                {...getInputProps(updateFields.phone, { type: "tel" })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor={updateFields.description.id}
                className="block text-sm font-medium text-gray-700"
              >
                紹介文
              </label>
              <textarea
                {...getTextareaProps(updateFields.description)}
                rows={4}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <span className="block text-sm font-medium text-gray-700">
                店舗画像
              </span>
              <div className="mt-1 rounded-md border-2 border-dashed border-gray-300 p-6 text-center">
                <p className="text-sm text-gray-500">
                  画像をドラッグ&ドロップまたはクリックしてアップロード（最大10枚）
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isPendingUpdate}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isPendingUpdate ? "更新中..." : "更新する"}
              </button>
            </div>
          </fetcher.Form>
        </section>

        {/* テナント削除 */}
        <section className="rounded-lg border border-red-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-red-600">
            テナント削除
          </h2>
          <p className="mb-4 text-sm text-gray-600">
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
                  className="block text-sm font-medium text-gray-700"
                >
                  確認のためテナント名「{tenant.name}」を入力
                </label>
                <input
                  {...getInputProps(deleteFields.confirmName, { type: "text" })}
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                {deleteFields.confirmName.errors && (
                  <p className="mt-1 text-sm text-red-600">
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
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {isPendingDelete ? "削除中..." : "テナントを削除"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmName("");
                  }}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  キャンセル
                </button>
              </div>
            </fetcher.Form>
          ) : (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              テナントを削除する
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
