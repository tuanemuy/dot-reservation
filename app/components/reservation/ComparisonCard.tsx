type ComparisonRow = {
  label: string;
  before: string;
  after: string;
  changed: boolean;
};

type ComparisonCardProps = {
  rows: ComparisonRow[];
};

export function ComparisonCard({ rows }: ComparisonCardProps) {
  return (
    <div className="mb-6 overflow-hidden rounded-lg border border-neutral-300 bg-white">
      <div className="grid grid-cols-2">
        <div className="border-b border-neutral-300 bg-neutral-100 px-8 py-4 text-sm font-semibold tracking-wide text-neutral-600">
          変更前
        </div>
        <div className="border-b border-neutral-300 bg-primary-lighter px-8 py-4 text-sm font-semibold tracking-wide text-primary">
          変更後
        </div>
      </div>
      <div className="flex flex-col">
        {rows.map((row, idx) => (
          <div
            key={row.label}
            className={`grid grid-cols-2 ${
              idx < rows.length - 1 ? "border-b border-neutral-200" : ""
            }`}
          >
            <div className="flex flex-col gap-1 bg-neutral-50 px-8 py-4">
              <div className="text-xs font-medium tracking-wide text-neutral-500">
                {row.label}
              </div>
              <div className="text-base text-neutral-800">{row.before}</div>
            </div>
            <div
              className={`flex flex-col gap-1 px-8 py-4 ${
                row.changed ? "bg-accent-lighter" : "bg-white"
              }`}
            >
              <div className="text-xs font-medium tracking-wide text-neutral-500">
                {row.label}
              </div>
              <div
                className={`text-base ${
                  row.changed
                    ? "font-semibold text-accent-dark"
                    : "font-normal text-neutral-800"
                }`}
              >
                {row.after}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
