import { type FormMetadata, getFormProps } from "@conform-to/react";
import type { ComponentType } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

// biome-ignore lint/suspicious/noExplicitAny: FormMetadata generics vary by form schema
type AnyFormMetadata = FormMetadata<any, any>;
// biome-ignore lint/suspicious/noExplicitAny: Compatible with both fetcher.Form and regular form
type FormComponent = ComponentType<any>;

type ResumeModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  form: AnyFormMetadata;
  isPending: boolean;
  Form: FormComponent;
};

export function ResumeModal({
  open,
  onClose,
  title,
  description,
  form,
  isPending,
  Form,
}: ResumeModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="mb-4 text-sm text-neutral-600">{description}</p>
      <Form method="post" {...getFormProps(form)}>
        <input type="hidden" name="intent" value="resume" />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "処理中..." : "再開する"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
