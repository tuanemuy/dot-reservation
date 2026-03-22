import { useState } from "react";
import { Form, useNavigation } from "react-router";

// TODO: loader で招待一覧を取得
// TODO: action で招待の承認・辞退を実装

// 仮データ
const mockInvitations = [
  {
    id: "1",
    tenantName: "サロン C",
    inviterName: "田中 太郎",
    role: "スタッフ",
    invitedAt: "2024-01-15",
  },
  {
    id: "2",
    tenantName: "クリニック D",
    inviterName: "佐藤 花子",
    role: "管理者",
    invitedAt: "2024-01-14",
  },
];

export default function AdminInvitationsPage() {
  const invitations = mockInvitations;
  const navigation = useNavigation();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<
    "accept" | "decline" | null
  >(null);

  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="p-8">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">招待一覧</h1>

      {invitations.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">未対応の招待はありません</p>
        </div>
      ) : (
        <div className="space-y-4">
          {invitations.map((invitation) => (
            <div
              key={invitation.id}
              className="rounded-lg border border-gray-200 bg-white p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {invitation.tenantName}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    招待者: {invitation.inviterName}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    招待日: {invitation.invitedAt}
                  </p>
                  <span className="mt-2 inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                    {invitation.role}
                  </span>
                </div>

                {confirmingId === invitation.id ? (
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-gray-600">
                      {confirmAction === "accept"
                        ? "承認しますか？"
                        : "辞退しますか？"}
                    </p>
                    <Form method="post">
                      <input
                        type="hidden"
                        name="invitationId"
                        value={invitation.id}
                      />
                      <input
                        type="hidden"
                        name="action"
                        value={confirmAction ?? ""}
                      />
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`rounded-md px-3 py-1.5 text-sm font-medium text-white ${
                          confirmAction === "accept"
                            ? "bg-blue-600 hover:bg-blue-700"
                            : "bg-red-600 hover:bg-red-700"
                        } disabled:opacity-50`}
                      >
                        {isSubmitting ? "処理中..." : "はい"}
                      </button>
                    </Form>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmingId(null);
                        setConfirmAction(null);
                      }}
                      className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      キャンセル
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmingId(invitation.id);
                        setConfirmAction("accept");
                      }}
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      承認
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmingId(invitation.id);
                        setConfirmAction("decline");
                      }}
                      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      辞退
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
