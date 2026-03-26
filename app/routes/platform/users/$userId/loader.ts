import { data } from "react-router";
import { getCustomer } from "@/core/application/customer/getCustomer";
import { listReservations } from "@/core/application/reservation/listReservations";
import { TenantId } from "@/core/domain/tenant/valueObject";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/index";

export async function loader({ params, request }: Route.LoaderArgs) {
  const { container } = await import("@/core/di/server");
  const customerResult = await handleUseCase(() =>
    getCustomer({
      container,
      headers: request.headers,
      input: { customerId: params.userId },
    }),
  ).match(
    (result) => result,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  const reservationsResult = await handleUseCase(() =>
    listReservations({
      container,
      headers: request.headers,
      input: {
        customerId: customerResult.id,
        status: null,
        startDate: null,
        endDate: null,
        page: 1,
        limit: 10,
      },
    }),
  ).match(
    (result) => result,
    () => ({
      items: [] as {
        id: string;
        tenantId: string;
        menuName: string;
        date: string;
        startTime: string;
        status: string;
      }[],
      totalCount: 0,
    }),
  );

  // NOTE: 本来はユースケース経由でアクセスすべき。専用ユースケース追加時に修正する
  const uniqueTenantIds = [
    ...new Set(reservationsResult.items.map((r) => r.tenantId)),
  ];
  const tenantNames = new Map<string, string>();
  await Promise.all(
    uniqueTenantIds.map(async (tid) => {
      const tenantId = TenantId.create(tid);
      const tenant = await container.unitOfWorkProvider.transaction(
        async (repositories) =>
          repositories.tenantRepository.findById(tenantId),
      );
      if (tenant) {
        tenantNames.set(tid, tenant.name);
      }
    }),
  );

  const recentReservations = reservationsResult.items.map((r) => ({
    id: r.id,
    tenantName: tenantNames.get(r.tenantId) ?? "",
    menuName: r.menuName,
    date: r.date,
    status: r.status,
  }));

  const lastLogin = await container.authProvider.getLastLoginAt(
    customerResult.authUserId,
  );

  return {
    user: {
      id: customerResult.id,
      name: customerResult.displayName,
      email: customerResult.email,
      phone: customerResult.phoneNumber ?? "",
      status: customerResult.status as "active" | "suspended",
      createdAt: customerResult.createdAt.toLocaleDateString("ja-JP"),
      lastLoginAt: lastLogin ? lastLogin.toLocaleDateString("ja-JP") : null,
    },
    reservationStats: {
      totalCount: reservationsResult.totalCount,
      recentReservations,
    },
  };
}
