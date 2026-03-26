type StatItemProps = {
  value: string;
  label: string;
};

export function StatItem({ value, label }: StatItemProps) {
  return (
    <div className="rounded-md bg-neutral-50 p-6 text-center">
      <div className="font-heading text-2xl font-semibold leading-tight tracking-tight text-neutral-900">
        {value}
      </div>
      <div className="mt-1 text-xs text-neutral-500">{label}</div>
    </div>
  );
}
