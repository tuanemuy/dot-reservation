import { Form } from "react-router";
import type { Route } from "./+types/shift-requests";

// TODO: 認証チェック
export async function loader({ params }: Route.LoaderArgs) {
  const _tenantId = params.tenantId;

  // TODO: シフト希望データ取得
  return {
    targetPeriod: {
      startDate: "",
      endDate: "",
    },
    shiftRequests: [] as {
      date: string;
      type: "work" | "off";
      startTime: string | null;
      endTime: string | null;
      note: string;
    }[],
    isSubmitted: false,
    canEdit: true,
  };
}

// TODO: 認証チェック
export async function action({ params, request }: Route.ActionArgs) {
  const _tenantId = params.tenantId;
  const _formData = await request.formData();

  // TODO: シフト希望提出処理
  return { success: true };
}

export default function StaffShiftRequestsPage({
  loaderData,
}: Route.ComponentProps) {
  const { targetPeriod, shiftRequests, isSubmitted, canEdit } = loaderData;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">シフト希望提出</h1>

      {isSubmitted && (
        <div className="rounded-md bg-green-50 p-3">
          <p className="text-sm text-green-700">
            シフト希望は提出済みです。
            {canEdit && "提出期限前であれば修正できます。"}
          </p>
        </div>
      )}

      <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700">
            対象期間: {targetPeriod.startDate || "未定"} 〜{" "}
            {targetPeriod.endDate || "未定"}
          </p>
        </div>

        <Form method="post" className="space-y-4">
          {shiftRequests.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              対象期間のシフト希望データがありません。
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {shiftRequests.map((req) => (
                <div key={req.date} className="flex items-center gap-4 py-3">
                  <span className="w-24 text-sm font-medium text-gray-900">
                    {req.date}
                  </span>
                  <select
                    name={`type-${req.date}`}
                    defaultValue={req.type}
                    disabled={!canEdit}
                    className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none"
                  >
                    <option value="work">勤務希望</option>
                    <option value="off">休み希望</option>
                  </select>
                  <input
                    type="time"
                    name={`startTime-${req.date}`}
                    defaultValue={req.startTime ?? ""}
                    disabled={!canEdit}
                    className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="time"
                    name={`endTime-${req.date}`}
                    defaultValue={req.endTime ?? ""}
                    disabled={!canEdit}
                    className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    name={`note-${req.date}`}
                    defaultValue={req.note}
                    placeholder="備考"
                    disabled={!canEdit}
                    className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          )}

          {canEdit && (
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none"
              >
                {isSubmitted ? "再提出" : "提出"}
              </button>
            </div>
          )}
        </Form>
      </div>
    </div>
  );
}
