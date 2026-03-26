import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { useCompositeAction } from "@/lib/compositeAction";
import type { handlers } from "@/routes/admin/$tenantId/members/action";

type MemberData = {
  id: string;
  name: string;
};

type RemoveMemberModalProps = {
  member: MemberData | null;
  open: boolean;
  onClose: () => void;
  fetcher: ReturnType<typeof useCompositeAction<typeof handlers>>;
  isPendingRemove: boolean;
};

export function RemoveMemberModal({
  member,
  open,
  onClose,
  fetcher,
  isPendingRemove,
}: RemoveMemberModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="メンバー削除">
      <p className="mb-6 text-sm text-neutral-600">
        {member
          ? `${member.name} を削除しますか？`
          : "このメンバーを削除しますか？"}
        担当している予約は「担当者未定」になります。
      </p>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onClose}>
          キャンセル
        </Button>
        <fetcher.Form method="post">
          <input type="hidden" name="intent" value="removeMember" />
          <input type="hidden" name="memberId" value={member?.id ?? ""} />
          <Button
            type="submit"
            variant="destructive"
            disabled={isPendingRemove}
          >
            {isPendingRemove ? "削除中..." : "削除する"}
          </Button>
        </fetcher.Form>
      </div>
    </Modal>
  );
}
