import { data } from "react-router";
import type { MenuDetail } from "@/core/application/menu/listMenus";
import { listMenus } from "@/core/application/menu/listMenus";
import { getReservation } from "@/core/application/reservation/getReservation";
import { getTenant } from "@/core/application/tenant/getTenant";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/index";

export async function loader({ params, request }: Route.LoaderArgs) {
  const { container } = await import("@/core/di/server");
  const reservationId = params.id;

  const reservation = await handleUseCase(() =>
    getReservation({
      container,
      headers: request.headers,
      input: { reservationId },
    }),
  ).match(
    (r) => r,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  const tenant = await handleUseCase(() =>
    getTenant({
      container,
      headers: request.headers,
      input: { tenantId: reservation.tenantId },
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
      input: { tenantId: reservation.tenantId },
    }),
  ).match(
    (r) => r,
    () => ({ items: [] as MenuDetail[] }),
  );

  return {
    reservation,
    tenant,
    menus: menusResult.items,
  };
}
