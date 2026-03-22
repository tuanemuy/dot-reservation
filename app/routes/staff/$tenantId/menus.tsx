import { useState } from "react";
import { data } from "react-router";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import type { MenuDetail } from "@/core/application/menu/listMenus";
import { listMenus } from "@/core/application/menu/listMenus";
import type { GetStaffProfileOutput } from "@/core/application/staff/getStaffProfile";
import { getStaffProfile } from "@/core/application/staff/getStaffProfile";
import { listStaffProfiles } from "@/core/application/staff/listStaffProfiles";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/menus";

type AssignedMenu = {
  id: string;
  name: string;
  category: string | null;
  duration: number;
  price: number;
  description: string | null;
};

export async function loader({ params, request }: Route.LoaderArgs) {
  const { container } = await import("@/core/di/server");
  const tenantId = params.tenantId;

  // Get staff profiles to find the current staff
  const profilesResult = await handleUseCase(() =>
    listStaffProfiles({
      container,
      headers: request.headers,
      input: { tenantId },
    }),
  ).match(
    (result) => result,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  const firstProfile = profilesResult.items[0];
  if (!firstProfile) {
    return { menus: [] as AssignedMenu[] };
  }

  // Get full staff profile (includes assigned menu IDs)
  const staffResult = await handleUseCase(() =>
    getStaffProfile({
      container,
      headers: request.headers,
      input: { staffProfileId: firstProfile.id },
    }),
  ).match(
    (result) => result,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  // Get all menus for the tenant
  const allMenusResult = await handleUseCase(() =>
    listMenus({
      container,
      headers: request.headers,
      input: { tenantId },
    }),
  ).match(
    (result) => result.items,
    () => [] as MenuDetail[],
  );

  // Filter to only assigned menus
  const assignedMenuIds = new Set(staffResult.assignedMenus.map((m) => m.id));

  const menus: AssignedMenu[] = allMenusResult
    .filter((m) => assignedMenuIds.has(m.id))
    .map((m) => ({
      id: m.id,
      name: m.name,
      category: m.category,
      duration: m.duration,
      price: m.price,
      description: m.description,
    }));

  return { menus };
}

export default function StaffMenusPage({ loaderData }: Route.ComponentProps) {
  const { menus } = loaderData;
  const [selectedMenu, setSelectedMenu] = useState<AssignedMenu | null>(null);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-text">担当メニュー</h1>

      {menus.length === 0 ? (
        <Card>
          <CardBody className="py-8 text-center">
            <p className="text-sm text-text-secondary">
              担当メニューが設定されていません。
            </p>
            <p className="mt-1 text-xs text-text-muted">
              管理者にお問い合わせください。
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {menus.map((menu) => (
            <button
              key={menu.id}
              type="button"
              onClick={() => setSelectedMenu(menu)}
              className="text-left"
            >
              <Card className="h-full transition-colors hover:border-primary/30">
                <CardBody>
                  <div className="mb-2 flex items-start justify-between">
                    <h3 className="text-sm font-semibold text-text">
                      {menu.name}
                    </h3>
                    {menu.category && <Badge>{menu.category}</Badge>}
                  </div>
                  {menu.description && (
                    <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-text-secondary">
                      {menu.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-text-secondary">
                    <span>{menu.duration}分</span>
                    <span>&yen;{menu.price.toLocaleString()}</span>
                  </div>
                </CardBody>
              </Card>
            </button>
          ))}
        </div>
      )}

      <Modal
        open={selectedMenu !== null}
        onClose={() => setSelectedMenu(null)}
        title={selectedMenu?.name ?? "メニュー詳細"}
      >
        {selectedMenu && (
          <div className="space-y-4">
            {selectedMenu.category && (
              <div>
                <span className="text-xs font-medium text-text-secondary">
                  カテゴリー
                </span>
                <p className="mt-0.5 text-sm text-text">
                  {selectedMenu.category}
                </p>
              </div>
            )}

            {selectedMenu.description && (
              <div>
                <span className="text-xs font-medium text-text-secondary">
                  説明
                </span>
                <p className="mt-0.5 text-sm text-text">
                  {selectedMenu.description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-medium text-text-secondary">
                  所要時間
                </span>
                <p className="mt-0.5 text-sm text-text">
                  {selectedMenu.duration}分
                </p>
              </div>
              <div>
                <span className="text-xs font-medium text-text-secondary">
                  料金
                </span>
                <p className="mt-0.5 text-sm text-text">
                  &yen;{selectedMenu.price.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedMenu(null)}
              >
                閉じる
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
