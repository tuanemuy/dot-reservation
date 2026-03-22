import type { Route } from "./+types/menus";

// TODO: 認証チェック
export async function loader({ params }: Route.LoaderArgs) {
  const _tenantId = params.tenantId;

  // TODO: 担当メニュー取得
  return {
    menus: [] as {
      id: string;
      name: string;
      category: string;
      duration: number;
      price: number;
      description: string;
    }[],
  };
}

export default function StaffMenusPage({ loaderData }: Route.ComponentProps) {
  const { menus } = loaderData;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">担当メニュー</h1>

      {menus.length === 0 ? (
        <div className="rounded-lg bg-white p-8 text-center shadow-sm ring-1 ring-gray-200">
          <p className="text-sm text-gray-500">
            担当メニューが設定されていません。
          </p>
          <p className="mt-1 text-xs text-gray-400">
            管理者にメニューの割り当てを依頼してください。
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {menus.map((menu) => (
            <div
              key={menu.id}
              className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-gray-200"
            >
              <div className="mb-2 flex items-start justify-between">
                <h3 className="text-sm font-semibold text-gray-900">
                  {menu.name}
                </h3>
                <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                  {menu.category}
                </span>
              </div>
              <p className="mb-3 text-xs leading-relaxed text-gray-500">
                {menu.description}
              </p>
              <div className="flex items-center gap-3 text-xs text-gray-600">
                <span>{menu.duration}分</span>
                <span>¥{menu.price.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
