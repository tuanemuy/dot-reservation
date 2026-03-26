export function EmptyResults() {
  return (
    <div className="py-16 text-center">
      <p className="mb-2 text-lg font-medium text-neutral-600">
        条件に合う店舗が見つかりませんでした
      </p>
      <p className="text-sm text-neutral-500">
        検索条件を変更して、もう一度お試しください
      </p>
    </div>
  );
}
