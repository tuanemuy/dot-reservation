type InfoItemProps = {
  label: string;
  value: string;
  position: "odd" | "even";
  isLastRow: boolean;
  isLink?: boolean;
};

export function InfoItem({
  label,
  value,
  position,
  isLastRow,
  isLink,
}: InfoItemProps) {
  return (
    <div
      className={`py-4 ${isLastRow ? "" : "border-b border-neutral-200"} ${
        position === "odd" ? "pr-8" : "border-l border-neutral-200 pl-8"
      }`}
    >
      <div className="mb-1 text-xs font-medium tracking-wide text-neutral-500">
        {label}
      </div>
      <div
        className={`text-base ${isLink ? "text-primary" : "text-neutral-800"}`}
      >
        {value}
      </div>
    </div>
  );
}
