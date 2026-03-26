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
// biome-ignore lint/suspicious/noExplicitAny: Compatible with both fetcher.Form and regular form
type FormComponent = ComponentType<any>;

type SuspendModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  form: AnyFormMetadata;
  reasonField: FieldMetadata<string | undefined>;
  isPending: boolean;
  Form: FormComponent;
};

export function SuspendModal({
  open,
  onClose,
  title,
  description,
  form,
  reasonField,
  isPending,
  Form,
}: SuspendModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="mb-4 text-sm text-neutral-600">{description}</p>
      <Form method="post" {...getFormProps(form)}>
        <input type="hidden" name="intent" value="suspend" />
        <div className="mb-4">
          <FormField label="停止理由（任意）" htmlFor={reasonField.id}>
            <Input
              {...getInputProps(reasonField, { type: "text" })}
              placeholder="停止理由を入力"
            />
          </FormField>
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "処理中..." : "停止する"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
