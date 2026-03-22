import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { useState } from "react";
import { data, Link } from "react-router";
import { z } from "zod";
import { listMenus } from "@/core/application/menu/listMenus";
import { getStaffProfile } from "@/core/application/staff/getStaffProfile";
import { updateAssignedMenus } from "@/core/application/staff/updateAssignedMenus";
import { updateStaffProfile } from "@/core/application/staff/updateStaffProfile";
import { container } from "@/core/di/server";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
  useCompositeAction,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/$staffId";

export async function loader({ params, request }: Route.LoaderArgs) {
  const staffResult = await handleUseCase(() =>
    getStaffProfile({
      container,
      headers: request.headers,
      input: { staffProfileId: params.staffId },
    }),
  ).match(
    (result) => result,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  const menusResult = await handleUseCase(() =>
    listMenus({
      container,
      headers: request.headers,
      input: { tenantId: params.tenantId },
    }),
  ).match(
    (result) => result,
    () => ({ items: [] }),
  );

  const allMenus = menusResult.items.map((m) => ({
    id: m.id,
    name: m.name,
    isAssigned: staffResult.assignedMenus.some((am) => am.id === m.id),
  }));

  return { staff: staffResult, allMenus };
}

const updateProfileSchema = z.object({
  name: z.string().min(1, "スタッフ表示名を入力してください"),
  bio: z.string().optional().default(""),
});

const updateMenusSchema = z.object({
  assignedMenuIds: z.string().min(1),
});

export const handlers = {
  updateProfile: defineHandler({
    schema: updateProfileSchema,
    handler: async (value, args) => {
      return handleUseCase(() =>
        updateStaffProfile({
          container,
          headers: args.request.headers,
          input: {
            staffProfileId: args.params.staffId!,
            displayName: value.name,
            imageUrl: null,
            bio: value.bio || null,
          },
        }),
      ).match(
        (result) => success({ displayName: result.displayName }),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
  updateMenus: defineHandler({
    schema: updateMenusSchema,
    handler: async (value, args) => {
      const menuIds = JSON.parse(value.assignedMenuIds) as string[];
      return handleUseCase(() =>
        updateAssignedMenus({
          container,
          headers: args.request.headers,
          input: {
            staffProfileId: args.params.staffId!,
            menuIds,
          },
        }),
      ).match(
        () => success(),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}

export default function TenantStaffDetailPage({
  loaderData,
  params,
}: Route.ComponentProps) {
  const tenantId = params.tenantId;
  const { staff, allMenus: initialMenus } = loaderData;
  const fetcher = useCompositeAction<typeof handlers>();
  const [assignedMenus, setAssignedMenus] = useState(
    initialMenus.map((m) => ({ ...m })),
  );

  const [profileForm, profileFields] = useForm({
    id: "update-profile-form",
    lastResult:
      fetcher.data?.intent === "updateProfile" ? fetcher.data : undefined,
    constraint: getZodConstraint(handlers.updateProfile.schema),
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    defaultValue: {
      name: staff.displayName,
      bio: staff.bio ?? "",
    },
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: handlers.updateProfile.schema });
    },
  });

  const toggleMenu = (menuId: string) => {
    setAssignedMenus((prev) =>
      prev.map((m) =>
        m.id === menuId ? { ...m, isAssigned: !m.isAssigned } : m,
      ),
    );
  };

  const isPendingProfile = fetcher.isPending("updateProfile");
  const isPendingMenus = fetcher.isPending("updateMenus");

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          to={`/admin/${tenantId}/staff`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; スタッフ一覧に戻る
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">スタッフ詳細</h1>
      </div>

      <div className="max-w-2xl space-y-8">
        {/* プロフィール編集 */}
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            プロフィール
          </h2>
          <fetcher.Form
            method="post"
            {...getFormProps(profileForm)}
            className="space-y-4"
          >
            <input type="hidden" name="intent" value="updateProfile" />

            <div>
              <label
                htmlFor={profileFields.name.id}
                className="block text-sm font-medium text-gray-700"
              >
                スタッフ表示名
              </label>
              <input
                {...getInputProps(profileFields.name, { type: "text" })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {profileFields.name.errors && (
                <p className="mt-1 text-sm text-red-600">
                  {profileFields.name.errors}
                </p>
              )}
            </div>

            <div>
              <span className="block text-sm font-medium text-gray-700">
                プロフィール画像
              </span>
              <div className="mt-1 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 text-gray-500">
                  {staff.imageUrl ? (
                    <img
                      src={staff.imageUrl}
                      alt={staff.displayName}
                      className="h-16 w-16 rounded-full object-cover"
                    />
                  ) : (
                    <svg
                      className="h-8 w-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  )}
                </div>
                <button
                  type="button"
                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  画像を変更
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor={profileFields.bio.id}
                className="block text-sm font-medium text-gray-700"
              >
                自己紹介文
              </label>
              <textarea
                id={profileFields.bio.id}
                name={profileFields.bio.name}
                rows={3}
                defaultValue={staff.bio ?? ""}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isPendingProfile}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isPendingProfile ? "更新中..." : "プロフィールを更新"}
              </button>
            </div>
          </fetcher.Form>
        </section>

        {/* 担当メニュー設定 */}
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            担当メニュー
          </h2>
          <fetcher.Form method="post">
            <input type="hidden" name="intent" value="updateMenus" />
            <input
              type="hidden"
              name="assignedMenuIds"
              value={JSON.stringify(
                assignedMenus.filter((m) => m.isAssigned).map((m) => m.id),
              )}
            />

            <div className="space-y-3">
              {assignedMenus.map((menu) => (
                <label
                  key={menu.id}
                  className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={menu.isAssigned}
                    onChange={() => toggleMenu(menu.id)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-900">{menu.name}</span>
                </label>
              ))}
            </div>

            {assignedMenus.length === 0 && (
              <p className="text-sm text-gray-500">
                メニューが登録されていません。先にメニューを登録してください。
              </p>
            )}

            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={isPendingMenus}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isPendingMenus ? "保存中..." : "担当メニューを保存"}
              </button>
            </div>
          </fetcher.Form>
        </section>
      </div>
    </div>
  );
}
