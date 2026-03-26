import { Link } from "react-router";

type SearchPaginationProps = {
  currentPage: number;
  totalPages: number;
  buildPageUrl: (page: number) => string;
};

export function SearchPagination({
  currentPage,
  totalPages,
  buildPageUrl,
}: SearchPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <nav
      className="mt-14 flex items-center justify-center gap-1"
      aria-label="ページネーション"
    >
      {currentPage > 1 && (
        <Link
          to={buildPageUrl(currentPage - 1)}
          className="inline-flex h-10 min-w-10 items-center justify-center rounded-md border border-neutral-300 bg-white px-2 text-sm font-medium text-neutral-700 no-underline transition-[border-color,background,color] duration-150 hover:border-primary-light hover:bg-primary-lighter hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          aria-label="前のページ"
        >
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
          >
            <title>前へ</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
        </Link>
      )}

      {pageNumbers.map((page, idx) =>
        page === null ? (
          <span
            key={`ellipsis-${idx}-${currentPage}`}
            className="inline-flex h-10 min-w-10 items-center justify-center text-sm text-neutral-500"
          >
            ...
          </span>
        ) : (
          <Link
            key={page}
            to={buildPageUrl(page)}
            className={`inline-flex h-10 min-w-10 items-center justify-center rounded-md border px-2 text-sm font-medium no-underline transition-[border-color,background,color] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              page === currentPage
                ? "border-primary bg-primary text-white hover:border-primary-dark hover:bg-primary-dark"
                : "border-neutral-300 bg-white text-neutral-700 hover:border-primary-light hover:bg-primary-lighter hover:text-primary"
            }`}
            aria-current={page === currentPage ? "page" : undefined}
          >
            {page}
          </Link>
        ),
      )}

      {currentPage < totalPages && (
        <Link
          to={buildPageUrl(currentPage + 1)}
          className="inline-flex h-10 min-w-10 items-center justify-center rounded-md border border-neutral-300 bg-white px-2 text-sm font-medium text-neutral-700 no-underline transition-[border-color,background,color] duration-150 hover:border-primary-light hover:bg-primary-lighter hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          aria-label="次のページ"
        >
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
          >
            <title>次へ</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.25 4.5l7.5 7.5-7.5 7.5"
            />
          </svg>
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
