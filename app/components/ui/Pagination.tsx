import { Link } from "react-router";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  searchParams?: URLSearchParams;
};

export function Pagination({
  currentPage,
  totalPages,
  baseUrl,
  searchParams,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = getPageNumbers(currentPage, totalPages);

  function buildUrl(page: number): string {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(page));
    return `${baseUrl}?${params.toString()}`;
  }

  return (
    <nav
      className="flex items-center justify-center gap-1"
      aria-label="ページネーション"
    >
      {currentPage > 1 && (
        <Link
          to={buildUrl(currentPage - 1)}
          className="rounded-md px-3 py-2 text-sm text-text-secondary hover:bg-surface-secondary"
        >
          前へ
        </Link>
      )}

      {pages.map((page, index) =>
        page === null ? (
          <span
            key={`ellipsis-${index}`}
            className="px-2 py-2 text-sm text-text-muted"
          >
            ...
          </span>
        ) : (
          <Link
            key={page}
            to={buildUrl(page)}
            className={`rounded-md px-3 py-2 text-sm ${
              page === currentPage
                ? "bg-primary text-white"
                : "text-text-secondary hover:bg-surface-secondary"
            }`}
          >
            {page}
          </Link>
        ),
      )}

      {currentPage < totalPages && (
        <Link
          to={buildUrl(currentPage + 1)}
          className="rounded-md px-3 py-2 text-sm text-text-secondary hover:bg-surface-secondary"
        >
          次へ
        </Link>
      )}
    </nav>
  );
}

function getPageNumbers(current: number, total: number): (number | null)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | null)[] = [1];

  if (current > 3) {
    pages.push(null);
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push(null);
  }

  pages.push(total);

  return pages;
}
