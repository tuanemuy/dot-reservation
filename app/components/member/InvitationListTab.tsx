import { StatusBadge } from "@/components/ui/StatusBadge";
import type { useCompositeAction } from "@/lib/compositeAction";
import type { handlers } from "@/routes/admin/$tenantId/members/action";
import { roleLabels } from "./constants";

type InvitationData = {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
};

type InvitationListTabProps = {
  invitations: InvitationData[];
  fetcher: ReturnType<typeof useCompositeAction<typeof handlers>>;
};

export function InvitationListTab({
  invitations,
  fetcher,
}: InvitationListTabProps) {
  if (invitations.length === 0) {
    return (
      <div className="overflow-hidden rounded-lg border border-neutral-300 bg-white">
        <div className="p-8 text-center text-sm text-neutral-500">
          招待はありません
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-300 bg-white">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border-b border-neutral-300 bg-neutral-50 px-6 py-2 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
              メールアドレス
            </th>
            <th className="border-b border-neutral-300 bg-neutral-50 px-6 py-2 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
              ロール
            </th>
            <th className="border-b border-neutral-300 bg-neutral-50 px-6 py-2 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
              ステータス
            </th>
            <th className="border-b border-neutral-300 bg-neutral-50 px-6 py-2 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
              招待日
            </th>
            <th className="border-b border-neutral-300 bg-neutral-50 px-6 py-2 text-right text-xs font-medium uppercase tracking-wide text-neutral-500">
              操作
            </th>
          </tr>
        </thead>
        <tbody>
          {invitations.map((invitation, index) => {
            const invitationRole = roleLabels[invitation.role] ?? {
              text: invitation.role,
              className: "bg-neutral-200 text-neutral-800",
            };
            const hasBorder = index < invitations.length - 1;
            return (
              <tr
                key={invitation.id}
                className="transition-colors duration-150 hover:bg-neutral-50"
              >
                <td
                  className={`whitespace-nowrap px-6 py-2 text-sm text-neutral-800 ${hasBorder ? "border-b border-neutral-200" : ""}`}
                >
                  {invitation.email}
                </td>
                <td
                  className={`whitespace-nowrap px-6 py-2 text-sm text-neutral-700 ${hasBorder ? "border-b border-neutral-200" : ""}`}
                >
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${invitationRole.className}`}
                  >
                    {invitationRole.text}
                  </span>
                </td>
                <td
                  className={`whitespace-nowrap px-6 py-2 text-sm text-neutral-700 ${hasBorder ? "border-b border-neutral-200" : ""}`}
                >
                  <StatusBadge
                    status={invitation.status}
                    variant="invitation"
                  />
                </td>
                <td
                  className={`whitespace-nowrap px-6 py-2 text-sm text-neutral-500 ${hasBorder ? "border-b border-neutral-200" : ""}`}
                >
                  {new Date(invitation.createdAt).toLocaleDateString("ja-JP")}
                </td>
                <td
                  className={`whitespace-nowrap px-6 py-2 text-right text-sm text-neutral-700 ${hasBorder ? "border-b border-neutral-200" : ""}`}
                >
                  {invitation.status === "pending" && (
                    <div className="flex justify-end gap-2">
                      <fetcher.Form method="post" className="inline">
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
                          className="text-sm font-medium text-primary disabled:opacity-50"
                        >
                          再送信
                        </button>
                      </fetcher.Form>
                      <fetcher.Form method="post" className="inline">
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
                          className="text-sm font-medium text-error disabled:opacity-50"
                        >
                          取消
                        </button>
                      </fetcher.Form>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
