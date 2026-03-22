import { useState } from "react";
import { data, Link } from "react-router";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Tabs } from "@/components/ui/Tabs";
import type { MenuDetail } from "@/core/application/menu/listMenus";
import { listMenus } from "@/core/application/menu/listMenus";
import type { StaffProfileSummary } from "@/core/application/staff/listStaffProfiles";
import { listStaffProfiles } from "@/core/application/staff/listStaffProfiles";
import type { GetTenantOutput } from "@/core/application/tenant/getTenant";
import { getTenant } from "@/core/application/tenant/getTenant";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/shop.$urlPath";

export async function loader({ params, request }: Route.LoaderArgs) {
  const { container } = await import("@/core/di/server");

  const tenant = await handleUseCase(() =>
    getTenant({
      container,
      headers: request.headers,
      input: { urlPath: params.urlPath },
    }),
  ).match(
    (r) => r,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  const menusResult = await handleUseCase(() =>
    listMenus({
      container,
      headers: request.headers,
      input: { tenantId: tenant.id },
    }),
  ).match(
    (r) => r,
    () => ({ items: [] as MenuDetail[] }),
  );

  const staffResult = await handleUseCase(() =>
    listStaffProfiles({
      container,
      headers: request.headers,
      input: { tenantId: tenant.id },
    }),
  ).match(
    (r) => r,
    () => ({ items: [] as StaffProfileSummary[] }),
  );

  return {
    tenant,
    menus: menusResult.items,
    staff: staffResult.items,
  };
}

const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

const tabItems = [
  { id: "menus", label: "メニュー" },
  { id: "staff", label: "スタッフ" },
  { id: "access", label: "アクセス" },
  { id: "info", label: "店舗情報" },
];

export default function ShopDetailPage({ loaderData }: Route.ComponentProps) {
  const { tenant, menus, staff } = loaderData;
  const [activeTab, setActiveTab] = useState("menus");
  const [selectedMenu, setSelectedMenu] = useState<MenuDetail | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);

  return (
    <PublicLayout>
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Hero */}
        <div className="mb-8">
          {tenant.imageUrls.length > 0 && (
            <div className="mb-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {tenant.imageUrls.slice(0, 3).map((url, i) => (
                <div
                  key={url}
                  className={`overflow-hidden rounded-lg bg-surface-secondary ${i === 0 ? "sm:col-span-2 lg:col-span-1" : ""}`}
                >
                  <img
                    src={url}
                    alt={`${tenant.name} ${i + 1}`}
                    className="aspect-[4/3] w-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Badge variant="primary" className="mb-2">
                {tenant.category}
              </Badge>
              <h1 className="mb-2 text-2xl font-bold md:text-3xl">
                {tenant.name}
              </h1>
              {tenant.description && (
                <p className="text-text-secondary">{tenant.description}</p>
              )}
            </div>
            <Link to={`/shop/${tenant.urlPath}/reserve`}>
              <Button size="lg">予約する</Button>
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <Tabs tabs={tabItems} activeTab={activeTab} onTabChange={setActiveTab}>
          {activeTab === "menus" && (
            <MenuList
              menus={menus}
              tenant={tenant}
              onSelectMenu={setSelectedMenu}
            />
          )}
          {activeTab === "staff" && (
            <StaffList
              staff={staff}
              tenant={tenant}
              onSelectStaff={setSelectedStaff}
            />
          )}
          {activeTab === "access" && <AccessInfo tenant={tenant} />}
          {activeTab === "info" && <ShopInfo tenant={tenant} />}
        </Tabs>

        {/* Menu detail modal */}
        <MenuDetailModal
          menu={selectedMenu}
          tenantId={tenant.id}
          urlPath={tenant.urlPath}
          onClose={() => setSelectedMenu(null)}
        />

        {/* Staff detail modal */}
        <StaffDetailModal
          staffId={selectedStaff}
          urlPath={tenant.urlPath}
          onClose={() => setSelectedStaff(null)}
        />
      </div>
    </PublicLayout>
  );
}

function MenuList({
  menus,
  tenant,
  onSelectMenu,
}: {
  menus: MenuDetail[];
  tenant: GetTenantOutput;
  onSelectMenu: (menu: MenuDetail) => void;
}) {
  if (menus.length === 0) {
    return (
      <p className="py-8 text-center text-text-secondary">
        メニューが登録されていません
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {menus.map((menu) => (
        <Card key={menu.id} className="transition-shadow hover:shadow-sm">
          <CardBody>
            <div className="flex items-start justify-between gap-4">
              <button
                type="button"
                className="min-w-0 flex-1 cursor-pointer text-left"
                onClick={() => onSelectMenu(menu)}
              >
                <div className="mb-1 flex items-center gap-2">
                  <h3 className="font-medium">{menu.name}</h3>
                  {menu.category && (
                    <Badge variant="default">{menu.category}</Badge>
                  )}
                </div>
                {menu.description && (
                  <p className="mb-2 text-sm text-text-secondary">
                    {menu.description}
                  </p>
                )}
                <div className="flex gap-4 text-sm text-text-secondary">
                  <span>{menu.duration}分</span>
                  <span>{menu.price.toLocaleString()}円</span>
                </div>
              </button>
              <Link
                to={`/shop/${tenant.urlPath}/reserve?menuId=${menu.id}`}
                className="shrink-0"
              >
                <Button variant="outline" size="sm">
                  このメニューで予約
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

function StaffList({
  staff,
  tenant,
  onSelectStaff,
}: {
  staff: StaffProfileSummary[];
  tenant: GetTenantOutput;
  onSelectStaff: (staffId: string) => void;
}) {
  if (staff.length === 0) {
    return (
      <p className="py-8 text-center text-text-secondary">
        スタッフが登録されていません
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {staff.map((s) => (
        <Card key={s.id} className="transition-shadow hover:shadow-sm">
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-secondary">
                {s.imageUrl ? (
                  <img
                    src={s.imageUrl}
                    alt={s.displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-lg text-text-muted">
                    {s.displayName.charAt(0)}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => onSelectStaff(s.id)}
                  className="font-medium hover:text-primary"
                >
                  {s.displayName}
                </button>
              </div>
              <Link
                to={`/shop/${tenant.urlPath}/reserve?staffId=${s.id}`}
                className="shrink-0"
              >
                <Button variant="outline" size="sm">
                  指名予約
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

function AccessInfo({ tenant }: { tenant: GetTenantOutput }) {
  const fullAddress = `${tenant.address.prefecture}${tenant.address.city}${tenant.address.street}`;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-2 font-medium">住所</h3>
        <p className="text-text-secondary">
          〒{tenant.postalCode}
          <br />
          {fullAddress}
        </p>
      </div>
      <div>
        <h3 className="mb-2 font-medium">電話番号</h3>
        <p className="text-text-secondary">{tenant.phoneNumber}</p>
      </div>
    </div>
  );
}

function ShopInfo({ tenant }: { tenant: GetTenantOutput }) {
  return (
    <div className="space-y-6">
      {/* Business hours */}
      <div>
        <h3 className="mb-3 font-medium">営業時間</h3>
        <div className="space-y-1">
          {DAY_LABELS.map((dayLabel, dayIndex) => {
            const hours = tenant.businessHours[dayIndex];
            const isHoliday = tenant.regularHolidays.includes(dayIndex);
            return (
              <div key={dayLabel} className="flex gap-4 text-sm">
                <span className="w-8 font-medium">{dayLabel}</span>
                <span className="text-text-secondary">
                  {isHoliday
                    ? "定休日"
                    : hours
                      ? `${hours.open} - ${hours.close}`
                      : "休業"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Temporary holidays */}
      {tenant.temporaryHolidays.length > 0 && (
        <div>
          <h3 className="mb-3 font-medium">臨時休業日</h3>
          <div className="space-y-1">
            {tenant.temporaryHolidays.map((holiday) => (
              <div key={holiday.date} className="flex gap-4 text-sm">
                <span className="text-text-secondary">
                  {new Date(holiday.date).toLocaleDateString("ja-JP")}
                  {holiday.reason && ` - ${holiday.reason}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MenuDetailModal({
  menu,
  urlPath,
  onClose,
}: {
  menu: MenuDetail | null;
  tenantId: string;
  urlPath: string;
  onClose: () => void;
}) {
  // TODO: メニューに対応可能なスタッフ一覧を取得して表示する
  return (
    <Modal open={menu !== null} onClose={onClose} title={menu?.name}>
      {menu && (
        <div className="space-y-4">
          {menu.description && (
            <p className="text-text-secondary">{menu.description}</p>
          )}
          <div className="flex gap-6">
            <div>
              <span className="block text-xs text-text-muted">所要時間</span>
              <span className="font-medium">{menu.duration}分</span>
            </div>
            <div>
              <span className="block text-xs text-text-muted">料金</span>
              <span className="font-medium">
                {menu.price.toLocaleString()}円
              </span>
            </div>
          </div>
          <div className="pt-2">
            <Link to={`/shop/${urlPath}/reserve?menuId=${menu.id}`}>
              <Button className="w-full">このメニューで予約する</Button>
            </Link>
          </div>
        </div>
      )}
    </Modal>
  );
}

function StaffDetailModal({
  staffId,
  urlPath,
  onClose,
}: {
  staffId: string | null;
  urlPath: string;
  onClose: () => void;
}) {
  // TODO: スタッフ詳細データを非同期で取得する
  return (
    <Modal open={staffId !== null} onClose={onClose} title="スタッフ詳細">
      {staffId && (
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            スタッフ情報を読み込み中...
          </p>
          <div className="pt-2">
            <Link to={`/shop/${urlPath}/reserve?staffId=${staffId}`}>
              <Button className="w-full">このスタッフで予約する</Button>
            </Link>
          </div>
        </div>
      )}
    </Modal>
  );
}
