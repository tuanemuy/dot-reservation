import { useEffect, useState } from "react";
import { data, Link, useFetcher } from "react-router";
import { PublicLayout } from "@/components/layout/PublicLayout";
import type { MenuDetail } from "@/core/application/menu/listMenus";
import { listMenus } from "@/core/application/menu/listMenus";
import type { GetStaffProfileOutput } from "@/core/application/staff/getStaffProfile";
import { getStaffProfile } from "@/core/application/staff/getStaffProfile";
import type { StaffProfileSummary } from "@/core/application/staff/listStaffProfiles";
import { listStaffProfiles } from "@/core/application/staff/listStaffProfiles";
import { listStaffsByMenu } from "@/core/application/staff/listStaffsByMenu";
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

export async function action({ params, request }: Route.ActionArgs) {
  const { container } = await import("@/core/di/server");
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "loadStaffProfile") {
    const staffProfileId = formData.get("staffProfileId") as string;
    const result = await handleUseCase(() =>
      getStaffProfile({
        container,
        headers: request.headers,
        input: { staffProfileId },
      }),
    ).match(
      (r) => ({
        intent: "loadStaffProfile" as const,
        profile: r,
        error: null,
      }),
      (e) => ({
        intent: "loadStaffProfile" as const,
        profile: null,
        error: e.message,
      }),
    );
    return result;
  }

  if (intent === "loadMenuStaff") {
    const menuId = formData.get("menuId") as string;
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

    const result = await handleUseCase(() =>
      listStaffsByMenu({
        container,
        headers: request.headers,
        input: { tenantId: tenant.id, menuId },
      }),
    ).match(
      (r) => r,
      () => ({ items: [] as StaffProfileSummary[] }),
    );

    return { intent: "loadMenuStaff" as const, staff: result.items };
  }

  throw data({ message: "Invalid intent" }, { status: 400 });
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

  const fullAddress = `${tenant.address.prefecture}${tenant.address.city}${tenant.address.street}`;

  // Get the first open business hours for display
  const firstOpenDay = Object.entries(tenant.businessHours).find(
    ([dayIndex, hours]) =>
      hours !== null && !tenant.regularHolidays.includes(Number(dayIndex)),
  );
  const businessHoursDisplay = firstOpenDay
    ? `${firstOpenDay[1]?.open} - ${firstOpenDay[1]?.close}`
    : "営業時間はお問い合わせください";

  return (
    <PublicLayout>
      <div
        className="mx-auto"
        style={{
          maxWidth: 1280,
          padding: "0 var(--space-2xl)",
        }}
      >
        {/* Breadcrumb */}
        <nav
          className="flex items-center text-neutral-500"
          aria-label="パンくずリスト"
          style={{
            padding: "var(--space-md) 0",
            fontSize: "var(--text-sm)",
            gap: "var(--space-sm)",
          }}
        >
          <Link
            to="/"
            className="text-neutral-600 no-underline transition-colors duration-[0.15s] ease-[ease] hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            トップ
          </Link>
          <span className="text-neutral-300">/</span>
          <Link
            to={`/search?area=${encodeURIComponent(tenant.address.prefecture)}`}
            className="text-neutral-600 no-underline transition-colors duration-[0.15s] ease-[ease] hover:text-primary"
          >
            {tenant.address.prefecture}
          </Link>
          <span className="text-neutral-300">/</span>
          <span className="text-neutral-700">{tenant.name}</span>
        </nav>

        {/* Hero */}
        <section
          className="grid items-start"
          style={{
            gridTemplateColumns: "1fr 1fr",
            gap: "var(--space-3xl)",
            padding: "var(--space-lg) 0 var(--space-3xl)",
          }}
        >
          {/* Gallery */}
          <div
            className="grid overflow-hidden"
            style={{
              gridTemplateColumns: "1fr 1fr",
              gridTemplateRows: "240px 140px",
              gap: "var(--space-sm)",
              borderRadius: "var(--radius-xl)",
            }}
          >
            <div
              className="relative flex items-end"
              style={{
                gridColumn: "1 / -1",
                background:
                  tenant.imageUrls.length > 0
                    ? undefined
                    : "linear-gradient(135deg, var(--color-primary-lighter) 0%, var(--color-primary-light) 100%)",
                padding: "var(--space-lg)",
              }}
            >
              {tenant.imageUrls[0] ? (
                <img
                  src={tenant.imageUrls[0]}
                  alt={`${tenant.name} メイン`}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <span
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 uppercase text-primary opacity-40"
                  style={{
                    fontSize: "var(--text-base)",
                    fontWeight: "var(--weight-medium)",
                    letterSpacing: "0.1em",
                  }}
                >
                  Photo
                </span>
              )}
              {tenant.imageUrls.length > 1 && (
                <span
                  className="relative z-10 text-white"
                  style={{
                    background: "oklch(0 0 0 / 0.5)",
                    fontSize: "var(--text-xs)",
                    fontWeight: "var(--weight-medium)",
                    padding: "var(--space-xs) var(--space-md)",
                    borderRadius: "var(--radius-sm)",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  1 / {tenant.imageUrls.length}
                </span>
              )}
            </div>
            <div className="relative flex items-center justify-center bg-neutral-200">
              {tenant.imageUrls[1] ? (
                <img
                  src={tenant.imageUrls[1]}
                  alt={`${tenant.name} 2`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span
                  className="uppercase text-neutral-500"
                  style={{
                    fontSize: "var(--text-xs)",
                    fontWeight: "var(--weight-medium)",
                    letterSpacing: "0.08em",
                  }}
                >
                  Photo
                </span>
              )}
            </div>
            <div className="relative flex items-center justify-center bg-neutral-200">
              {tenant.imageUrls[2] ? (
                <img
                  src={tenant.imageUrls[2]}
                  alt={`${tenant.name} 3`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span
                  className="uppercase text-neutral-500"
                  style={{
                    fontSize: "var(--text-xs)",
                    fontWeight: "var(--weight-medium)",
                    letterSpacing: "0.08em",
                  }}
                >
                  Photo
                </span>
              )}
            </div>
          </div>

          {/* Info */}
          <div style={{ padding: "var(--space-sm) 0" }}>
            <span
              className="mb-[var(--space-md)] inline-flex items-center gap-[var(--space-xs)] text-primary"
              style={{
                fontSize: "var(--text-xs)",
                fontWeight: "var(--weight-medium)",
                background: "var(--color-primary-lighter)",
                padding: "var(--space-xs) var(--space-md)",
                borderRadius: "var(--radius-sm)",
                letterSpacing: "var(--tracking-wide)",
              }}
            >
              {tenant.category}
            </span>
            <h1
              className="text-neutral-900"
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "var(--text-3xl)",
                fontWeight: "var(--weight-semibold)",
                letterSpacing: "var(--tracking-tight)",
                lineHeight: "var(--leading-tight)",
                marginBottom: "var(--space-sm)",
              }}
            >
              {tenant.name}
            </h1>
            {tenant.description && (
              <p
                className="text-neutral-600"
                style={{
                  fontSize: "var(--text-base)",
                  fontWeight: "var(--weight-light)",
                  marginBottom: "var(--space-xl)",
                }}
              >
                {tenant.description}
              </p>
            )}

            {/* Meta */}
            <div
              className="flex flex-col"
              style={{
                gap: "var(--space-md)",
                marginBottom: "var(--space-xl)",
              }}
            >
              <MetaItem label="Address" value={fullAddress} icon="location" />
              <MetaItem label="Phone" value={tenant.phoneNumber} icon="phone" />
              <MetaItem
                label="Hours"
                value={businessHoursDisplay}
                icon="clock"
              />
            </div>

            {/* CTA */}
            <div className="flex flex-col" style={{ gap: "var(--space-md)" }}>
              <Link
                to={`/shop/${tenant.urlPath}/reserve`}
                className="inline-flex w-full items-center justify-center gap-[var(--space-sm)] border-none bg-primary text-white no-underline transition-[background] duration-[0.15s] ease-[ease] hover:bg-primary-dark active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                style={{
                  height: 52,
                  padding: "0 var(--space-xl)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "var(--text-lg)",
                  fontWeight: "var(--weight-medium)",
                  letterSpacing: "var(--tracking-wide)",
                  fontFamily: "var(--font-body)",
                }}
              >
                <svg
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <title>予約</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                  />
                </svg>
                予約する
              </Link>
              <p
                className="text-center text-neutral-500"
                style={{ fontSize: "var(--text-xs)" }}
              >
                24時間オンライン予約受付中
              </p>
            </div>

            {/* Stats */}
            <div
              className="grid overflow-hidden bg-neutral-300"
              style={{
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 1,
                borderRadius: "var(--radius-lg)",
                marginTop: "var(--space-lg)",
              }}
            >
              <div className="bg-neutral-100 p-[var(--space-md)] text-center">
                <div
                  className="text-primary"
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "var(--text-xl)",
                    fontWeight: "var(--weight-semibold)",
                    letterSpacing: "var(--tracking-tight)",
                  }}
                >
                  {menus.length}
                </div>
                <div
                  className="text-neutral-500"
                  style={{
                    fontSize: "var(--text-xs)",
                    fontWeight: "var(--weight-normal)",
                    marginTop: 2,
                  }}
                >
                  メニュー
                </div>
              </div>
              <div className="bg-neutral-100 p-[var(--space-md)] text-center">
                <div
                  className="text-secondary"
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "var(--text-xl)",
                    fontWeight: "var(--weight-semibold)",
                    letterSpacing: "var(--tracking-tight)",
                  }}
                >
                  {staff.length}
                </div>
                <div
                  className="text-neutral-500"
                  style={{
                    fontSize: "var(--text-xs)",
                    fontWeight: "var(--weight-normal)",
                    marginTop: 2,
                  }}
                >
                  スタッフ
                </div>
              </div>
              <div className="bg-neutral-100 p-[var(--space-md)] text-center">
                <div
                  className="text-accent"
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "var(--text-xl)",
                    fontWeight: "var(--weight-semibold)",
                    letterSpacing: "var(--tracking-tight)",
                  }}
                >
                  {
                    Object.entries(tenant.businessHours).filter(
                      ([dayIndex, h]) =>
                        h !== null &&
                        !tenant.regularHolidays.includes(Number(dayIndex)),
                    ).length
                  }
                </div>
                <div
                  className="text-neutral-500"
                  style={{
                    fontSize: "var(--text-xs)",
                    fontWeight: "var(--weight-normal)",
                    marginTop: 2,
                  }}
                >
                  営業日/週
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <nav
          className="border-b border-neutral-300"
          style={{ marginBottom: "var(--space-2xl)" }}
        >
          <div className="flex gap-0">
            {tabItems.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative cursor-pointer border-none bg-none text-neutral-500 transition-colors duration-[0.15s] ease-[ease] hover:text-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                  activeTab === tab.id ? "text-neutral-900" : ""
                }`}
                style={{
                  padding: "var(--space-md) var(--space-lg)",
                  fontSize: "var(--text-base)",
                  fontWeight: "var(--weight-medium)",
                  fontFamily: "var(--font-body)",
                  background: "none",
                }}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span
                    className="absolute bottom-[-1px] left-0 right-0 bg-primary"
                    style={{
                      height: 2,
                      borderRadius: "2px 2px 0 0",
                    }}
                  />
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <section style={{ paddingBottom: "var(--space-section)" }}>
          {activeTab === "menus" && (
            <MenuContent
              menus={menus}
              staff={staff}
              tenant={tenant}
              onSelectMenu={setSelectedMenu}
              onSwitchToStaff={() => setActiveTab("staff")}
            />
          )}
          {activeTab === "staff" && (
            <StaffContent
              staff={staff}
              tenant={tenant}
              onSelectStaff={setSelectedStaff}
            />
          )}
          {activeTab === "access" && <AccessContent tenant={tenant} />}
          {activeTab === "info" && <InfoContent tenant={tenant} />}
        </section>

        {/* Menu detail modal */}
        {selectedMenu && (
          <MenuDetailModal
            menu={selectedMenu}
            tenantId={tenant.id}
            urlPath={tenant.urlPath}
            onClose={() => setSelectedMenu(null)}
          />
        )}

        {/* Staff detail modal */}
        {selectedStaff && (
          <StaffDetailModal
            staffId={selectedStaff}
            urlPath={tenant.urlPath}
            onClose={() => setSelectedStaff(null)}
          />
        )}
      </div>
    </PublicLayout>
  );
}

function MetaItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: "location" | "phone" | "clock";
}) {
  const iconPath =
    icon === "location"
      ? "M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
      : icon === "phone"
        ? "M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
        : "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z";

  return (
    <div
      className="flex items-center text-neutral-700"
      style={{
        gap: "var(--space-md)",
        fontSize: "var(--text-base)",
      }}
    >
      <div
        className="flex shrink-0 items-center justify-center bg-neutral-100 text-neutral-600"
        style={{
          width: 36,
          height: 36,
          borderRadius: "var(--radius-md)",
        }}
      >
        <svg
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
        >
          <title>{label}</title>
          <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
        </svg>
      </div>
      <div>
        <div
          className="text-neutral-500 uppercase"
          style={{
            fontSize: "var(--text-xs)",
            fontWeight: "var(--weight-medium)",
            letterSpacing: "0.06em",
            marginBottom: 1,
          }}
        >
          {label}
        </div>
        {value}
      </div>
    </div>
  );
}

function MenuContent({
  menus,
  staff,
  tenant,
  onSelectMenu,
  onSwitchToStaff,
}: {
  menus: MenuDetail[];
  staff: StaffProfileSummary[];
  tenant: GetTenantOutput;
  onSelectMenu: (menu: MenuDetail) => void;
  onSwitchToStaff: () => void;
}) {
  if (menus.length === 0) {
    return (
      <p className="py-8 text-center text-neutral-500">
        メニューが登録されていません
      </p>
    );
  }

  return (
    <div>
      <div
        className="flex items-baseline justify-between"
        style={{ marginBottom: "var(--space-lg)" }}
      >
        <h2
          className="text-neutral-900"
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "var(--text-xl)",
            fontWeight: "var(--weight-semibold)",
            letterSpacing: "var(--tracking-tight)",
          }}
        >
          メニュー
        </h2>
        <span
          className="text-neutral-500"
          style={{
            fontSize: "var(--text-sm)",
            fontWeight: "var(--weight-normal)",
          }}
        >
          {menus.length}件
        </span>
      </div>

      <div className="flex flex-col" style={{ gap: "var(--space-md)" }}>
        {menus.map((menu) => (
          <div
            key={menu.id}
            className="grid items-center border border-neutral-300 bg-[var(--color-bg-card)] transition-[border-color,box-shadow] duration-[0.15s] ease-[ease] hover:border-neutral-400 hover:shadow-[var(--shadow-sm)]"
            style={{
              gridTemplateColumns: "1fr auto",
              gap: "var(--space-xl)",
              padding: "var(--space-lg) var(--space-xl)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <button
              type="button"
              className="flex cursor-pointer flex-col border-none bg-transparent text-left"
              style={{ gap: "var(--space-sm)" }}
              onClick={() => onSelectMenu(menu)}
            >
              <div
                className="flex items-center"
                style={{ gap: "var(--space-md)" }}
              >
                <h3
                  className="text-neutral-900"
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "var(--text-lg)",
                    fontWeight: "var(--weight-medium)",
                    letterSpacing: "var(--tracking-tight)",
                  }}
                >
                  {menu.name}
                </h3>
                <div
                  className="flex items-center"
                  style={{ gap: "var(--space-sm)" }}
                >
                  <span
                    className="bg-neutral-100 text-neutral-600"
                    style={{
                      fontSize: "var(--text-xs)",
                      fontWeight: "var(--weight-normal)",
                      padding: "3px var(--space-sm)",
                      borderRadius: "var(--radius-sm)",
                    }}
                  >
                    {menu.duration}分
                  </span>
                </div>
              </div>
              {menu.description && (
                <p
                  className="text-neutral-600"
                  style={{
                    fontSize: "var(--text-base)",
                    fontWeight: "var(--weight-light)",
                    lineHeight: 1.6,
                  }}
                >
                  {menu.description}
                </p>
              )}
            </button>
            <div
              className="flex shrink-0 flex-col items-end"
              style={{ gap: "var(--space-md)" }}
            >
              <div
                className="text-accent whitespace-nowrap"
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "var(--text-2xl)",
                  fontWeight: "var(--weight-semibold)",
                  letterSpacing: "var(--tracking-tight)",
                }}
              >
                &yen;{menu.price.toLocaleString()}
                <span
                  className="text-neutral-500"
                  style={{
                    fontSize: "var(--text-xs)",
                    fontWeight: "var(--weight-normal)",
                    marginLeft: 2,
                  }}
                >
                  (税込)
                </span>
              </div>
              <Link
                to={`/shop/${tenant.urlPath}/reserve?menuId=${menu.id}`}
                className="inline-flex items-center justify-center gap-[var(--space-xs)] whitespace-nowrap border border-primary bg-[var(--color-bg-card)] text-primary no-underline transition-[background,color] duration-[0.15s] ease-[ease] hover:bg-primary hover:text-white active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                style={{
                  height: 40,
                  padding: "0 var(--space-lg)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--weight-medium)",
                  fontFamily: "var(--font-body)",
                }}
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
        ))}
      </div>

      {/* Staff Preview */}
      {staff.length > 0 && (
        <section
          className="border-t border-neutral-200"
          style={{
            marginTop: "var(--space-3xl)",
            paddingTop: "var(--space-2xl)",
          }}
        >
          <div
            className="flex items-baseline justify-between"
            style={{ marginBottom: "var(--space-lg)" }}
          >
            <h2
              className="text-neutral-900"
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "var(--text-xl)",
                fontWeight: "var(--weight-semibold)",
                letterSpacing: "var(--tracking-tight)",
              }}
            >
              スタッフ
            </h2>
            <button
              type="button"
              onClick={onSwitchToStaff}
              className="cursor-pointer border-none bg-transparent text-primary no-underline transition-colors duration-[0.15s] ease-[ease] hover:text-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              style={{
                fontSize: "var(--text-sm)",
                fontWeight: "var(--weight-medium)",
              }}
            >
              すべてのスタッフを見る &rarr;
            </button>
          </div>

          <div
            className="grid"
            style={{
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "var(--space-md)",
            }}
          >
            {staff.slice(0, 3).map((s) => (
              <div
                key={s.id}
                className="flex items-center bg-neutral-100 transition-[background] duration-[0.15s] ease-[ease] hover:bg-neutral-200"
                style={{
                  gap: "var(--space-md)",
                  padding: "var(--space-lg)",
                  borderRadius: "var(--radius-lg)",
                }}
              >
                <div
                  className="flex shrink-0 items-center justify-center text-secondary"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "var(--radius-full)",
                    background:
                      "linear-gradient(135deg, var(--color-secondary-lighter), var(--color-secondary-light))",
                    fontSize: "var(--text-lg)",
                    fontWeight: "var(--weight-medium)",
                    overflow: "hidden",
                  }}
                >
                  {s.imageUrl ? (
                    <img
                      src={s.imageUrl}
                      alt={s.displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    s.displayName.charAt(0)
                  )}
                </div>
                <div>
                  <div
                    className="text-neutral-900"
                    style={{
                      fontSize: "var(--text-base)",
                      fontWeight: "var(--weight-medium)",
                    }}
                  >
                    {s.displayName}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StaffContent({
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
      <p className="py-8 text-center text-neutral-500">
        スタッフが登録されていません
      </p>
    );
  }

  return (
    <div>
      <div
        className="flex items-baseline justify-between"
        style={{ marginBottom: "var(--space-lg)" }}
      >
        <h2
          className="text-neutral-900"
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "var(--text-xl)",
            fontWeight: "var(--weight-semibold)",
            letterSpacing: "var(--tracking-tight)",
          }}
        >
          スタッフ
        </h2>
        <span
          className="text-neutral-500"
          style={{
            fontSize: "var(--text-sm)",
            fontWeight: "var(--weight-normal)",
          }}
        >
          {staff.length}名
        </span>
      </div>

      <div
        className="grid"
        style={{
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "var(--space-md)",
        }}
      >
        {staff.map((s) => (
          <div
            key={s.id}
            className="flex items-center bg-neutral-100 transition-[background] duration-[0.15s] ease-[ease] hover:bg-neutral-200"
            style={{
              gap: "var(--space-md)",
              padding: "var(--space-lg)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <div
              className="flex shrink-0 items-center justify-center text-secondary"
              style={{
                width: 48,
                height: 48,
                borderRadius: "var(--radius-full)",
                background:
                  "linear-gradient(135deg, var(--color-secondary-lighter), var(--color-secondary-light))",
                fontSize: "var(--text-lg)",
                fontWeight: "var(--weight-medium)",
                overflow: "hidden",
              }}
            >
              {s.imageUrl ? (
                <img
                  src={s.imageUrl}
                  alt={s.displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                s.displayName.charAt(0)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => onSelectStaff(s.id)}
                className="cursor-pointer border-none bg-transparent text-neutral-900 hover:text-primary"
                style={{
                  fontSize: "var(--text-base)",
                  fontWeight: "var(--weight-medium)",
                  padding: 0,
                }}
              >
                {s.displayName}
              </button>
            </div>
            <Link
              to={`/shop/${tenant.urlPath}/reserve?staffId=${s.id}`}
              className="inline-flex shrink-0 items-center justify-center gap-[var(--space-xs)] whitespace-nowrap border border-primary bg-[var(--color-bg-card)] text-primary no-underline transition-[background,color] duration-[0.15s] ease-[ease] hover:bg-primary hover:text-white active:scale-[0.99]"
              style={{
                height: 36,
                padding: "0 var(--space-md)",
                borderRadius: "var(--radius-md)",
                fontSize: "var(--text-xs)",
                fontWeight: "var(--weight-medium)",
                fontFamily: "var(--font-body)",
              }}
            >
              指名予約
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

function AccessContent({ tenant }: { tenant: GetTenantOutput }) {
  const fullAddress = `${tenant.address.prefecture}${tenant.address.city}${tenant.address.street}`;

  return (
    <div className="flex flex-col" style={{ gap: "var(--space-xl)" }}>
      <div>
        <h3
          className="text-neutral-900"
          style={{
            fontSize: "var(--text-lg)",
            fontWeight: "var(--weight-medium)",
            marginBottom: "var(--space-sm)",
          }}
        >
          住所
        </h3>
        <p className="text-neutral-600">
          〒{tenant.postalCode}
          <br />
          {fullAddress}
        </p>
      </div>
      <div>
        <h3
          className="text-neutral-900"
          style={{
            fontSize: "var(--text-lg)",
            fontWeight: "var(--weight-medium)",
            marginBottom: "var(--space-sm)",
          }}
        >
          電話番号
        </h3>
        <p className="text-neutral-600">{tenant.phoneNumber}</p>
      </div>
    </div>
  );
}

function InfoContent({ tenant }: { tenant: GetTenantOutput }) {
  return (
    <div className="flex flex-col" style={{ gap: "var(--space-xl)" }}>
      <div>
        <h3
          className="text-neutral-900"
          style={{
            fontSize: "var(--text-lg)",
            fontWeight: "var(--weight-medium)",
            marginBottom: "var(--space-md)",
          }}
        >
          営業時間
        </h3>
        <div className="flex flex-col" style={{ gap: "var(--space-xs)" }}>
          {DAY_LABELS.map((dayLabel, dayIndex) => {
            const hours = tenant.businessHours[dayIndex];
            const isHoliday = tenant.regularHolidays.includes(dayIndex);
            return (
              <div
                key={dayLabel}
                className="flex"
                style={{
                  gap: "var(--space-lg)",
                  fontSize: "var(--text-sm)",
                }}
              >
                <span
                  className="text-neutral-800"
                  style={{
                    width: 32,
                    fontWeight: "var(--weight-medium)",
                  }}
                >
                  {dayLabel}
                </span>
                <span className="text-neutral-600">
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

      {tenant.temporaryHolidays.length > 0 && (
        <div>
          <h3
            className="text-neutral-900"
            style={{
              fontSize: "var(--text-lg)",
              fontWeight: "var(--weight-medium)",
              marginBottom: "var(--space-md)",
            }}
          >
            臨時休業日
          </h3>
          <div className="flex flex-col" style={{ gap: "var(--space-xs)" }}>
            {tenant.temporaryHolidays.map((holiday) => (
              <div
                key={holiday.date}
                className="text-neutral-600"
                style={{ fontSize: "var(--text-sm)" }}
              >
                {new Date(holiday.date).toLocaleDateString("ja-JP")}
                {holiday.reason && ` - ${holiday.reason}`}
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
  menu: MenuDetail;
  tenantId: string;
  urlPath: string;
  onClose: () => void;
}) {
  const fetcher = useFetcher();
  const fetcherSubmit = fetcher.submit;

  useEffect(() => {
    fetcherSubmit(
      { intent: "loadMenuStaff", menuId: menu.id },
      { method: "post" },
    );
  }, [menu.id, fetcherSubmit]);

  const assignableStaff: StaffProfileSummary[] =
    fetcher.data?.intent === "loadMenuStaff" ? fetcher.data.staff : [];
  const isLoadingStaff = fetcher.state !== "idle";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "var(--color-overlay)" }}
    >
      <div
        className="relative max-h-[80vh] w-full overflow-y-auto bg-[var(--color-bg-elevated)]"
        style={{
          maxWidth: 520,
          borderRadius: "var(--radius-xl)",
          padding: "var(--space-xl)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute cursor-pointer border-none bg-transparent text-neutral-500 hover:text-neutral-800"
          style={{ top: "var(--space-lg)", right: "var(--space-lg)" }}
          aria-label="閉じる"
        >
          <svg
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
          >
            <title>閉じる</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <h3
          className="text-neutral-900"
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "var(--text-xl)",
            fontWeight: "var(--weight-semibold)",
            marginBottom: "var(--space-lg)",
          }}
        >
          {menu.name}
        </h3>

        {menu.description && (
          <p
            className="text-neutral-600"
            style={{
              fontSize: "var(--text-base)",
              marginBottom: "var(--space-lg)",
            }}
          >
            {menu.description}
          </p>
        )}

        <div
          className="flex"
          style={{ gap: "var(--space-xl)", marginBottom: "var(--space-lg)" }}
        >
          <div>
            <span
              className="block text-neutral-500"
              style={{
                fontSize: "var(--text-xs)",
                fontWeight: "var(--weight-medium)",
              }}
            >
              所要時間
            </span>
            <span
              className="text-neutral-900"
              style={{ fontWeight: "var(--weight-medium)" }}
            >
              {menu.duration}分
            </span>
          </div>
          <div>
            <span
              className="block text-neutral-500"
              style={{
                fontSize: "var(--text-xs)",
                fontWeight: "var(--weight-medium)",
              }}
            >
              料金
            </span>
            <span
              className="text-accent"
              style={{
                fontWeight: "var(--weight-semibold)",
                fontSize: "var(--text-lg)",
              }}
            >
              &yen;{menu.price.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Assignable staff */}
        <div style={{ marginBottom: "var(--space-lg)" }}>
          <h4
            className="text-neutral-500"
            style={{
              fontSize: "var(--text-sm)",
              fontWeight: "var(--weight-medium)",
              marginBottom: "var(--space-sm)",
            }}
          >
            担当可能スタッフ
          </h4>
          {isLoadingStaff ? (
            <p
              className="text-neutral-500"
              style={{ fontSize: "var(--text-sm)" }}
            >
              読み込み中...
            </p>
          ) : assignableStaff.length === 0 ? (
            <p
              className="text-neutral-500"
              style={{ fontSize: "var(--text-sm)" }}
            >
              担当スタッフが登録されていません
            </p>
          ) : (
            <div className="flex flex-col" style={{ gap: "var(--space-sm)" }}>
              {assignableStaff.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center"
                  style={{ gap: "var(--space-sm)" }}
                >
                  <div
                    className="flex items-center justify-center overflow-hidden text-secondary"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "var(--radius-full)",
                      background:
                        "linear-gradient(135deg, var(--color-secondary-lighter), var(--color-secondary-light))",
                      fontSize: "var(--text-xs)",
                      fontWeight: "var(--weight-medium)",
                    }}
                  >
                    {s.imageUrl ? (
                      <img
                        src={s.imageUrl}
                        alt={s.displayName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      s.displayName.charAt(0)
                    )}
                  </div>
                  <span style={{ fontSize: "var(--text-sm)" }}>
                    {s.displayName}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <Link
          to={`/shop/${urlPath}/reserve?menuId=${menu.id}`}
          className="inline-flex w-full items-center justify-center border-none bg-primary text-white no-underline transition-[background] duration-[0.15s] ease-[ease] hover:bg-primary-dark active:scale-[0.99]"
          style={{
            height: 48,
            borderRadius: "var(--radius-md)",
            fontSize: "var(--text-base)",
            fontWeight: "var(--weight-medium)",
          }}
        >
          このメニューで予約する
        </Link>
      </div>
      <button
        type="button"
        className="fixed inset-0 -z-10 cursor-default border-none bg-transparent"
        onClick={onClose}
        aria-label="閉じる"
      />
    </div>
  );
}

function StaffDetailModal({
  staffId,
  urlPath,
  onClose,
}: {
  staffId: string;
  urlPath: string;
  onClose: () => void;
}) {
  const fetcher = useFetcher();
  const fetcherSubmit = fetcher.submit;

  useEffect(() => {
    fetcherSubmit(
      { intent: "loadStaffProfile", staffProfileId: staffId },
      { method: "post" },
    );
  }, [staffId, fetcherSubmit]);

  const profile: GetStaffProfileOutput | null =
    fetcher.data?.intent === "loadStaffProfile" ? fetcher.data.profile : null;
  const isLoading = fetcher.state !== "idle";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "var(--color-overlay)" }}
    >
      <div
        className="relative max-h-[80vh] w-full overflow-y-auto bg-[var(--color-bg-elevated)]"
        style={{
          maxWidth: 520,
          borderRadius: "var(--radius-xl)",
          padding: "var(--space-xl)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute cursor-pointer border-none bg-transparent text-neutral-500 hover:text-neutral-800"
          style={{ top: "var(--space-lg)", right: "var(--space-lg)" }}
          aria-label="閉じる"
        >
          <svg
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
          >
            <title>閉じる</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {isLoading ? (
          <p
            className="text-neutral-500"
            style={{ fontSize: "var(--text-sm)" }}
          >
            読み込み中...
          </p>
        ) : profile ? (
          <>
            <div
              className="flex items-center"
              style={{
                gap: "var(--space-md)",
                marginBottom: "var(--space-lg)",
              }}
            >
              <div
                className="flex shrink-0 items-center justify-center overflow-hidden text-secondary"
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "var(--radius-full)",
                  background:
                    "linear-gradient(135deg, var(--color-secondary-lighter), var(--color-secondary-light))",
                  fontSize: "var(--text-xl)",
                  fontWeight: "var(--weight-medium)",
                }}
              >
                {profile.imageUrl ? (
                  <img
                    src={profile.imageUrl}
                    alt={profile.displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  profile.displayName.charAt(0)
                )}
              </div>
              <h3
                className="text-neutral-900"
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "var(--text-xl)",
                  fontWeight: "var(--weight-semibold)",
                }}
              >
                {profile.displayName}
              </h3>
            </div>

            {profile.bio && (
              <p
                className="text-neutral-600"
                style={{
                  fontSize: "var(--text-base)",
                  marginBottom: "var(--space-lg)",
                }}
              >
                {profile.bio}
              </p>
            )}

            {profile.assignedMenus.length > 0 && (
              <div style={{ marginBottom: "var(--space-lg)" }}>
                <h4
                  className="text-neutral-500"
                  style={{
                    fontSize: "var(--text-sm)",
                    fontWeight: "var(--weight-medium)",
                    marginBottom: "var(--space-sm)",
                  }}
                >
                  担当メニュー
                </h4>
                <div
                  className="flex flex-wrap"
                  style={{ gap: "var(--space-sm)" }}
                >
                  {profile.assignedMenus.map((m) => (
                    <span
                      key={m.id}
                      className="bg-primary-lighter text-primary"
                      style={{
                        fontSize: "var(--text-xs)",
                        fontWeight: "var(--weight-medium)",
                        padding: "var(--space-xs) var(--space-sm)",
                        borderRadius: "var(--radius-sm)",
                      }}
                    >
                      {m.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <Link
              to={`/shop/${urlPath}/reserve?staffId=${staffId}`}
              className="inline-flex w-full items-center justify-center border-none bg-primary text-white no-underline transition-[background] duration-[0.15s] ease-[ease] hover:bg-primary-dark active:scale-[0.99]"
              style={{
                height: 48,
                borderRadius: "var(--radius-md)",
                fontSize: "var(--text-base)",
                fontWeight: "var(--weight-medium)",
              }}
            >
              このスタッフで予約する
            </Link>
          </>
        ) : (
          <p
            className="text-neutral-500"
            style={{ fontSize: "var(--text-sm)" }}
          >
            スタッフ情報を取得できませんでした
          </p>
        )}
      </div>
      <button
        type="button"
        className="fixed inset-0 -z-10 cursor-default border-none bg-transparent"
        onClick={onClose}
        aria-label="閉じる"
      />
    </div>
  );
}
