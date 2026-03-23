import { useState } from "react";
import { data, Link, useSearchParams } from "react-router";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { listReservations } from "@/core/application/reservation/listReservations";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/index";

type BadgeVariant =
  | "default"
  | "primary"
  | "accent"
  | "success"
  | "warning"
  | "destructive";

const statusLabels: Record<string, string> = {
  confirmed: "確定",
  pending: "承認待ち",
  cancelled: "キャンセル",
  completed: "完了",
  rejected: "却下",
};

const statusBadgeVariants: Record<string, BadgeVariant> = {
  pending: "warning",
  confirmed: "success",
  completed: "default",
  cancelled: "destructive",
  rejected: "destructive",
};

function formatToday(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const viewTabs = [
  { id: "list", label: "リスト" },
  { id: "calendar", label: "カレンダー" },
];

const ITEMS_PER_PAGE = 20;

export async function loader({ params, request }: Route.LoaderArgs) {
  const { container } = await import("@/core/di/server");
  const tenantId = params.tenantId;
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const startDate = url.searchParams.get("startDate") ?? formatToday();
  const endDate = url.searchParams.get("endDate");
  const page = Number.parseInt(url.searchParams.get("page") ?? "1", 10);

  const result = await handleUseCase(() =>
    listReservations({
      container,
      headers: request.headers,
      input: {
        tenantId,
        status: status || null,
        startDate,
        endDate: endDate || null,
        page,
        limit: ITEMS_PER_PAGE,
      },
    }),
  ).match(
    (result) => result,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  return {
    reservations: result.items,
    pagination: {
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(result.totalCount / ITEMS_PER_PAGE)),
    },
  };
}

export default function StaffReservationsPage({
  loaderData,
}: Route.ComponentProps) {
  const { reservations, pagination } = loaderData;
  const [viewMode, setViewMode] = useState("list");
  const [searchParams, setSearchParams] = useSearchParams();

  const currentStatus = searchParams.get("status") ?? "";

  function handleStatusChange(newStatus: string) {
    const params = new URLSearchParams(searchParams);
    if (newStatus) {
      params.set("status", newStatus);
    } else {
      params.delete("status");
    }
    params.delete("page");
    setSearchParams(params);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text">予約管理</h1>
        <Link to="new">
          <Button size="sm">代理予約登録</Button>
        </Link>
      </div>

      {/* フィルター */}
      <div className="flex gap-3">
        <div className="w-48">
          <Select
            value={currentStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            <option value="">すべてのステータス</option>
            <option value="confirmed">確定</option>
            <option value="completed">完了</option>
            <option value="cancelled">キャンセル済み</option>
          </Select>
        </div>
      </div>

      <Tabs tabs={viewTabs} activeTab={viewMode} onTabChange={setViewMode}>
        {viewMode === "list" ? (
          <Card>
            <CardBody className="p-0">
              {reservations.length === 0 ? (
                <p className="p-8 text-center text-sm text-text-muted">
                  予約がありません
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border bg-surface-secondary">
                      <tr>
                        <th className="px-4 py-3 font-medium text-text-secondary">
                          ステータス
                        </th>
                        <th className="px-4 py-3 font-medium text-text-secondary">
                          顧客名
                        </th>
                        <th className="px-4 py-3 font-medium text-text-secondary">
                          メニュー
                        </th>
                        <th className="px-4 py-3 font-medium text-text-secondary">
                          日時
                        </th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {reservations.map((r) => (
                        <tr
                          key={r.id}
                          className="hover:bg-surface-secondary/50"
                        >
                          <td className="px-4 py-3">
                            <Badge
                              variant={
                                statusBadgeVariants[r.status] ?? "default"
                              }
                            >
                              {statusLabels[r.status] ?? r.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-text">
                            {r.customerName ?? "-"}
                          </td>
                          <td className="px-4 py-3 text-text-secondary">
                            {r.menuName}
                          </td>
                          <td className="px-4 py-3 text-text-secondary">
                            {r.date} {r.startTime}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              to={r.id}
                              className="text-sm font-medium text-primary hover:text-primary-dark"
                            >
                              詳細
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardBody>
              <div className="flex min-h-96 items-center justify-center text-sm text-text-muted">
                週表示カレンダー（自分の予約のみ）
              </div>
            </CardBody>
          </Card>
        )}
      </Tabs>

      {viewMode === "list" && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          baseUrl=""
          searchParams={searchParams}
        />
      )}
    </div>
  );
}
