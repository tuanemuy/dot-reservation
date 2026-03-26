const TAB_ITEMS = [
  { id: "menus", label: "メニュー" },
  { id: "staff", label: "スタッフ" },
  { id: "access", label: "アクセス" },
  { id: "info", label: "店舗情報" },
] as const;

export type ShopTabId = (typeof TAB_ITEMS)[number]["id"];

type ShopTabsProps = {
  activeTab: ShopTabId;
  onTabChange: (tabId: ShopTabId) => void;
};

export function ShopTabs({ activeTab, onTabChange }: ShopTabsProps) {
  return (
    <nav className="mb-10 border-b border-neutral-300">
      <div className="flex gap-0" role="tablist">
        {TAB_ITEMS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={`relative cursor-pointer border-none bg-none px-6 py-4 font-body text-base font-medium text-neutral-500 transition-colors duration-150 hover:text-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                isActive ? "text-neutral-900" : ""
              }`}
            >
              {tab.label}
              {isActive && (
                <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 rounded-t-[2px] bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
