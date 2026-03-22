import { type ReactNode, useEffect, useRef } from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
};

export function Modal({ open, onClose, children, title }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="w-full max-w-lg rounded-lg border border-border bg-white p-0 shadow-lg backdrop:bg-black/40"
    >
      {title && (
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-text-muted hover:bg-surface-secondary hover:text-text"
            aria-label="閉じる"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <title>閉じる</title>
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      )}
      <div className="p-5">{children}</div>
    </dialog>
  );
}
