import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { type FormEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { changePasswordSchema } from "@/routes/mypage/profile/action";
import { cardClass, cardTitleClass } from "./styles";

export function PasswordChangeForm() {
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isPendingPassword, setIsPendingPassword] = useState(false);
  const passwordFormRef = useRef<HTMLFormElement>(null);

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

  return (
    <div className={cardClass}>
      <h2 className={cardTitleClass}>パスワード変更</h2>
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
          <p className="mt-1 text-xs text-neutral-500">
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
          <p className="mb-4 text-sm text-error">{passwordError}</p>
        )}

        {passwordSuccess && (
          <p className="mb-4 text-sm text-success">パスワードを変更しました</p>
        )}

        {passwordForm.errors && (
          <p className="mb-4 text-sm text-error">{passwordForm.errors}</p>
        )}

        <div className="mt-8">
          <Button
            type="submit"
            variant="outline"
            size="md"
            disabled={isPendingPassword}
          >
            {isPendingPassword ? "変更中..." : "パスワードを変更する"}
          </Button>
        </div>
      </form>
    </div>
  );
}
