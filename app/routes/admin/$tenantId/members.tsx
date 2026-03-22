import { useState } from "react";
import { Form, useNavigation, useParams } from "react-router";

// TODO: loader でメンバー一覧・招待一覧を取得
// TODO: action でメンバー管理・招待操作を実装

// 仮データ
const mockMembers = [
  {
    id: "1",
    name: "佐藤 花子",
    email: "sato@example.com",
    role: "admin",
    joinedAt: "2024-01-01",
  },
  {
    id: "2",
    name: "田中 次郎",
    email: "tanaka@example.com",
    role: "staff",
    joinedAt: "2024-01-10",
  },
];

const mockPendingInvitations = [
  {
    id: "1",
    email: "yamada@example.com",
    role: "staff",
    status: "pending",
    invitedAt: "2024-01-14",
  },
];

const roleLabels: Record<string, { text: string; className: string }> = {
  admin: { text: "管理者", className: "bg-purple-100 text-purple-800" },
  staff: { text: "スタッフ", className: "bg-blue-100 text-blue-800" },
};

export default function TenantMembersPage() {
  const { tenantId: _tenantId } = useParams();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [activeTab, setActiveTab] = useState<"members" | "invitations">(
    "members",
  );
  const [showInviteForm, setShowInviteForm] = useState(false);

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">メンバー管理</h1>
        <button
          type="button"
          onClick={() => setShowInviteForm(true)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          メンバーを招待
        </button>
      </div>

      {/* 招待フォーム */}
      {showInviteForm && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            メンバー招待
          </h2>
          <Form method="post" className="flex items-end gap-4">
            <input type="hidden" name="intent" value="invite" />
            <div className="flex-1">
              <label
                htmlFor="inviteEmail"
                className="block text-sm font-medium text-gray-700"
              >
                メールアドレス
              </label>
              <input
                id="inviteEmail"
                name="email"
                type="email"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="email@example.com"
              />
            </div>
            <div className="w-40">
              <label
                htmlFor="inviteRole"
                className="block text-sm font-medium text-gray-700"
              >
                ロール
              </label>
              <select
                id="inviteRole"
                name="role"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="staff">スタッフ</option>
                <option value="admin">管理者</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? "送信中..." : "招待を送信"}
            </button>
            <button
              type="button"
              onClick={() => setShowInviteForm(false)}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              キャンセル
            </button>
          </Form>
        </div>
      )}

      {/* タブ */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex gap-4">
          <button
            type="button"
            onClick={() => setActiveTab("members")}
            className={`border-b-2 px-1 pb-3 text-sm font-medium ${
              activeTab === "members"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            メンバー ({mockMembers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("invitations")}
            className={`border-b-2 px-1 pb-3 text-sm font-medium ${
              activeTab === "invitations"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            招待 ({mockPendingInvitations.length})
          </button>
        </nav>
      </div>

      {/* メンバー一覧 */}
      {activeTab === "members" && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  名前
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  メールアドレス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  ロール
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  参加日
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {mockMembers.map((member) => {
                const role = roleLabels[member.role] ?? {
                  text: member.role,
                  className: "bg-gray-100 text-gray-800",
                };
                return (
                  <tr key={member.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {member.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {member.email}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${role.className}`}
                      >
                        {role.text}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {member.joinedAt}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                      <Form method="post" className="inline">
                        <input type="hidden" name="intent" value="changeRole" />
                        <input
                          type="hidden"
                          name="memberId"
                          value={member.id}
                        />
                        <select
                          name="role"
                          defaultValue={member.role}
                          onChange={(e) => {
                            const form = e.target.closest("form");
                            if (form) form.requestSubmit();
                          }}
                          className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700"
                        >
                          <option value="admin">管理者</option>
                          <option value="staff">スタッフ</option>
                        </select>
                      </Form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 招待一覧 */}
      {activeTab === "invitations" && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          {mockPendingInvitations.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              招待はありません
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    メールアドレス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    ロール
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    招待日
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {mockPendingInvitations.map((invitation) => (
                  <tr key={invitation.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {invitation.email}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                        {invitation.role === "admin" ? "管理者" : "スタッフ"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="inline-flex rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                        未対応
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {invitation.invitedAt}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Form method="post" className="inline">
                          <input
                            type="hidden"
                            name="intent"
                            value="resendInvitation"
                          />
                          <input
                            type="hidden"
                            name="invitationId"
                            value={invitation.id}
                          />
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="text-sm font-medium text-blue-600 hover:text-blue-500 disabled:opacity-50"
                          >
                            再送信
                          </button>
                        </Form>
                        <Form method="post" className="inline">
                          <input
                            type="hidden"
                            name="intent"
                            value="cancelInvitation"
                          />
                          <input
                            type="hidden"
                            name="invitationId"
                            value={invitation.id}
                          />
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="text-sm font-medium text-red-600 hover:text-red-500 disabled:opacity-50"
                          >
                            取消
                          </button>
                        </Form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
