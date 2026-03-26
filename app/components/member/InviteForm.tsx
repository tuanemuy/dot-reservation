import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { Button } from "@/components/ui/Button";
import type { useCompositeAction } from "@/lib/compositeAction";
import { handlers } from "@/routes/admin/$tenantId/members/action";

type InviteFormProps = {
  fetcher: ReturnType<typeof useCompositeAction<typeof handlers>>;
  isPendingInvite: boolean;
  onClose: () => void;
};

export function InviteForm({
  fetcher,
  isPendingInvite,
  onClose,
}: InviteFormProps) {
  const [inviteForm, inviteFields] = useForm({
    id: "invite-form",
    lastResult: fetcher.data?.intent === "invite" ? fetcher.data : undefined,
    constraint: getZodConstraint(handlers.invite.schema),
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: handlers.invite.schema });
    },
  });

  return (
    <div className="mb-6 rounded-lg border border-neutral-300 bg-white p-6">
      <h2 className="mb-4 font-heading text-lg font-semibold tracking-tight text-neutral-800">
        メンバー招待
      </h2>
      <fetcher.Form
        method="post"
        {...getFormProps(inviteForm)}
        className="flex items-end gap-4"
      >
        <input type="hidden" name="intent" value="invite" />
        <div className="flex-1">
          <label
            htmlFor={inviteFields.email.id}
            className="mb-2 block text-sm font-medium text-neutral-700"
          >
            メールアドレス
          </label>
          <input
            {...getInputProps(inviteFields.email, { type: "email" })}
            className="h-11 w-full rounded-md border border-neutral-300 bg-white px-4 text-base text-neutral-800 transition-[border-color] duration-150 hover:border-neutral-400 focus:border-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary"
            placeholder="email@example.com"
          />
          {inviteFields.email.errors && (
            <p className="mt-1 text-xs text-error">
              {inviteFields.email.errors}
            </p>
          )}
        </div>
        <div className="w-40">
          <label
            htmlFor={inviteFields.role.id}
            className="mb-2 block text-sm font-medium text-neutral-700"
          >
            ロール
          </label>
          <select
            {...getInputProps(inviteFields.role, { type: "text" })}
            className="h-11 w-full rounded-md border border-neutral-300 bg-white px-4 text-base text-neutral-800 transition-[border-color] duration-150 hover:border-neutral-400 focus:border-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary"
          >
            <option value="staff">スタッフ</option>
            <option value="admin">管理者</option>
          </select>
        </div>
        <Button type="submit" variant="primary" disabled={isPendingInvite}>
          {isPendingInvite ? "送信中..." : "招待を送信"}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          キャンセル
        </Button>
      </fetcher.Form>
    </div>
  );
}
