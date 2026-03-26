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
      <div className="rounded-lg border border-neutral-300 bg-neutral-100 p-6">
        <h3 className="mb-2 text-sm font-semibold tracking-tight text-neutral-800">
          変更内容の確認
        </h3>
        <p className="text-sm text-neutral-500">変更はありません</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-300 bg-neutral-100 p-6">
      <h3 className="mb-4 text-sm font-semibold tracking-tight text-neutral-800">
        変更内容の確認
      </h3>
      <table className="w-full text-sm">
        <thead className="sr-only">
          <tr>
            <th scope="col">項目</th>
            <th scope="col">変更前</th>
            <th scope="col" />
            <th scope="col">変更後</th>
          </tr>
        </thead>
        <tbody>
          {changedFields.map((field) => (
            <tr
              key={field.label}
              className="border-b border-neutral-300 last:border-b-0"
            >
              <td className="whitespace-nowrap py-2 pr-4 font-medium text-neutral-600">
                {field.label}
              </td>
              <td className="py-2 text-neutral-500 line-through">
                {field.oldValue}
              </td>
              <td className="px-2 py-2 text-neutral-500" aria-hidden="true">
                &rarr;
              </td>
              <td className="py-2 font-semibold text-neutral-800">
                {field.newValue}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
