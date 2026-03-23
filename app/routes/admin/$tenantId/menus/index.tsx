import { useState } from "react";
import { data, Link } from "react-router";
import { z } from "zod";
import { deleteMenu } from "@/core/application/menu/deleteMenu";
import { listMenus } from "@/core/application/menu/listMenus";
import { updateMenuSortOrders } from "@/core/application/menu/updateMenuSortOrders";
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

const updateSortOrdersSchema = z.object({
  items: z.string().min(1),
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
  updateSortOrders: defineHandler({
    schema: updateSortOrdersSchema,
    handler: async (value, args) => {
      const items = JSON.parse(value.items) as {
        menuId: string;
        sortOrder: number;
      }[];
      return handleUseCase(() =>
        updateMenuSortOrders({
          container,
          headers: args.request.headers,
          input: { items },
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
  const isPendingSortOrders = fetcher.isPending("updateSortOrders");

  const handleMoveMenu = (menuId: string, direction: "up" | "down") => {
    const currentIndex = filteredMenus.findIndex((m) => m.id === menuId);
    if (currentIndex < 0) return;
    const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (swapIndex < 0 || swapIndex >= filteredMenus.length) return;

    const items = filteredMenus.map((m, i) => {
      if (i === currentIndex) {
        return { menuId: m.id, sortOrder: filteredMenus[swapIndex].sortOrder };
      }
      if (i === swapIndex) {
        return {
          menuId: m.id,
          sortOrder: filteredMenus[currentIndex].sortOrder,
        };
      }
      return { menuId: m.id, sortOrder: m.sortOrder };
    });

    const formData = new FormData();
    formData.set("intent", "updateSortOrders");
    formData.set("items", JSON.stringify(items));
    fetcher.submit(formData, { method: "post" });
  };

  return (
    <div className="">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-800">メニュー管理</h1>
        <Link
          to={`/admin/${tenantId}/menus/new`}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
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
                ? "bg-text text-white"
                : "bg-neutral-200 text-neutral-600 hover:bg-border"
            }`}
          >
            すべて
          </button>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setCategoryFilter(category as string)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                categoryFilter === category
                  ? "bg-text text-white"
                  : "bg-neutral-200 text-neutral-600 hover:bg-border"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {/* メニュー一覧 */}
      {filteredMenus.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-neutral-300 bg-white p-12 text-center">
          <p className="text-neutral-500">メニューが登録されていません</p>
          <Link
            to={`/admin/${tenantId}/menus/new`}
            className="mt-4 inline-block text-sm font-medium text-primary hover:text-primary"
          >
            メニューを追加する
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-neutral-300 bg-white">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-neutral-200">
              <tr>
                <th className="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider text-neutral-500">
                  並び順
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                  メニュー名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                  カテゴリー
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                  所要時間
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                  料金
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredMenus.map((menu, index) => (
                <tr key={menu.id} className="hover:bg-neutral-200">
                  <td className="whitespace-nowrap px-3 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        disabled={index === 0 || isPendingSortOrders}
                        onClick={() => handleMoveMenu(menu.id, "up")}
                        className="rounded p-1 text-neutral-400 hover:bg-neutral-300 hover:text-neutral-600 disabled:cursor-not-allowed disabled:opacity-30"
                        aria-label="上に移動"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 15.75l7.5-7.5 7.5 7.5"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        disabled={
                          index === filteredMenus.length - 1 ||
                          isPendingSortOrders
                        }
                        onClick={() => handleMoveMenu(menu.id, "down")}
                        className="rounded p-1 text-neutral-400 hover:bg-neutral-300 hover:text-neutral-600 disabled:cursor-not-allowed disabled:opacity-30"
                        aria-label="下に移動"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-neutral-800">
                    <Link
                      to={`/admin/${tenantId}/menus/${menu.id}`}
                      className="hover:text-primary"
                    >
                      {menu.name}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500">
                    {menu.category ?? "-"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500">
                    {menu.duration}分
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500">
                    &yen;{menu.price.toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    <div className="flex justify-end gap-3">
                      <Link
                        to={`/admin/${tenantId}/menus/${menu.id}`}
                        className="font-medium text-primary hover:text-primary"
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
                              className="font-medium text-destructive hover:text-destructive disabled:opacity-50"
                            >
                              削除する
                            </button>
                          </fetcher.Form>
                          <button
                            type="button"
                            onClick={() => setDeletingId(null)}
                            className="font-medium text-neutral-500 hover:text-neutral-500"
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeletingId(menu.id)}
                          className="font-medium text-destructive hover:text-destructive"
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
