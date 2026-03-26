import { Link } from "react-router";
import type { MenuDetail } from "@/core/application/menu/listMenus";
import type { StaffProfileSummary } from "@/core/application/staff/listStaffProfiles";
import { StaffAvatar } from "./StaffAvatar";

type MenuSectionProps = {
  menus: MenuDetail[];
  staff: StaffProfileSummary[];
  urlPath: string;
  onSelectMenu: (menu: MenuDetail) => void;
  onSwitchToStaff: () => void;
};

export function MenuSection({
  menus,
  staff,
  urlPath,
  onSelectMenu,
  onSwitchToStaff,
}: MenuSectionProps) {
  if (menus.length === 0) {
    return (
      <p className="py-8 text-center text-neutral-500">
        メニューが登録されていません
      </p>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-baseline justify-between">
        <h2 className="font-heading text-xl font-semibold tracking-tight text-neutral-900">
          メニュー
        </h2>
        <span className="text-sm font-normal text-neutral-500">
          {menus.length}件
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {menus.map((menu) => (
          <MenuCard
            key={menu.id}
            menu={menu}
            urlPath={urlPath}
            onSelect={() => onSelectMenu(menu)}
          />
        ))}
      </div>

      {staff.length > 0 && (
        <StaffPreview staff={staff} onSwitchToStaff={onSwitchToStaff} />
      )}
    </div>
  );
}

function MenuCard({
  menu,
  urlPath,
  onSelect,
}: {
  menu: MenuDetail;
  urlPath: string;
  onSelect: () => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-8 rounded-lg border border-neutral-300 bg-white px-8 py-6 transition-[border-color,box-shadow] duration-150 hover:border-neutral-400 hover:shadow-sm">
      <button
        type="button"
        className="flex cursor-pointer flex-col gap-2 border-none bg-transparent text-left"
        onClick={onSelect}
      >
        <div className="flex items-center gap-4">
          <h3 className="font-heading text-lg font-medium tracking-tight text-neutral-900">
            {menu.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="rounded-sm bg-neutral-100 px-2 py-[3px] text-xs font-normal text-neutral-600">
              {menu.duration}分
            </span>
          </div>
        </div>
        {menu.description && (
          <p className="text-base font-light leading-[1.6] text-neutral-600">
            {menu.description}
          </p>
        )}
      </button>
      <div className="flex shrink-0 flex-col items-end gap-4">
        <div className="whitespace-nowrap font-heading text-2xl font-semibold tracking-tight text-accent">
          &yen;{menu.price.toLocaleString()}
          <span className="ml-0.5 text-xs font-normal text-neutral-500">
            (税込)
          </span>
        </div>
        <Link
          to={`/shop/${urlPath}/reserve?menuId=${menu.id}`}
          className="inline-flex h-10 items-center justify-center gap-1 whitespace-nowrap rounded-md border border-primary bg-white px-6 font-body text-sm font-medium text-primary no-underline transition-[background,color] duration-150 hover:bg-primary hover:text-white active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          このメニューで予約する
          <svg
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <title>予約</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
}

function StaffPreview({
  staff,
  onSwitchToStaff,
}: {
  staff: StaffProfileSummary[];
  onSwitchToStaff: () => void;
}) {
  return (
    <section className="mt-14 border-t border-neutral-200 pt-10">
      <div className="mb-6 flex items-baseline justify-between">
        <h2 className="font-heading text-xl font-semibold tracking-tight text-neutral-900">
          スタッフ
        </h2>
        <button
          type="button"
          onClick={onSwitchToStaff}
          className="cursor-pointer border-none bg-transparent text-sm font-medium text-primary no-underline transition-colors duration-150 hover:text-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          すべてのスタッフを見る &rarr;
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {staff.slice(0, 3).map((s) => (
          <div
            key={s.id}
            className="flex items-center gap-4 rounded-lg bg-neutral-100 p-6 transition-[background] duration-150 hover:bg-neutral-200"
          >
            <StaffAvatar
              displayName={s.displayName}
              imageUrl={s.imageUrl}
              size="md"
            />
            <div>
              <div className="text-base font-medium text-neutral-900">
                {s.displayName}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
