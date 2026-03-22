import { useState } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/schedule";

type ViewMode = "week" | "month";

// TODO: 認証チェック
export async function loader({ params }: Route.LoaderArgs) {
  const _tenantId = params.tenantId;

  // TODO: シフト・予約データ取得
  return {
    shifts: [] as {
      id: string;
      date: string;
      startTime: string;
      endTime: string;
    }[],
    reservations: [] as {
      id: string;
      date: string;
      startTime: string;
      endTime: string;
      customerName: string;
      menuName: string;
    }[],
  };
}

export default function StaffSchedulePage({
  loaderData,
}: Route.ComponentProps) {
  const { shifts, reservations } = loaderData;
  const [viewMode, setViewMode] = useState<ViewMode>("week");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">スケジュール</h1>
        <div className="flex items-center gap-3">
          <div className="flex rounded-md shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode("week")}
              className={`rounded-l-md px-3 py-1.5 text-sm font-medium ${
                viewMode === "week"
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              }`}
            >
              週表示
            </button>
            <button
              type="button"
              onClick={() => setViewMode("month")}
              className={`rounded-r-md px-3 py-1.5 text-sm font-medium ${
                viewMode === "month"
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              }`}
            >
              月表示
            </button>
          </div>
          <Link
            to="shift-requests"
            className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            シフト希望提出
          </Link>
        </div>
      </div>

      <div className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-gray-200">
        {/* TODO: カレンダーコンポーネント */}
        <div className="flex min-h-96 items-center justify-center text-sm text-gray-500">
          {viewMode === "week" ? "週表示カレンダー" : "月表示カレンダー"}
          <br />
          シフト: {shifts.length}件 / 予約: {reservations.length}件
        </div>
      </div>
    </div>
  );
}
