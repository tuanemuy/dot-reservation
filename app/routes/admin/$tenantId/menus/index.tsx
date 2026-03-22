import { useState } from "react";
import { data, Link } from "react-router";
import { z } from "zod";
import { deleteMenu } from "@/core/application/menu/deleteMenu";
import { listMenus } from "@/core/application/menu/listMenus";
import { container } from "@/core/di/server";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
  useCompositeAction,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/index";

export async function loader({ params, request }: Route.LoaderArgs) {
  const menusResult = await handleUseCase(() =>
    listMenus({
      container,
      headers: request.headers,
      input: { tenantId: params.tenantId },
    }),
  ).match(
    (result) => result,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  return { menus: menusResult.items };
}

const deleteMenuSchema = z.object({
  menuId: z.string().min(1),
});

export const handlers = {
  deleteMenu: defineHandler({
    schema: deleteMenuSchema,
    handler: async (value, args) => {
      return handleUseCase(() =>
        deleteMenu({
          container,
          headers: args.request.headers,
          input: { menuId: value.menuId },
        }),
      ).match(
        () => success(),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}

export default function TenantMenusPage({
  loaderData,
  params,
}: Route.ComponentProps) {
  const { menus } = loaderData;
  const tenantId = params.tenantId;
  const fetcher = useCompositeAction<typeof handlers>();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const categories = [...new Set(menus.map((m) => m.category).filter(Boolean))];
  const filteredMenus =
    categoryFilter === "all"
      ? menus
      : menus.filter((m) => m.category === categoryFilter);

  fetcher.register("deleteMenu", {
    onSuccess: () => {
      setDeletingId(null);
    },
  });

  const isPendingDelete = fetcher.isPending("deleteMenu");

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">メニュー管理</h1>
        <Link
          to={`/admin/${tenantId}/menus/new`}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          メニューを追加
        </Link>
      </div>

      {/* カテゴリーフィルター */}
      {categories.length > 0 && (
        <div className="mb-6 flex gap-2">
          <button
            type="button"
            onClick={() => setCategoryFilter("all")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              categoryFilter === "all"
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            すべて
          </button>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setCategoryFilter(category!)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                categoryFilter === category
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {/* メニュー一覧 */}
      {filteredMenus.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">メニューが登録されていません</p>
          <Link
            to={`/admin/${tenantId}/menus/new`}
            className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            メニューを追加する
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  メニュー名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  カテゴリー
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  所要時間
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  料金
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredMenus.map((menu) => (
                <tr key={menu.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    <Link
                      to={`/admin/${tenantId}/menus/${menu.id}`}
                      className="hover:text-blue-600"
                    >
                      {menu.name}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {menu.category ?? "-"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {menu.duration}分
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    &yen;{menu.price.toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    <div className="flex justify-end gap-3">
                      <Link
                        to={`/admin/${tenantId}/menus/${menu.id}`}
                        className="font-medium text-blue-600 hover:text-blue-500"
                      >
                        編集
                      </Link>
                      {deletingId === menu.id ? (
                        <div className="flex items-center gap-2">
                          <fetcher.Form method="post" className="inline">
                            <input
                              type="hidden"
                              name="intent"
                              value="deleteMenu"
                            />
                            <input
                              type="hidden"
                              name="menuId"
                              value={menu.id}
                            />
                            <button
                              type="submit"
                              disabled={isPendingDelete}
                              className="font-medium text-red-600 hover:text-red-500 disabled:opacity-50"
                            >
                              削除する
                            </button>
                          </fetcher.Form>
                          <button
                            type="button"
                            onClick={() => setDeletingId(null)}
                            className="font-medium text-gray-500 hover:text-gray-400"
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeletingId(menu.id)}
                          className="font-medium text-red-600 hover:text-red-500"
                        >
                          削除
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
