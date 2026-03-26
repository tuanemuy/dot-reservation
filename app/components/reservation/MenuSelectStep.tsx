import type { MenuDetail } from "./types";

type MenuSelectStepProps = {
  menus: MenuDetail[];
  selectedMenuId: string | null;
  onSelect: (menuId: string) => void;
};

export function MenuSelectStep({
  menus,
  selectedMenuId,
  onSelect,
}: MenuSelectStepProps) {
  return (
    <div className="flex flex-col gap-4">
      {menus.map((menu) => (
        <button
          type="button"
          key={menu.id}
          className={`grid cursor-pointer items-center gap-8 rounded-lg border bg-white px-8 py-6 text-left font-[inherit] transition-[border-color,box-shadow] duration-150 hover:border-neutral-400 hover:shadow-sm grid-cols-[1fr_auto] ${
            selectedMenuId === menu.id ? "border-primary" : "border-neutral-300"
          }`}
          onClick={() => onSelect(menu.id)}
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <h3 className="font-heading text-lg font-medium tracking-tight text-neutral-900">
                {menu.name}
              </h3>
              <span className="rounded-sm bg-neutral-100 px-2 py-[3px] text-xs text-neutral-600">
                {menu.duration}分
              </span>
            </div>
            {menu.description && (
              <p className="text-base font-light text-neutral-600">
                {menu.description}
              </p>
            )}
          </div>
          <div className="whitespace-nowrap font-heading text-2xl font-semibold tracking-tight text-accent">
            &yen;{menu.price.toLocaleString()}
            <span className="ml-[2px] text-xs font-normal text-neutral-500">
              (税込)
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
