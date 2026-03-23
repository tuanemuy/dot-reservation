type DiffField = {
  label: string;
  oldValue: string;
  newValue: string;
};

type ReservationDiffDisplayProps = {
  fields: DiffField[];
};

export function ReservationDiffDisplay({
  fields,
}: ReservationDiffDisplayProps) {
  const changedFields = fields.filter(
    (field) => field.oldValue !== field.newValue,
  );

  if (changedFields.length === 0) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
        <h3 className="mb-3 text-sm font-semibold tracking-tight text-text">
          変更内容の確認
        </h3>
        <p className="text-sm text-text-muted">変更はありません</p>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
      <h3 className="mb-4 text-sm font-semibold tracking-tight text-text">
        変更内容の確認
      </h3>
      <table className="w-full text-sm">
        <tbody>
          {changedFields.map((field) => (
            <tr
              key={field.label}
              className="border-b border-border last:border-b-0"
            >
              <td className="whitespace-nowrap py-2.5 pr-4 font-medium text-text-secondary">
                {field.label}
              </td>
              <td className="py-2.5">
                <span className="text-text-muted line-through">
                  {field.oldValue}
                </span>
                <span className="mx-2 text-text-muted" aria-hidden="true">
                  &rarr;
                </span>
                <span className="font-semibold text-text">
                  {field.newValue}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
