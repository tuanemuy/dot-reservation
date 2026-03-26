import { useState } from "react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { AccessSection } from "@/components/shop/AccessSection";
import { HeroGallery } from "@/components/shop/HeroGallery";
import { HeroInfo } from "@/components/shop/HeroInfo";
import { InfoSection } from "@/components/shop/InfoSection";
import { MenuDetailModal } from "@/components/shop/MenuDetailModal";
import { MenuSection } from "@/components/shop/MenuSection";
import { type ShopTabId, ShopTabs } from "@/components/shop/ShopTabs";
import { StaffDetailModal } from "@/components/shop/StaffDetailModal";
import { StaffSection } from "@/components/shop/StaffSection";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";
import type { MenuDetail } from "@/core/application/menu/listMenus";
import type { Route } from "./+types/index";

export { action } from "./action";
export { loader } from "./loader";

export default function ShopDetailPage({ loaderData }: Route.ComponentProps) {
  const { tenant, menus, staff } = loaderData;
  const [activeTab, setActiveTab] = useState<ShopTabId>("menus");
  const [selectedMenu, setSelectedMenu] = useState<MenuDetail | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);

  return (
    <PublicLayout>
      <Container>
        <Breadcrumb
          items={[
            { label: "トップ", to: "/" },
            {
              label: tenant.address.prefecture,
              to: `/search?area=${encodeURIComponent(tenant.address.prefecture)}`,
            },
            { label: tenant.name },
          ]}
        />

        {/* Hero */}
        <section className="grid items-start gap-14 pb-14 pt-6 max-md:grid-cols-1 md:grid-cols-2">
          <HeroGallery imageUrls={tenant.imageUrls} shopName={tenant.name} />
          <HeroInfo
            tenant={tenant}
            menuCount={menus.length}
            staffCount={staff.length}
          />
        </section>

        <ShopTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Content */}
        <section role="tabpanel" id={`tabpanel-${activeTab}`} className="pb-20">
          {activeTab === "menus" && (
            <MenuSection
              menus={menus}
              staff={staff}
              urlPath={tenant.urlPath}
              onSelectMenu={setSelectedMenu}
              onSwitchToStaff={() => setActiveTab("staff")}
            />
          )}
          {activeTab === "staff" && (
            <StaffSection
              staff={staff}
              urlPath={tenant.urlPath}
              onSelectStaff={setSelectedStaff}
            />
          )}
          {activeTab === "access" && <AccessSection tenant={tenant} />}
          {activeTab === "info" && <InfoSection tenant={tenant} />}
        </section>

        {selectedMenu && (
          <MenuDetailModal
            menu={selectedMenu}
            urlPath={tenant.urlPath}
            onClose={() => setSelectedMenu(null)}
          />
        )}

        {selectedStaff && (
          <StaffDetailModal
            staffId={selectedStaff}
            urlPath={tenant.urlPath}
            onClose={() => setSelectedStaff(null)}
          />
        )}
      </Container>
    </PublicLayout>
  );
}
