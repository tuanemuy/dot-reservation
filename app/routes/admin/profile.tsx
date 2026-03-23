import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { type FormEvent, useRef, useState } from "react";
import { redirect } from "react-router";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { deleteMemberAccount } from "@/core/application/member/deleteMemberAccount";
import { updateMemberProfile } from "@/core/application/member/updateMemberProfile";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
  useCompositeAction,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/profile";

const updateProfileSchema = z.object({
  name: z.string().min(1, "氏名を入力してください"),
  email: z
    .string()
    .min(1, "メールアドレスを入力してください")
    .email("有効なメールアドレスを入力してください"),
  phoneNumber: z.string().optional(),
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "現在のパスワードを入力してください"),
    newPassword: z.string().min(8, "パスワードは8文字以上で入力してください"),
    newPasswordConfirmation: z
      .string()
      .min(1, "パスワード（確認）を入力してください"),
  })
  .refine((val) => val.newPassword === val.newPasswordConfirmation, {
    message: "パスワードが一致しません",
    path: ["newPasswordConfirmation"],
  });

const deleteAccountSchema = z.object({
  password: z.string().min(1, "パスワードを入力してください"),
});

const handlers = {
  updateProfile: defineHandler({
    schema: updateProfileSchema,
    handler: async (value, args) => {
      const { container } = await import("@/core/di/server");

      const session = await container.authProvider.getSession(
        args.request.headers,
      );
      if (!session) {
        throw redirect("/admin/login");
      }

      const members = await container.memberRepository.findByAuthUserId(
        session.user.id,
      );
      if (members.length === 0) {
        return error({ "": ["メンバー情報が見つかりません"] });
      }

      const results = await Promise.all(
        members.map((member) =>
          handleUseCase(() =>
            updateMemberProfile({
              container,
              headers: args.request.headers,
              input: {
                memberId: member.id,
                name: value.name,
                phoneNumber: value.phoneNumber || null,
              },
            }),
          ).match(
            () => true,
            () => false,
          ),
        ),
      );

      if (results.some((r) => !r)) {
        return error({ "": ["プロフィールの更新に失敗しました"] });
      }

      return success();
    },
  }),
  deleteAccount: defineHandler({
    schema: deleteAccountSchema,
    handler: async (_value, args) => {
      const { container } = await import("@/core/di/server");

      const session = await container.authProvider.getSession(
        args.request.headers,
      );
      if (!session) {
        throw redirect("/admin/login");
      }

      return handleUseCase(() =>
        deleteMemberAccount({
          container,
          headers: args.request.headers,
          input: { authUserId: session.user.id },
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

export async function loader({ request }: Route.LoaderArgs) {
  const { container } = await import("@/core/di/server");

  const session = await container.authProvider.getSession(request.headers);
  if (!session) {
    throw redirect("/admin/login");
  }

  const members = await container.memberRepository.findByAuthUserId(
    session.user.id,
  );
  const member = members[0];

  return {
    profile: {
      name: member?.name ?? session.user.name,
      email: session.user.email,
      phoneNumber: (member?.phoneNumber as string | null) ?? "",
    },
  };
}

export default function AdminProfilePage({ loaderData }: Route.ComponentProps) {
  const { profile } = loaderData;
  const fetcher = useCompositeAction<typeof handlers>();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isPendingPassword, setIsPendingPassword] = useState(false);
  const passwordFormRef = useRef<HTMLFormElement>(null);

  const [profileForm, profileFields] = useForm({
    id: "admin-profile-form",
    defaultValue: {
      name: profile.name,
      email: profile.email,
      phoneNumber: profile.phoneNumber,
    },
    lastResult:
      fetcher.data?.intent === "updateProfile" ? fetcher.data : undefined,
    constraint: getZodConstraint(handlers.updateProfile.schema),
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, {
        schema: handlers.updateProfile.schema,
      });
    },
  });

  const [passwordForm, passwordFields] = useForm({
    id: "admin-password-form",
    constraint: getZodConstraint(changePasswordSchema),
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, {
        schema: changePasswordSchema,
      });
    },
  });

  const [deleteForm, deleteFields] = useForm({
    id: "admin-delete-form",
    lastResult:
      fetcher.data?.intent === "deleteAccount" ? fetcher.data : undefined,
    constraint: getZodConstraint(handlers.deleteAccount.schema),
    shouldValidate: "onSubmit",
    onValidate({ formData }) {
      return parseWithZod(formData, {
        schema: handlers.deleteAccount.schema,
      });
    },
  });

  fetcher.register("updateProfile", {});

  fetcher.register("deleteAccount", {
    onSuccess: async () => {
      const { authClient } = await import("@/lib/authClient");
      await authClient.signOut();
      window.location.href = "/admin/login";
    },
  });

  const handlePasswordSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    const formData = new FormData(e.currentTarget);
    const result = parseWithZod(formData, { schema: changePasswordSchema });
    if (result.status !== "success") {
      return;
    }

    setIsPendingPassword(true);
    try {
      const { authClient } = await import("@/lib/authClient");
      const response = await authClient.changePassword({
        currentPassword: result.value.currentPassword,
        newPassword: result.value.newPassword,
      });

      if (response.error) {
        setPasswordError(
          response.error.message ?? "パスワードの変更に失敗しました",
        );
      } else {
        setPasswordSuccess(true);
        passwordFormRef.current?.reset();
      }
    } catch {
      setPasswordError("パスワードの変更に失敗しました");
    } finally {
      setIsPendingPassword(false);
    }
  };

  const isPendingProfile = fetcher.isPending("updateProfile");
  const isPendingDelete = fetcher.isPending("deleteAccount");

  return (
    <div>
      <div className="mb-[var(--space-xl)]">
        <h1 className="font-[var(--font-heading)] text-[length:var(--text-2xl)] font-[var(--weight-semibold)] leading-[var(--leading-tight)] tracking-[var(--tracking-tight)] text-neutral-900">
          プロフィール設定
        </h1>
        <p className="mt-[var(--space-xs)] text-[length:var(--text-sm)] text-neutral-500">
          メンバーアカウントの情報を管理します
        </p>
      </div>

      <div className="space-y-[var(--space-xl)]">
        {/* Profile Section */}
        <div className="rounded-[var(--radius-lg)] border border-neutral-300 bg-white">
          <div className="px-[var(--space-lg)] pt-[var(--space-lg)]">
            <h2 className="font-[var(--font-heading)] text-[length:var(--text-lg)] font-[var(--weight-semibold)] tracking-[var(--tracking-tight)] text-neutral-800">
              基本情報
            </h2>
          </div>
          <div className="px-[var(--space-lg)] py-[var(--space-lg)]">
            <fetcher.Form method="post" {...getFormProps(profileForm)}>
              <input type="hidden" name="intent" value="updateProfile" />
              <div className="grid grid-cols-2 gap-[var(--space-lg)]">
                <div>
                  <label
                    htmlFor={profileFields.name.id}
                    className="mb-[var(--space-sm)] block text-[length:var(--text-sm)] font-[var(--weight-medium)] tracking-[var(--tracking-wide)] text-neutral-700"
                  >
                    氏名
                  </label>
                  <input
                    {...getInputProps(profileFields.name, { type: "text" })}
                    className="h-11 w-full rounded-[var(--radius-md)] border border-neutral-300 bg-white px-[var(--space-md)] text-[length:var(--text-base)] text-neutral-900 transition-[border-color,box-shadow] duration-[0.15s] ease-[ease] hover:border-neutral-400 focus:border-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary"
                  />
                  {profileFields.name.errors && (
                    <p className="mt-1 text-[length:var(--text-xs)] text-error">
                      {profileFields.name.errors}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor={profileFields.email.id}
                    className="mb-[var(--space-sm)] block text-[length:var(--text-sm)] font-[var(--weight-medium)] tracking-[var(--tracking-wide)] text-neutral-700"
                  >
                    メールアドレス
                  </label>
                  <input
                    {...getInputProps(profileFields.email, { type: "email" })}
                    className="h-11 w-full rounded-[var(--radius-md)] border border-neutral-300 bg-white px-[var(--space-md)] text-[length:var(--text-base)] text-neutral-900 transition-[border-color,box-shadow] duration-[0.15s] ease-[ease] hover:border-neutral-400 focus:border-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary"
                  />
                  {profileFields.email.errors && (
                    <p className="mt-1 text-[length:var(--text-xs)] text-error">
                      {profileFields.email.errors}
                    </p>
                  )}
                </div>

                <div className="col-span-2">
                  <label
                    htmlFor={profileFields.phoneNumber.id}
                    className="mb-[var(--space-sm)] block text-[length:var(--text-sm)] font-[var(--weight-medium)] tracking-[var(--tracking-wide)] text-neutral-700"
                  >
                    電話番号
                  </label>
                  <input
                    {...getInputProps(profileFields.phoneNumber, {
                      type: "tel",
                    })}
                    placeholder="090-1234-5678"
                    className="h-11 w-full rounded-[var(--radius-md)] border border-neutral-300 bg-white px-[var(--space-md)] text-[length:var(--text-base)] text-neutral-900 placeholder:text-neutral-500 transition-[border-color,box-shadow] duration-[0.15s] ease-[ease] hover:border-neutral-400 focus:border-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary"
                  />
                </div>
              </div>

              {profileForm.errors && (
                <p className="mt-2 text-[length:var(--text-xs)] text-error">
                  {profileForm.errors}
                </p>
              )}
            </fetcher.Form>
          </div>
          <div className="flex justify-end gap-[var(--space-sm)] border-t border-neutral-200 px-[var(--space-lg)] py-[var(--space-lg)]">
            <button
              type="submit"
              form="admin-profile-form"
              disabled={isPendingProfile}
              className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] bg-primary px-[var(--space-lg)] text-[length:var(--text-sm)] font-[var(--weight-medium)] tracking-[var(--tracking-wide)] text-white transition-[background,transform] duration-[0.15s] ease-[ease] hover:bg-primary-dark active:scale-[0.99] disabled:opacity-50"
            >
              {isPendingProfile ? "更新中..." : "保存する"}
            </button>
          </div>
        </div>

        {/* Password Section */}
        <div className="rounded-[var(--radius-lg)] border border-neutral-300 bg-white">
          <div className="px-[var(--space-lg)] pt-[var(--space-lg)]">
            <h2 className="font-[var(--font-heading)] text-[length:var(--text-lg)] font-[var(--weight-semibold)] tracking-[var(--tracking-tight)] text-neutral-800">
              パスワード変更
            </h2>
          </div>
          <div className="px-[var(--space-lg)] py-[var(--space-lg)]">
            <form
              ref={passwordFormRef}
              {...getFormProps(passwordForm)}
              onSubmit={handlePasswordSubmit}
            >
              <div className="grid grid-cols-2 gap-[var(--space-lg)]">
                <div className="col-span-2">
                  <label
                    htmlFor={passwordFields.currentPassword.id}
                    className="mb-[var(--space-sm)] block text-[length:var(--text-sm)] font-[var(--weight-medium)] tracking-[var(--tracking-wide)] text-neutral-700"
                  >
                    現在のパスワード
                  </label>
                  <input
                    {...getInputProps(passwordFields.currentPassword, {
                      type: "password",
                    })}
                    className="h-11 w-full rounded-[var(--radius-md)] border border-neutral-300 bg-white px-[var(--space-md)] text-[length:var(--text-base)] text-neutral-900 transition-[border-color,box-shadow] duration-[0.15s] ease-[ease] hover:border-neutral-400 focus:border-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary"
                  />
                  {passwordFields.currentPassword.errors && (
                    <p className="mt-1 text-[length:var(--text-xs)] text-error">
                      {passwordFields.currentPassword.errors}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor={passwordFields.newPassword.id}
                    className="mb-[var(--space-sm)] block text-[length:var(--text-sm)] font-[var(--weight-medium)] tracking-[var(--tracking-wide)] text-neutral-700"
                  >
                    新しいパスワード
                  </label>
                  <input
                    {...getInputProps(passwordFields.newPassword, {
                      type: "password",
                    })}
                    placeholder="8文字以上"
                    className="h-11 w-full rounded-[var(--radius-md)] border border-neutral-300 bg-white px-[var(--space-md)] text-[length:var(--text-base)] text-neutral-900 placeholder:text-neutral-500 transition-[border-color,box-shadow] duration-[0.15s] ease-[ease] hover:border-neutral-400 focus:border-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary"
                  />
                  {passwordFields.newPassword.errors && (
                    <p className="mt-1 text-[length:var(--text-xs)] text-error">
                      {passwordFields.newPassword.errors}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor={passwordFields.newPasswordConfirmation.id}
                    className="mb-[var(--space-sm)] block text-[length:var(--text-sm)] font-[var(--weight-medium)] tracking-[var(--tracking-wide)] text-neutral-700"
                  >
                    新しいパスワード（確認）
                  </label>
                  <input
                    {...getInputProps(passwordFields.newPasswordConfirmation, {
                      type: "password",
                    })}
                    className="h-11 w-full rounded-[var(--radius-md)] border border-neutral-300 bg-white px-[var(--space-md)] text-[length:var(--text-base)] text-neutral-900 transition-[border-color,box-shadow] duration-[0.15s] ease-[ease] hover:border-neutral-400 focus:border-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary"
                  />
                  {passwordFields.newPasswordConfirmation.errors && (
                    <p className="mt-1 text-[length:var(--text-xs)] text-error">
                      {passwordFields.newPasswordConfirmation.errors}
                    </p>
                  )}
                </div>
              </div>

              {passwordError && (
                <p className="mt-2 text-[length:var(--text-xs)] text-error">
                  {passwordError}
                </p>
              )}
              {passwordSuccess && (
                <p className="mt-2 text-[length:var(--text-xs)] text-success">
                  パスワードを変更しました
                </p>
              )}
              {passwordForm.errors && (
                <p className="mt-2 text-[length:var(--text-xs)] text-error">
                  {passwordForm.errors}
                </p>
              )}
            </form>
          </div>
          <div className="flex justify-end gap-[var(--space-sm)] border-t border-neutral-200 px-[var(--space-lg)] py-[var(--space-lg)]">
            <button
              type="submit"
              form="admin-password-form"
              disabled={isPendingPassword}
              className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] bg-primary px-[var(--space-lg)] text-[length:var(--text-sm)] font-[var(--weight-medium)] tracking-[var(--tracking-wide)] text-white transition-[background,transform] duration-[0.15s] ease-[ease] hover:bg-primary-dark active:scale-[0.99] disabled:opacity-50"
            >
              {isPendingPassword ? "変更中..." : "パスワードを変更"}
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="rounded-[var(--radius-lg)] border border-error bg-white">
          <div className="px-[var(--space-lg)] pt-[var(--space-lg)]">
            <h2 className="font-[var(--font-heading)] text-[length:var(--text-lg)] font-[var(--weight-semibold)] tracking-[var(--tracking-tight)] text-error">
              アカウント削除
            </h2>
          </div>
          <div className="px-[var(--space-lg)] py-[var(--space-lg)]">
            <div className="mb-[var(--space-lg)] flex items-start gap-[var(--space-sm)] rounded-[var(--radius-md)] bg-[var(--color-error-bg)] p-[var(--space-md)] text-[length:var(--text-sm)] leading-[var(--leading-normal)] text-error">
              <svg
                className="mt-0.5 h-[18px] w-[18px] shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
              アカウントを削除すると、すべてのデータが完全に削除されます。この操作は取り消せません。唯一の管理者の場合は削除できません。
            </div>
            <button
              type="button"
              onClick={() => setShowDeleteDialog(true)}
              className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] border border-error bg-white px-[var(--space-lg)] text-[length:var(--text-sm)] font-[var(--weight-medium)] tracking-[var(--tracking-wide)] text-error transition-[background,color,transform] duration-[0.15s] ease-[ease] hover:bg-error hover:text-white active:scale-[0.99]"
            >
              アカウントを削除する
            </button>
          </div>
        </div>
      </div>

      <Modal
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title="本当にアカウントを削除しますか？"
      >
        <p className="mb-4 text-[length:var(--text-sm)] text-neutral-600">
          この操作は取り消せません。確認のためパスワードを入力してください。
        </p>
        <fetcher.Form method="post" {...getFormProps(deleteForm)}>
          <input type="hidden" name="intent" value="deleteAccount" />
          <div className="mb-4">
            <label
              htmlFor={deleteFields.password.id}
              className="mb-[var(--space-sm)] block text-[length:var(--text-sm)] font-[var(--weight-medium)] text-neutral-700"
            >
              パスワード
            </label>
            <input
              {...getInputProps(deleteFields.password, {
                type: "password",
              })}
              className="h-11 w-full rounded-[var(--radius-md)] border border-neutral-300 bg-white px-[var(--space-md)] text-[length:var(--text-base)] text-neutral-900 transition-[border-color] duration-[0.15s] ease-[ease] focus:border-error focus:outline-2 focus:outline-offset-2 focus:outline-error"
            />
            {deleteFields.password.errors && (
              <p className="mt-1 text-[length:var(--text-xs)] text-error">
                {deleteFields.password.errors}
              </p>
            )}
          </div>
          {deleteForm.errors && (
            <p className="mb-4 text-[length:var(--text-xs)] text-error">
              {deleteForm.errors}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowDeleteDialog(false)}
              className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] border border-neutral-300 bg-white px-[var(--space-lg)] text-[length:var(--text-sm)] font-[var(--weight-medium)] text-neutral-600 transition-colors hover:bg-neutral-200"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isPendingDelete}
              className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] border border-error bg-white px-[var(--space-lg)] text-[length:var(--text-sm)] font-[var(--weight-medium)] text-error transition-[background,color] hover:bg-error hover:text-white disabled:opacity-50"
            >
              {isPendingDelete ? "削除中..." : "削除する"}
            </button>
          </div>
        </fetcher.Form>
      </Modal>
    </div>
  );
}
