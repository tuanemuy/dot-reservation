import { Link } from "react-router";

type BreadcrumbItem = {
  label: string;
  to?: string;
};

type BreadcrumbProps = {
  items: BreadcrumbItem[];
};

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav
      className="flex items-center py-4 text-sm gap-2"
      aria-label="パンくずリスト"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={item.label} className="contents">
            {index > 0 && (
              <span className="text-neutral-400 text-xs" aria-hidden="true">
                /
              </span>
            )}
            {item.to && !isLast ? (
              <Link
                to={item.to}
                className="no-underline text-neutral-500 transition-colors duration-150"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={
                  isLast ? "text-neutral-800 font-medium" : "text-neutral-500"
                }
              >
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
