import { data } from "react-router";
import { listMembers } from "@/core/application/member/listMembers";
import { listMenus } from "@/core/application/menu/listMenus";
import { getTenant } from "@/core/application/tenant/getTenant";
import { TenantId } from "@/core/domain/tenant/valueObject";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/index";

export async function loader({ params, request }: Route.LoaderArgs) {
  const { container } = await import("@/core/di/server");
  const tenantResult = await handleUseCase(() =>
    getTenant({
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

  const membersResult = await handleUseCase(() =>
    listMembers({
      container,
      headers: request.headers,
      input: { tenantId: params.tenantId, role: null },
    }),
  ).match(
    (result) => result,
    () => ({
      items: [] as {
        id: string;
        name: string;
        email: string;
        role: string;
        joinedAt: string;
      }[],
    }),
  );

  const tenantId = TenantId.create(params.tenantId);

  // NOTE: 本来はユースケース経由でアクセスすべき。専用ユースケース追加時に修正する
  const [menusResult, totalReservations, monthlyReservations] =
    await Promise.all([
      handleUseCase(() =>
        listMenus({
          container,
          headers: request.headers,
          input: { tenantId: params.tenantId },
        }),
      ).match(
        (result) => result,
        () => ({ items: [] as { id: string }[] }),
      ),
      container.reservationRepository.countByTenantId(tenantId),
      container.reservationRepository.countByTenantIdAndMonth(
        tenantId,
        new Date().getFullYear(),
        new Date().getMonth() + 1,
      ),
    ]);

  const address = [
    tenantResult.address.prefecture,
    tenantResult.address.city,
    tenantResult.address.street,
  ]
    .filter(Boolean)
    .join("");

  return {
    tenant: {
      id: tenantResult.id,
      name: tenantResult.name,
      category: tenantResult.category,
      urlPath: tenantResult.urlPath,
      address,
      phone: tenantResult.phoneNumber,
      status: tenantResult.status as "active" | "suspended",
      createdAt: tenantResult.createdAt.toLocaleDateString("ja-JP"),
    },
    members: membersResult.items.map((m) => ({
      id: m.id,
      name: m.name,
      role: m.role,
      joinedAt: m.joinedAt,
    })),
    stats: {
      menuCount: menusResult.items.length,
      totalReservations,
      monthlyReservations,
    },
  };
}
