import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { useCompositeAction } from "@/lib/compositeAction";
import {
  deleteTenantSchema,
  type handlers,
} from "@/routes/admin/$tenantId/settings/action";
import { labelClass } from "./styles";

type DeleteTenantSectionProps = {
  tenantName: string;
};

export function DeleteTenantSection({ tenantName }: DeleteTenantSectionProps) {
  // 各セクションが独立したフォーム操作を持つため、個別にfetcherを初期化する
  const fetcher = useCompositeAction<typeof handlers>();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");

  const [deleteForm, deleteFields] = useForm({
    id: "delete-tenant-form",
    lastResult:
      fetcher.data?.intent === "deleteTenant" ? fetcher.data : undefined,
    constraint: getZodConstraint(deleteTenantSchema),
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, {
        schema: deleteTenantSchema,
      });
    },
  });

  fetcher.register("deleteTenant", {
    onHandlerError: ({ error: err }) => {
      toast.error(err?.[""]?.[0] ?? "削除に失敗しました");
    },
  });

  const isPendingDelete = fetcher.isPending("deleteTenant");

  return (
    <section className="rounded-lg border border-error bg-white p-6">
      <h2 className="mb-4 font-heading text-lg font-semibold tracking-tight text-error">
        テナント削除
      </h2>
      <p className="mb-4 text-sm text-neutral-600">
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
            <label htmlFor={deleteFields.confirmName.id} className={labelClass}>
              確認のためテナント名「{tenantName}」を入力
            </label>
            <input
              {...getInputProps(deleteFields.confirmName, { type: "text" })}
              value={deleteConfirmName}
              onChange={(e) => setDeleteConfirmName(e.target.value)}
              className="h-11 w-full rounded-md border border-neutral-300 bg-white px-4 text-base text-neutral-800 transition-[border-color] duration-150 focus:border-error focus:outline-2 focus:outline-offset-2 focus:outline-error"
            />
            {deleteFields.confirmName.errors && (
              <p className="mt-1 text-xs text-error">
                {deleteFields.confirmName.errors}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              type="submit"
              variant="destructive"
              disabled={isPendingDelete || deleteConfirmName !== tenantName}
            >
              {isPendingDelete ? "削除中..." : "テナントを削除"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowDeleteConfirm(false);
                setDeleteConfirmName("");
              }}
            >
              キャンセル
            </Button>
          </div>
        </fetcher.Form>
      ) : (
        <Button
          type="button"
          variant="destructive-outline"
          onClick={() => setShowDeleteConfirm(true)}
        >
          テナントを削除する
        </Button>
      )}
    </section>
  );
}
