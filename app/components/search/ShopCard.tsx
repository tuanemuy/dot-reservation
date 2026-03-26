import { Link } from "react-router";
import type { TenantSummary } from "@/core/application/tenant/searchTenants";

const imageBgClasses = [
  "bg-gradient-to-br from-primary-lighter to-primary-light",
  "bg-gradient-to-br from-accent-lighter to-accent-light",
  "bg-gradient-to-br from-secondary-lighter to-secondary-light",
  "bg-gradient-to-br from-neutral-100 to-neutral-300",
  "bg-gradient-to-br from-[oklch(0.96_0.02_200)] to-[oklch(0.84_0.06_200)]",
];

type ShopCardProps = {
  shop: TenantSummary;
  imageVariant: number;
};

export function ShopCard({ shop, imageVariant }: ShopCardProps) {
  const hasImage = shop.imageUrls.length > 0;
  const areaText = shop.address
    ? `${shop.address.prefecture}${shop.address.city}`
    : null;

  return (
    <Link
      to={`/shop/${shop.urlPath}`}
      className="block cursor-pointer overflow-hidden rounded-lg border border-neutral-300 bg-white no-underline transition-[border-color,box-shadow] duration-150 hover:border-neutral-400 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      {/* Image */}
      <div
        className={`relative flex h-40 w-full items-center justify-center ${!hasImage ? imageBgClasses[imageVariant % imageBgClasses.length] : ""}`}
      >
        {hasImage ? (
          <img
            src={shop.imageUrls[0]}
            alt={shop.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-sm font-medium uppercase tracking-wide text-neutral-500">
            Photo
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-6">
        <span className="mb-2 inline-block rounded-sm bg-primary-lighter px-2 py-1 text-xs font-medium tracking-wide text-primary">
          {shop.category}
        </span>
        <h3 className="mb-1 font-heading text-lg font-medium leading-tight tracking-tight text-neutral-900">
          {shop.name}
        </h3>
        {areaText && (
          <p className="flex items-center gap-1 text-sm font-normal text-neutral-500">
            <svg
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5 shrink-0 text-neutral-500"
            >
              <title>場所</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
              />
            </svg>
            {areaText}
          </p>
        )}
      </div>
    </Link>
  );
}
