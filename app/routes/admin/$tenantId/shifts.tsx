import { useState } from "react";
import { z } from "zod";
import { createShift } from "@/core/application/shift/createShift";
import { deleteShift } from "@/core/application/shift/deleteShift";
import { listShifts } from "@/core/application/shift/listShifts";
import { listStaffProfiles } from "@/core/application/staff/listStaffProfiles";
import { container } from "@/core/di/server";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
  useCompositeAction,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/shifts";

type ViewMode = "week" | "month";

function getWeekRange(baseDate: Date): { start: string; end: string } {
  const start = new Date(baseDate);
  const dayOfWeek = start.getDay();
  start.setDate(start.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return {
    start: formatDate(start),
    end: formatDate(end),
  };
}

function getMonthRange(baseDate: Date): { start: string; end: string } {
  const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  const end = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
  return {
    start: formatDate(start),
    end: formatDate(end),
  };
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const tenantId = params.tenantId;
  const url = new URL(request.url);
  const viewMode = (url.searchParams.get("view") as ViewMode) || "week";
  const today = new Date();

  const range =
    viewMode === "month" ? getMonthRange(today) : getWeekRange(today);

  const staffResult = await handleUseCase(() =>
    listStaffProfiles({
      container,
      headers: request.headers,
      input: { tenantId },
    }),
  ).match(
    (result) => result,
    () => ({ items: [] }),
  );

  const shiftsResult = await handleUseCase(() =>
    listShifts({
      container,
      headers: request.headers,
      input: {
        tenantId,
        startDate: range.start,
        endDate: range.end,
        staffProfileId: null,
      },
    }),
  ).match(
    (result) => result,
    () => ({ items: [] }),
  );

  return {
    staffList: staffResult.items,
    shifts: shiftsResult.items,
  };
}

const addShiftSchema = z.object({
  staffId: z.string().min(1, "スタッフを選択してください"),
  date: z.string().min(1, "日付を入力してください"),
  startTime: z.string().min(1, "開始時刻を入力してください"),
  endTime: z.string().min(1, "終了時刻を入力してください"),
  isRecurring: z.string().optional(),
  recurringEndDate: z.string().optional(),
});

const deleteShiftSchema = z.object({
  shiftId: z.string().min(1),
  deleteScope: z.enum(["single", "future"]),
});

export const handlers = {
  addShift: defineHandler({
    schema: addShiftSchema,
    handler: async (value, args) => {
      return handleUseCase(() =>
        createShift({
          container,
          headers: args.request.headers,
          input: {
            tenantId: args.params.tenantId as string,
            staffProfileId: value.staffId,
            date: value.date,
            startTime: value.startTime,
            endTime: value.endTime,
            recurring: value.isRecurring === "on",
            recurringEndDate: value.recurringEndDate || null,
          },
        }),
      ).match(
        (result) => success({ shiftIds: result.shiftIds }),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
  deleteShift: defineHandler({
    schema: deleteShiftSchema,
    handler: async (value, args) => {
      return handleUseCase(() =>
        deleteShift({
          container,
          headers: args.request.headers,
          input: {
            shiftId: value.shiftId,
            deleteScope: value.deleteScope,
          },
        }),
      ).match(
        () => success(),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}

export default function TenantShiftsPage({ loaderData }: Route.ComponentProps) {
  const { staffList, shifts } = loaderData;
  const fetcher = useCompositeAction<typeof handlers>();
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [staffFilter, setStaffFilter] = useState<string>("all");
  const [showAddForm, setShowAddForm] = useState(false);

  fetcher.register("addShift", {
    onSuccess: () => {
      setShowAddForm(false);
    },
  });

  const isPendingAdd = fetcher.isPending("addShift");

  const filteredShifts =
    staffFilter === "all"
      ? shifts
      : shifts.filter((s) => s.staffProfileId === staffFilter);

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">シフト管理</h1>
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          シフトを追加
        </button>
      </div>

      {/* シフト追加フォーム */}
      {showAddForm && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            シフト登録
          </h2>
          <fetcher.Form method="post" className="space-y-4">
            <input type="hidden" name="intent" value="addShift" />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="shiftStaff"
                  className="block text-sm font-medium text-gray-700"
                >
                  スタッフ
                </label>
                <select
                  id="shiftStaff"
                  name="staffId"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">選択してください</option>
                  {staffList.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.displayName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="shiftDate"
                  className="block text-sm font-medium text-gray-700"
                >
                  日付
                </label>
                <input
                  id="shiftDate"
                  name="date"
                  type="date"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="shiftStartTime"
                  className="block text-sm font-medium text-gray-700"
                >
                  開始時刻
                </label>
                <input
                  id="shiftStartTime"
                  name="startTime"
                  type="time"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="shiftEndTime"
                  className="block text-sm font-medium text-gray-700"
                >
                  終了時刻
                </label>
                <input
                  id="shiftEndTime"
                  name="endTime"
                  type="time"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isRecurring"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">繰り返しシフト</span>
              </label>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isPendingAdd}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isPendingAdd ? "登録中..." : "シフトを登録"}
              </button>
            </div>
          </fetcher.Form>
        </div>
      )}

      {/* コントロール */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* 表示切替 */}
          <div className="flex rounded-md border border-gray-300">
            <button
              type="button"
              onClick={() => setViewMode("week")}
              className={`px-3 py-1.5 text-sm font-medium ${
                viewMode === "week"
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              } rounded-l-md`}
            >
              週表示
            </button>
            <button
              type="button"
              onClick={() => setViewMode("month")}
              className={`px-3 py-1.5 text-sm font-medium ${
                viewMode === "month"
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              } rounded-r-md`}
            >
              月表示
            </button>
          </div>

          {/* スタッフフィルター */}
          <select
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700"
          >
            <option value="all">全スタッフ</option>
            {staffList.map((staff) => (
              <option key={staff.id} value={staff.id}>
                {staff.displayName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* シフト一覧 */}
      {filteredShifts.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8">
          <div className="flex min-h-48 items-center justify-center text-gray-400">
            <p>表示するシフトがありません</p>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  日付
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  スタッフ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  時間
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredShifts.map((shift) => {
                const staffName =
                  staffList.find((s) => s.id === shift.staffProfileId)
                    ?.displayName ?? "-";
                return (
                  <tr key={shift.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {shift.date}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {staffName}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {shift.startTime} - {shift.endTime}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                      <fetcher.Form method="post" className="inline">
                        <input
                          type="hidden"
                          name="intent"
                          value="deleteShift"
                        />
                        <input type="hidden" name="shiftId" value={shift.id} />
                        <input
                          type="hidden"
                          name="deleteScope"
                          value="single"
                        />
                        <button
                          type="submit"
                          className="font-medium text-red-600 hover:text-red-500"
                        >
                          削除
                        </button>
                      </fetcher.Form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
