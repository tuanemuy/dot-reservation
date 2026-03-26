import { useState } from "react";
import { toast } from "sonner";
import { InvitationListTab } from "@/components/member/InvitationListTab";
import { InviteForm } from "@/components/member/InviteForm";
import { MemberListTab } from "@/components/member/MemberListTab";
import { RemoveMemberModal } from "@/components/member/RemoveMemberModal";
import { Button } from "@/components/ui/Button";
import { useCompositeAction } from "@/lib/compositeAction";
import type { Route } from "./+types/index";
import type { handlers } from "./action";

export { action } from "./action";
export { loader } from "./loader";

export default function TenantMembersPage({
  loaderData,
}: Route.ComponentProps) {
  const { currentMemberId, currentMemberRole, members, invitations } =
    loaderData;
  const fetcher = useCompositeAction<typeof handlers>();
  const [activeTab, setActiveTab] = useState<"members" | "invitations">(
    "members",
  );
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const removingMember = removingMemberId
    ? members.find((m) => m.id === removingMemberId)
    : null;
  const canManageMembers =
    currentMemberRole === "admin" || currentMemberRole === "owner";

  fetcher.register("invite", {
    onSuccess: () => {
      setShowInviteForm(false);
    },
    onHandlerError: ({ error: err }) => {
      toast.error(err?.[""]?.[0] ?? "招待に失敗しました");
    },
  });

  fetcher.register("removeMember", {
    onSuccess: () => {
      setRemovingMemberId(null);
      toast.success("メンバーを削除しました");
    },
    onHandlerError: ({ error: err }) => {
      toast.error(err?.[""]?.[0] ?? "メンバーの削除に失敗しました");
    },
  });

  const isPendingInvite = fetcher.isPending("invite");
  const isPendingChangeRole = fetcher.isPending("changeRole");
  const isPendingRemove = fetcher.isPending("removeMember");

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold leading-tight tracking-tight text-neutral-900">
          メンバー管理
        </h1>
        <Button
          type="button"
          variant="primary"
          onClick={() => setShowInviteForm(true)}
        >
          メンバーを招待
        </Button>
      </div>

      {showInviteForm && (
        <InviteForm
          fetcher={fetcher}
          isPendingInvite={isPendingInvite}
          onClose={() => setShowInviteForm(false)}
        />
      )}

      {/* タブ */}
      <div className="mb-6 border-b border-neutral-300">
        <div className="flex gap-4" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "members"}
            aria-controls="tabpanel-members"
            onClick={() => setActiveTab("members")}
            className={`border-b-2 px-1 pb-2 text-sm font-medium ${
              activeTab === "members"
                ? "border-primary text-primary"
                : "border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-600"
            }`}
          >
            メンバー ({members.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "invitations"}
            aria-controls="tabpanel-invitations"
            onClick={() => setActiveTab("invitations")}
            className={`border-b-2 px-1 pb-2 text-sm font-medium ${
              activeTab === "invitations"
                ? "border-primary text-primary"
                : "border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-600"
            }`}
          >
            招待 ({invitations.length})
          </button>
        </div>
      </div>

      {activeTab === "members" && (
        <div id="tabpanel-members" role="tabpanel">
          <MemberListTab
            members={members}
            currentMemberId={currentMemberId}
            canManageMembers={canManageMembers}
            fetcher={fetcher}
            isPendingChangeRole={isPendingChangeRole}
            onRemoveMember={setRemovingMemberId}
          />
        </div>
      )}

      {activeTab === "invitations" && (
        <div id="tabpanel-invitations" role="tabpanel">
          <InvitationListTab invitations={invitations} fetcher={fetcher} />
        </div>
      )}

      <RemoveMemberModal
        member={
          removingMember
            ? { id: removingMember.id, name: removingMember.name }
            : null
        }
        open={removingMemberId !== null}
        onClose={() => setRemovingMemberId(null)}
        fetcher={fetcher}
        isPendingRemove={isPendingRemove}
      />
    </div>
  );
}
