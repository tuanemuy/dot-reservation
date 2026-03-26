import {
  type FieldMetadata,
  type FormMetadata,
  getFormProps,
  getInputProps,
} from "@conform-to/react";
import type { ComponentType } from "react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

// biome-ignore lint/suspicious/noExplicitAny: FormMetadata generics vary by form schema
type AnyFormMetadata = FormMetadata<any, any>;
// biome-ignore lint/suspicious/noExplicitAny: FieldMetadata generics vary by field type
type AnyFieldMetadata = FieldMetadata<any>;
// biome-ignore lint/suspicious/noExplicitAny: Compatible with both fetcher.Form and regular form
type FormComponent = ComponentType<any>;

type DeleteConfirmModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  form: AnyFormMetadata;
  confirmField: AnyFieldMetadata;
  confirmLabel: string;
  confirmPlaceholder: string;
  isPending: boolean;
  Form: FormComponent;
};

export function DeleteConfirmModal({
  open,
  onClose,
  title,
  description,
  form,
  confirmField,
  confirmLabel,
  confirmPlaceholder,
  isPending,
  Form,
}: DeleteConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="mb-4 text-sm text-neutral-600">{description}</p>
      <Form method="post" {...getFormProps(form)}>
        <input type="hidden" name="intent" value="delete" />
        <div className="mb-4">
          <FormField
            label={confirmLabel}
            htmlFor={confirmField.id}
            error={confirmField.errors}
            required
          >
            <Input
              {...getInputProps(confirmField, { type: "text" })}
              placeholder={confirmPlaceholder}
              error={confirmField.errors?.[0]}
            />
          </FormField>
        </div>
        {form.errors && (
          <p className="mb-4 text-xs text-error">{form.errors}</p>
        )}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button type="submit" variant="destructive" disabled={isPending}>
            {isPending ? "削除中..." : "削除する"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
