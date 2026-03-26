import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import type { useCompositeAction } from "@/lib/compositeAction";
import {
  deleteAccountSchema,
  type handlers,
} from "@/routes/mypage/profile/action";

type DeleteAccountSectionProps = {
  profileId: string;
  fetcher: ReturnType<typeof useCompositeAction<typeof handlers>>;
};

export function DeleteAccountSection({
  profileId,
  fetcher,
}: DeleteAccountSectionProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const isPendingDelete = fetcher.isPending("deleteAccount");

  const [deleteForm, deleteFields] = useForm({
    id: "delete-form",
    defaultValue: {
      customerId: profileId,
    },
    lastResult:
      fetcher.data?.intent === "deleteAccount" ? fetcher.data : undefined,
    constraint: getZodConstraint(deleteAccountSchema),
    shouldValidate: "onSubmit",
    onValidate({ formData }) {
      return parseWithZod(formData, {
        schema: deleteAccountSchema,
      });
    },
  });

  fetcher.register("deleteAccount", {
    onSuccess: () => {
      setShowDeleteDialog(false);
    },
  });

  return (
    <>
      <div className="rounded-lg border border-[var(--color-error-border)] bg-white p-8">
        <h2 className="mb-2 font-heading text-lg font-semibold tracking-tight text-error">
          アカウント削除
        </h2>
        <p className="mb-6 text-sm leading-relaxed text-neutral-600">
          アカウントを削除すると、すべての予約履歴やプロフィール情報が完全に削除されます。この操作は取り消すことができません。
        </p>
        <Button
          type="button"
          variant="destructive-outline"
          size="md"
          onClick={() => setShowDeleteDialog(true)}
          className="gap-2"
        >
          <svg
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-4 w-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          アカウントを削除する
        </Button>
      </div>

      {/* Delete Modal */}
      <Modal
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title="本当にアカウントを削除しますか？"
      >
        <p className="mb-6 text-sm text-neutral-600">
          この操作は取り消せません。確認のためパスワードを入力してください。
        </p>
        <fetcher.Form method="post" {...getFormProps(deleteForm)}>
          <input type="hidden" name="intent" value="deleteAccount" />
          <input type="hidden" name="customerId" value={profileId} />
          <div className="mb-6">
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
            <p className="mb-4 text-sm text-error">{deleteForm.errors}</p>
          )}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setShowDeleteDialog(false)}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="md"
              disabled={isPendingDelete}
            >
              {isPendingDelete ? "削除中..." : "削除する"}
            </Button>
          </div>
        </fetcher.Form>
      </Modal>
    </>
  );
}
