type ModalCloseButtonProps = {
  onClose: () => void;
};

export function ModalCloseButton({ onClose }: ModalCloseButtonProps) {
  return (
    <button
      type="button"
      onClick={onClose}
      className="absolute top-6 right-6 cursor-pointer border-none bg-transparent text-neutral-500 hover:text-neutral-800"
      aria-label="閉じる"
    >
      <svg
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
      >
        <title>閉じる</title>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  );
}
