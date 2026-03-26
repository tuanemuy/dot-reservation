/** 47 Japanese prefectures in standard order */
const PREFECTURES = [
  "北海道",
  "青森県",
  "岩手県",
  "宮城県",
  "秋田県",
  "山形県",
  "福島県",
  "茨城県",
  "栃木県",
  "群馬県",
  "埼玉県",
  "千葉県",
  "東京都",
  "神奈川県",
  "新潟県",
  "富山県",
  "石川県",
  "福井県",
  "山梨県",
  "長野県",
  "岐阜県",
  "静岡県",
  "愛知県",
  "三重県",
  "滋賀県",
  "京都府",
  "大阪府",
  "兵庫県",
  "奈良県",
  "和歌山県",
  "鳥取県",
  "島根県",
  "岡山県",
  "広島県",
  "山口県",
  "徳島県",
  "香川県",
  "愛媛県",
  "高知県",
  "福岡県",
  "佐賀県",
  "長崎県",
  "熊本県",
  "大分県",
  "宮崎県",
  "鹿児島県",
  "沖縄県",
] as const;

type SidebarFiltersProps = {
  area: string;
  category: string;
  categoryFilters: string[];
  onAreaChange: (prefecture: string) => void;
  onCategoryToggle: (cat: string) => void;
};

export function SidebarFilters({
  area,
  category,
  categoryFilters,
  onAreaChange,
  onCategoryToggle,
}: SidebarFiltersProps) {
  return (
    <aside className="sticky top-[calc(64px+1.5rem)]">
      {/* Area Filter */}
      <div className="mb-8">
        <h3 className="mb-4 border-b border-neutral-200 pb-2 font-heading text-sm font-semibold uppercase tracking-wide text-neutral-800">
          エリア
        </h3>
        <div className="relative">
          <select
            value={area}
            onChange={(e) => onAreaChange(e.target.value)}
            className="w-full cursor-pointer appearance-none rounded-md border border-neutral-300 bg-white py-2 pr-10 pl-4 font-body text-sm font-medium text-neutral-700 transition-[border-color] duration-150 hover:border-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <option value="">すべてのエリア</option>
            {PREFECTURES.map((pref) => (
              <option key={pref} value={pref}>
                {pref}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-neutral-500">
            <svg
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <title>開く</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
              />
            </svg>
          </span>
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-8">
        <h3 className="mb-4 border-b border-neutral-200 pb-2 font-heading text-sm font-semibold uppercase tracking-wide text-neutral-800">
          カテゴリ
        </h3>
        <ul className="flex list-none flex-col gap-1">
          {categoryFilters.map((cat) => {
            const isActive = category === cat;
            return (
              <li key={cat}>
                <button
                  type="button"
                  onClick={() => onCategoryToggle(cat)}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-sm border-none bg-transparent p-2 transition-[background] duration-150 hover:bg-neutral-100"
                >
                  <div
                    className={`relative h-4 w-4 shrink-0 rounded-[4px] transition-[border-color,background] duration-150 ${
                      isActive
                        ? "border-[1.5px] border-primary bg-primary"
                        : "border-[1.5px] border-neutral-400 bg-transparent"
                    }`}
                  >
                    {isActive && (
                      <span className="absolute top-0.5 left-[5px] block h-2 w-1 rotate-45 border-white border-r-[1.5px] border-b-[1.5px] border-solid" />
                    )}
                  </div>
                  <span
                    className={`flex-1 text-left text-sm ${
                      isActive
                        ? "font-medium text-neutral-900"
                        : "font-normal text-neutral-700"
                    }`}
                  >
                    {cat}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
