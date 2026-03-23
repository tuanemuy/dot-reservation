import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { type FormEvent, useRef, useState } from "react";
import { data, redirect } from "react-router";
import { z } from "zod";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { deleteCustomer } from "@/core/application/customer/deleteCustomer";
import { getCustomer } from "@/core/application/customer/getCustomer";
import { updateCustomerProfile } from "@/core/application/customer/updateCustomerProfile";
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
  customerId: z.string().min(1),
  displayName: z.string().min(1, "表示名を入力してください"),
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
  customerId: z.string().min(1),
  password: z.string().min(1, "パスワードを入力してください"),
});

const handlers = {
  updateProfile: defineHandler({
    schema: updateProfileSchema,
    handler: async (value, args) => {
      const { container } = await import("@/core/di/server");

      return handleUseCase(() =>
        updateCustomerProfile({
          container,
          headers: args.request.headers,
          input: {
            customerId: value.customerId,
            displayName: value.displayName,
            phoneNumber: value.phoneNumber || null,
          },
        }),
      ).match(
        () => success(),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
  deleteAccount: defineHandler({
    schema: deleteAccountSchema,
    handler: async (value, args) => {
      const { container } = await import("@/core/di/server");

      return handleUseCase(() =>
        deleteCustomer({
          container,
          headers: args.request.headers,
          input: {
            customerId: value.customerId,
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

export async function loader({ request }: Route.LoaderArgs) {
  const { container } = await import("@/core/di/server");

  const session = await container.authProvider.getSession(request.headers);
  if (!session) {
    throw redirect("/customer/login");
  }
  const customer = await container.customerRepository.findByAuthUserId(
    session.user.id,
  );
  if (!customer) {
    throw redirect("/customer/setup");
  }
  const customerId = customer.id;

  const customerDetail = await handleUseCase(() =>
    getCustomer({
      container,
      headers: request.headers,
      input: { customerId },
    }),
  ).match(
    (r) => r,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  return {
    profile: {
      id: customerDetail.id,
      displayName: customerDetail.displayName,
      email: customerDetail.email,
      phoneNumber: customerDetail.phoneNumber,
    },
  };
}

export default function ProfilePage({ loaderData }: Route.ComponentProps) {
  const { profile } = loaderData;
  const fetcher = useCompositeAction<typeof handlers>();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isPendingPassword, setIsPendingPassword] = useState(false);
  const passwordFormRef = useRef<HTMLFormElement>(null);

  const [profileForm, profileFields] = useForm({
    id: "profile-form",
    defaultValue: {
      customerId: profile.id,
      displayName: profile.displayName,
      email: profile.email,
      phoneNumber: profile.phoneNumber ?? "",
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
    id: "password-form",
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
    id: "delete-form",
    defaultValue: {
      customerId: profile.id,
    },
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
    onSuccess: () => {
      setShowDeleteDialog(false);
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

  const cardStyle: React.CSSProperties = {
    background: "var(--color-bg-card)",
    border: "1px solid var(--color-neutral-300)",
    borderRadius: "var(--radius-lg)",
    padding: "var(--space-xl)",
    marginBottom: "var(--space-xl)",
  };

  const cardTitleStyle: React.CSSProperties = {
    fontFamily: "var(--font-heading)",
    fontSize: "var(--text-lg)",
    fontWeight: "var(--weight-semibold)",
    color: "var(--color-neutral-800)",
    letterSpacing: "var(--tracking-tight)",
    marginBottom: "var(--space-lg)",
    paddingBottom: "var(--space-sm)",
    borderBottom: "1px solid var(--color-neutral-200)",
  };

  return (
    <div>
      <h1
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "var(--text-2xl)",
          fontWeight: "var(--weight-semibold)",
          color: "var(--color-neutral-900)",
          letterSpacing: "var(--tracking-tight)",
          lineHeight: "var(--leading-tight)",
          marginBottom: "var(--space-xl)",
        }}
      >
        プロフィール設定
      </h1>

      {/* Profile Form */}
      <div style={cardStyle}>
        <h2 style={cardTitleStyle}>基本情報</h2>
        <fetcher.Form method="post" {...getFormProps(profileForm)}>
          <input type="hidden" name="intent" value="updateProfile" />
          <input type="hidden" name="customerId" value={profile.id} />

          <FormField
            label="表示名"
            htmlFor={profileFields.displayName.id}
            error={profileFields.displayName.errors}
            required
          >
            <Input
              {...getInputProps(profileFields.displayName, { type: "text" })}
              error={profileFields.displayName.errors?.[0]}
            />
          </FormField>

          <FormField
            label="メールアドレス"
            htmlFor={profileFields.email.id}
            error={profileFields.email.errors}
            required
          >
            <Input
              {...getInputProps(profileFields.email, { type: "email" })}
              error={profileFields.email.errors?.[0]}
              disabled
            />
          </FormField>

          <FormField label="電話番号" htmlFor={profileFields.phoneNumber.id}>
            <Input
              {...getInputProps(profileFields.phoneNumber, { type: "tel" })}
              placeholder="090-1234-5678"
            />
            <p
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--color-neutral-500)",
                marginTop: "var(--space-xs)",
              }}
            >
              予約確認の連絡に使用されます
            </p>
          </FormField>

          {profileForm.errors && (
            <p
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--color-error)",
                marginBottom: "var(--space-md)",
              }}
            >
              {profileForm.errors}
            </p>
          )}

          <div style={{ marginTop: "var(--space-xl)" }}>
            <button
              type="submit"
              disabled={isPendingProfile}
              className="inline-flex items-center justify-center"
              style={{
                gap: "var(--space-sm)",
                height: "44px",
                padding: "0 var(--space-xl)",
                background: "var(--color-primary)",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "var(--radius-md)",
                fontSize: "var(--text-base)",
                fontWeight: "var(--weight-medium)",
                cursor: isPendingProfile ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                opacity: isPendingProfile ? 0.5 : 1,
              }}
            >
              <svg
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
                aria-hidden="true"
                style={{ width: "16px", height: "16px" }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
              {isPendingProfile ? "保存中..." : "保存する"}
            </button>
          </div>
        </fetcher.Form>
      </div>

      {/* Password Change */}
      <div style={cardStyle}>
        <h2 style={cardTitleStyle}>パスワード変更</h2>
        <form
          ref={passwordFormRef}
          {...getFormProps(passwordForm)}
          onSubmit={handlePasswordSubmit}
        >
          <FormField
            label="現在のパスワード"
            htmlFor={passwordFields.currentPassword.id}
            error={passwordFields.currentPassword.errors}
            required
          >
            <Input
              {...getInputProps(passwordFields.currentPassword, {
                type: "password",
              })}
              placeholder="現在のパスワードを入力"
              error={passwordFields.currentPassword.errors?.[0]}
            />
          </FormField>

          <FormField
            label="新しいパスワード"
            htmlFor={passwordFields.newPassword.id}
            error={passwordFields.newPassword.errors}
            required
          >
            <Input
              {...getInputProps(passwordFields.newPassword, {
                type: "password",
              })}
              placeholder="新しいパスワードを入力"
              error={passwordFields.newPassword.errors?.[0]}
            />
            <p
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--color-neutral-500)",
                marginTop: "var(--space-xs)",
              }}
            >
              8文字以上で、英数字を含めてください
            </p>
          </FormField>

          <FormField
            label="パスワード確認"
            htmlFor={passwordFields.newPasswordConfirmation.id}
            error={passwordFields.newPasswordConfirmation.errors}
            required
          >
            <Input
              {...getInputProps(passwordFields.newPasswordConfirmation, {
                type: "password",
              })}
              placeholder="新しいパスワードを再入力"
              error={passwordFields.newPasswordConfirmation.errors?.[0]}
            />
          </FormField>

          {passwordError && (
            <p
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--color-error)",
                marginBottom: "var(--space-md)",
              }}
            >
              {passwordError}
            </p>
          )}

          {passwordSuccess && (
            <p
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--color-success)",
                marginBottom: "var(--space-md)",
              }}
            >
              パスワードを変更しました
            </p>
          )}

          {passwordForm.errors && (
            <p
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--color-error)",
                marginBottom: "var(--space-md)",
              }}
            >
              {passwordForm.errors}
            </p>
          )}

          <div style={{ marginTop: "var(--space-xl)" }}>
            <button
              type="submit"
              disabled={isPendingPassword}
              className="inline-flex items-center justify-center"
              style={{
                gap: "var(--space-sm)",
                height: "44px",
                padding: "0 var(--space-xl)",
                background: "var(--color-bg-card)",
                border: "1px solid var(--color-neutral-300)",
                borderRadius: "var(--radius-md)",
                fontSize: "var(--text-base)",
                fontWeight: "var(--weight-medium)",
                color: "var(--color-neutral-700)",
                cursor: isPendingPassword ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                opacity: isPendingPassword ? 0.5 : 1,
              }}
            >
              {isPendingPassword ? "変更中..." : "パスワードを変更する"}
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      <div
        style={{
          background: "var(--color-bg-card)",
          border: "1px solid oklch(0.55 0.16 25 / 0.2)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--space-xl)",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "var(--text-lg)",
            fontWeight: "var(--weight-semibold)",
            color: "var(--color-error)",
            letterSpacing: "var(--tracking-tight)",
            marginBottom: "var(--space-sm)",
          }}
        >
          アカウント削除
        </h2>
        <p
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--color-neutral-600)",
            lineHeight: "var(--leading-relaxed)",
            marginBottom: "var(--space-lg)",
          }}
        >
          アカウントを削除すると、すべての予約履歴やプロフィール情報が完全に削除されます。この操作は取り消すことができません。
        </p>
        <button
          type="button"
          onClick={() => setShowDeleteDialog(true)}
          className="inline-flex items-center justify-center"
          style={{
            gap: "var(--space-sm)",
            height: "44px",
            padding: "0 var(--space-xl)",
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-error)",
            borderRadius: "var(--radius-md)",
            fontSize: "var(--text-base)",
            fontWeight: "var(--weight-medium)",
            color: "var(--color-error)",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <svg
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
            aria-hidden="true"
            style={{ width: "16px", height: "16px" }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          アカウントを削除する
        </button>
      </div>

      {/* Delete Modal */}
      <Modal
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title="本当にアカウントを削除しますか？"
      >
        <p
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--color-neutral-600)",
            marginBottom: "var(--space-lg)",
          }}
        >
          この操作は取り消せません。確認のためパスワードを入力してください。
        </p>
        <fetcher.Form method="post" {...getFormProps(deleteForm)}>
          <input type="hidden" name="intent" value="deleteAccount" />
          <input type="hidden" name="customerId" value={profile.id} />
          <div style={{ marginBottom: "var(--space-lg)" }}>
            <FormField
              label="パスワード"
              htmlFor={deleteFields.password.id}
              error={deleteFields.password.errors}
              required
            >
              <Input
                {...getInputProps(deleteFields.password, {
                  type: "password",
                })}
                error={deleteFields.password.errors?.[0]}
              />
            </FormField>
          </div>
          {deleteForm.errors && (
            <p
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--color-error)",
                marginBottom: "var(--space-md)",
              }}
            >
              {deleteForm.errors}
            </p>
          )}
          <div className="flex justify-end" style={{ gap: "var(--space-md)" }}>
            <button
              type="button"
              onClick={() => setShowDeleteDialog(false)}
              className="inline-flex items-center justify-center"
              style={{
                height: "44px",
                padding: "0 var(--space-xl)",
                background: "var(--color-bg-card)",
                border: "1px solid var(--color-neutral-300)",
                borderRadius: "var(--radius-md)",
                fontSize: "var(--text-base)",
                fontWeight: "var(--weight-medium)",
                color: "var(--color-neutral-700)",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isPendingDelete}
              className="inline-flex items-center justify-center"
              style={{
                height: "44px",
                padding: "0 var(--space-xl)",
                background: "var(--color-error)",
                border: "none",
                borderRadius: "var(--radius-md)",
                fontSize: "var(--text-base)",
                fontWeight: "var(--weight-medium)",
                color: "#FFFFFF",
                cursor: isPendingDelete ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                opacity: isPendingDelete ? 0.5 : 1,
              }}
            >
              {isPendingDelete ? "削除中..." : "削除する"}
            </button>
          </div>
        </fetcher.Form>
      </Modal>
    </div>
  );
}
