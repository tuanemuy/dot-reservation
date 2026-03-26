import { data } from "react-router";
import type { MenuDetail } from "@/core/application/menu/listMenus";
import { listMenus } from "@/core/application/menu/listMenus";
import type { StaffProfileSummary } from "@/core/application/staff/listStaffProfiles";
import { listStaffProfiles } from "@/core/application/staff/listStaffProfiles";
import { getTenant } from "@/core/application/tenant/getTenant";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/index";

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
