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
            staffProfileId: args.params.staffId as string,
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
            staffProfileId: args.params.staffId as string,
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
    <div>
      <div className="mb-[var(--space-xl)]">
        <Link
          to={`/admin/${tenantId}/staff`}
          className="inline-flex items-center gap-[var(--space-xs)] text-[length:var(--text-sm)] font-[var(--weight-medium)] text-neutral-500 transition-colors hover:text-primary"
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
          スタッフ一覧に戻る
        </Link>
        <h1 className="mt-[var(--space-sm)] font-[var(--font-heading)] text-[length:var(--text-2xl)] font-[var(--weight-semibold)] leading-[var(--leading-tight)] tracking-[var(--tracking-tight)] text-neutral-900">
          スタッフ詳細
        </h1>
      </div>

      <div className="max-w-2xl space-y-[var(--space-xl)]">
        {/* プロフィール編集 */}
        <section className="rounded-[var(--radius-lg)] border border-neutral-300 bg-white p-[var(--space-lg)]">
          <h2 className="mb-[var(--space-md)] font-[var(--font-heading)] text-[length:var(--text-lg)] font-[var(--weight-semibold)] tracking-[var(--tracking-tight)] text-neutral-800">
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
                className="mb-[var(--space-sm)] block text-[length:var(--text-sm)] font-[var(--weight-medium)] tracking-[var(--tracking-wide)] text-neutral-700"
              >
                スタッフ表示名
              </label>
              <input
                {...getInputProps(profileFields.name, { type: "text" })}
                className="h-11 w-full rounded-[var(--radius-md)] border border-neutral-300 bg-white px-[var(--space-md)] text-[length:var(--text-base)] text-neutral-800 transition-[border-color,box-shadow] duration-[0.15s] ease-[ease] hover:border-neutral-400 focus:border-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary"
              />
              {profileFields.name.errors && (
                <p className="mt-1 text-[length:var(--text-xs)] text-error">
                  {profileFields.name.errors}
                </p>
              )}
            </div>

            <div className="flex items-center gap-[var(--space-md)]">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary-lighter text-secondary">
                {staff.imageUrl ? (
                  <img
                    src={staff.imageUrl}
                    alt={staff.displayName}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-[length:var(--text-xl)] font-[var(--weight-medium)]">
                    {staff.displayName.charAt(0)}
                  </span>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor={profileFields.bio.id}
                className="mb-[var(--space-sm)] block text-[length:var(--text-sm)] font-[var(--weight-medium)] tracking-[var(--tracking-wide)] text-neutral-700"
              >
                自己紹介文
              </label>
              <textarea
                id={profileFields.bio.id}
                name={profileFields.bio.name}
                rows={3}
                defaultValue={staff.bio ?? ""}
                className="min-h-[88px] w-full rounded-[var(--radius-md)] border border-neutral-300 bg-white px-[var(--space-md)] py-[var(--space-sm)] text-[length:var(--text-base)] text-neutral-800 transition-[border-color,box-shadow] duration-[0.15s] ease-[ease] hover:border-neutral-400 focus:border-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isPendingProfile}
                className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] bg-primary px-[var(--space-lg)] text-[length:var(--text-sm)] font-[var(--weight-medium)] tracking-[var(--tracking-wide)] text-white transition-[background,transform] duration-[0.15s] ease-[ease] hover:bg-primary-dark active:scale-[0.99] disabled:opacity-50"
              >
                {isPendingProfile ? "更新中..." : "プロフィールを更新"}
              </button>
            </div>
          </fetcher.Form>
        </section>

        {/* 担当メニュー設定 */}
        <section className="rounded-[var(--radius-lg)] border border-neutral-300 bg-white p-[var(--space-lg)]">
          <h2 className="mb-[var(--space-md)] font-[var(--font-heading)] text-[length:var(--text-lg)] font-[var(--weight-semibold)] tracking-[var(--tracking-tight)] text-neutral-800">
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
                  className="flex cursor-pointer items-center gap-[var(--space-sm)] rounded-[var(--radius-md)] px-[var(--space-md)] py-[var(--space-sm)] transition-colors hover:bg-neutral-50"
                >
                  <input
                    type="checkbox"
                    checked={menu.isAssigned}
                    onChange={() => toggleMenu(menu.id)}
                    className="h-4 w-4 rounded border-neutral-300 text-primary accent-primary focus:ring-primary"
                  />
                  <span className="text-[length:var(--text-sm)] text-neutral-800">
                    {menu.name}
                  </span>
                </label>
              ))}
            </div>

            {assignedMenus.length === 0 && (
              <p className="text-[length:var(--text-sm)] text-neutral-500">
                メニューが登録されていません。先にメニューを登録してください。
              </p>
            )}

            <div className="mt-[var(--space-lg)] flex justify-end">
              <button
                type="submit"
                disabled={isPendingMenus}
                className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] bg-primary px-[var(--space-lg)] text-[length:var(--text-sm)] font-[var(--weight-medium)] tracking-[var(--tracking-wide)] text-white transition-[background,transform] duration-[0.15s] ease-[ease] hover:bg-primary-dark active:scale-[0.99] disabled:opacity-50"
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
