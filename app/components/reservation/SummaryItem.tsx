type SummaryItemProps = {
  label: string;
  value: string;
};

export function SummaryItem({ label, value }: SummaryItemProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
        {label}
      </span>
      <span className="text-base font-medium text-neutral-900">{value}</span>
    </div>
  );
}
