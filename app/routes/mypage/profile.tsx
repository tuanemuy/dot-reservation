import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { type FormEvent, useRef, useState } from "react";
import { data, redirect } from "react-router";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-6 text-2xl font-bold text-text">プロフィール設定</h1>

        <Card>
          <CardBody>
            <h2 className="mb-4 text-lg font-semibold text-text">基本情報</h2>
            <fetcher.Form method="post" {...getFormProps(profileForm)}>
              <input type="hidden" name="intent" value="updateProfile" />
              <input type="hidden" name="customerId" value={profile.id} />

              <div className="space-y-5">
                <FormField
                  label="表示名"
                  htmlFor={profileFields.displayName.id}
                  error={profileFields.displayName.errors}
                  required
                >
                  <Input
                    {...getInputProps(profileFields.displayName, {
                      type: "text",
                    })}
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

                <FormField
                  label="電話番号"
                  htmlFor={profileFields.phoneNumber.id}
                >
                  <Input
                    {...getInputProps(profileFields.phoneNumber, {
                      type: "tel",
                    })}
                    placeholder="090-1234-5678"
                  />
                </FormField>

                {profileForm.errors && (
                  <p className="text-xs text-destructive">
                    {profileForm.errors}
                  </p>
                )}

                <Button type="submit" disabled={isPendingProfile}>
                  {isPendingProfile ? "更新中..." : "プロフィールを更新"}
                </Button>
              </div>
            </fetcher.Form>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardBody>
          <h2 className="mb-4 text-lg font-semibold text-text">
            パスワード変更
          </h2>
          <form
            ref={passwordFormRef}
            {...getFormProps(passwordForm)}
            onSubmit={handlePasswordSubmit}
          >
            <div className="space-y-5">
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
                  placeholder="8文字以上"
                  error={passwordFields.newPassword.errors?.[0]}
                />
              </FormField>

              <FormField
                label="新しいパスワード（確認）"
                htmlFor={passwordFields.newPasswordConfirmation.id}
                error={passwordFields.newPasswordConfirmation.errors}
                required
              >
                <Input
                  {...getInputProps(passwordFields.newPasswordConfirmation, {
                    type: "password",
                  })}
                  error={passwordFields.newPasswordConfirmation.errors?.[0]}
                />
              </FormField>

              {passwordError && (
                <p className="text-xs text-destructive">{passwordError}</p>
              )}

              {passwordSuccess && (
                <p className="text-xs text-green-600">
                  パスワードを変更しました
                </p>
              )}

              {passwordForm.errors && (
                <p className="text-xs text-destructive">
                  {passwordForm.errors}
                </p>
              )}

              <Button type="submit" disabled={isPendingPassword}>
                {isPendingPassword ? "変更中..." : "パスワードを変更"}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card className="border-destructive/30">
        <CardBody>
          <h2 className="mb-2 text-lg font-semibold text-destructive">
            アカウント削除
          </h2>
          <p className="mb-4 text-sm text-text-secondary">
            アカウントを削除すると、すべてのデータが完全に削除されます。この操作は取り消せません。
          </p>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            アカウントを削除
          </Button>
        </CardBody>
      </Card>

      <Modal
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title="本当にアカウントを削除しますか？"
      >
        <p className="mb-4 text-sm text-text-secondary">
          この操作は取り消せません。確認のためパスワードを入力してください。
        </p>
        <fetcher.Form method="post" {...getFormProps(deleteForm)}>
          <input type="hidden" name="intent" value="deleteAccount" />
          <input type="hidden" name="customerId" value={profile.id} />
          <div className="mb-4">
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
            <p className="mb-4 text-xs text-destructive">{deleteForm.errors}</p>
          )}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isPendingDelete}
            >
              {isPendingDelete ? "削除中..." : "削除する"}
            </Button>
          </div>
        </fetcher.Form>
      </Modal>
    </div>
  );
}
