type AlertErrorProps = {
  error: string | null | undefined;
};

export function AlertError({ error }: AlertErrorProps) {
  if (!error) {
    return null;
  }

  return (
    <div
      className="flex items-center"
      role="alert"
      style={{
        gap: "var(--space-sm)",
        padding: "var(--space-md)",
        background: "var(--color-error-bg)",
        border: "1px solid var(--color-error-border)",
        borderRadius: "var(--radius-md)",
        fontSize: "var(--text-sm)",
        color: "var(--color-error)",
      }}
    >
      <svg
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
        className="shrink-0"
        style={{ width: "18px", height: "18px" }}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
        />
      </svg>
      {error}
    </div>
  );
}
