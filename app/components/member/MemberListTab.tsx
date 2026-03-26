import type { useCompositeAction } from "@/lib/compositeAction";
import type { handlers } from "@/routes/admin/$tenantId/members/action";
import { roleLabels } from "./constants";

type MemberData = {
  id: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
};

type MemberListTabProps = {
  members: MemberData[];
  currentMemberId: string;
  canManageMembers: boolean;
  fetcher: ReturnType<typeof useCompositeAction<typeof handlers>>;
  isPendingChangeRole: boolean;
  onRemoveMember: (memberId: string) => void;
};

export function MemberListTab({
  members,
  currentMemberId,
  canManageMembers,
  fetcher,
  isPendingChangeRole,
  onRemoveMember,
}: MemberListTabProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-neutral-300 bg-white">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border-b border-neutral-300 bg-neutral-50 px-6 py-2 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
              名前
            </th>
            <th className="border-b border-neutral-300 bg-neutral-50 px-6 py-2 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
              メールアドレス
            </th>
            <th className="border-b border-neutral-300 bg-neutral-50 px-6 py-2 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
              ロール
            </th>
            <th className="border-b border-neutral-300 bg-neutral-50 px-6 py-2 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
              参加日
            </th>
            <th className="border-b border-neutral-300 bg-neutral-50 px-6 py-2 text-right text-xs font-medium uppercase tracking-wide text-neutral-500">
              操作
            </th>
          </tr>
        </thead>
        <tbody>
          {members.map((member, index) => {
            const role = roleLabels[member.role] ?? {
              text: member.role,
              className: "bg-neutral-200 text-neutral-800",
            };
            const hasBorder = index < members.length - 1;
            return (
              <tr
                key={member.id}
                className="transition-colors duration-150 hover:bg-neutral-50"
              >
                <td
                  className={`whitespace-nowrap px-6 py-2 text-sm font-medium text-neutral-800 ${hasBorder ? "border-b border-neutral-200" : ""}`}
                >
                  {member.name}
                </td>
                <td
                  className={`whitespace-nowrap px-6 py-2 text-sm text-neutral-500 ${hasBorder ? "border-b border-neutral-200" : ""}`}
                >
                  {member.email}
                </td>
                <td
                  className={`whitespace-nowrap px-6 py-2 text-sm text-neutral-700 ${hasBorder ? "border-b border-neutral-200" : ""}`}
                >
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${role.className}`}
                  >
                    {role.text}
                  </span>
                </td>
                <td
                  className={`whitespace-nowrap px-6 py-2 text-sm text-neutral-500 ${hasBorder ? "border-b border-neutral-200" : ""}`}
                >
                  {new Date(member.joinedAt).toLocaleDateString("ja-JP")}
                </td>
                <td
                  className={`whitespace-nowrap px-6 py-2 text-right text-sm text-neutral-700 ${hasBorder ? "border-b border-neutral-200" : ""}`}
                >
                  <div className="flex items-center justify-end gap-2">
                    <fetcher.Form method="post" className="inline">
                      <input type="hidden" name="intent" value="changeRole" />
                      <input type="hidden" name="memberId" value={member.id} />
                      <select
                        name="role"
                        defaultValue={member.role}
                        disabled={isPendingChangeRole}
                        onChange={(e) => {
                          const form = e.target.closest("form");
                          if (form) form.requestSubmit();
                        }}
                        className="rounded-sm border border-neutral-300 px-2 py-1 text-xs text-neutral-600"
                      >
                        <option value="admin">管理者</option>
                        <option value="staff">スタッフ</option>
                      </select>
                    </fetcher.Form>
                    {canManageMembers && member.id !== currentMemberId && (
                      <button
                        type="button"
                        onClick={() => onRemoveMember(member.id)}
                        className="text-sm font-medium text-error"
                      >
                        削除
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
