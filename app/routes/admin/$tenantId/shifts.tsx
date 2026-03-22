import { useState } from "react";
import { Form, useNavigation } from "react-router";

// TODO: loader でシフトデータを取得
// TODO: action でシフト登録・編集・削除を実装

type ViewMode = "week" | "month";

// 仮データ
const mockStaffList = [
  { id: "1", name: "佐藤 花子" },
  { id: "2", name: "田中 次郎" },
];

export default function TenantShiftsPage() {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [staffFilter, setStaffFilter] = useState<string>("all");
  const [showAddForm, setShowAddForm] = useState(false);

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
          <Form method="post" className="space-y-4">
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
                  {mockStaffList.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name}
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
                disabled={isSubmitting}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? "登録中..." : "シフトを登録"}
              </button>
            </div>
          </Form>
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
            {mockStaffList.map((staff) => (
              <option key={staff.id} value={staff.id}>
                {staff.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* カレンダー表示（プレースホルダー） */}
      <div className="rounded-lg border border-gray-200 bg-white p-8">
        <div className="flex min-h-96 items-center justify-center text-gray-400">
          <p>
            {viewMode === "week" ? "週" : "月"}
            表示のシフトカレンダーがここに表示されます
          </p>
          {/* TODO: シフトカレンダーコンポーネントを実装 */}
        </div>
      </div>
    </div>
  );
}
