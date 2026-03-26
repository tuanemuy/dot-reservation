import { useCallback, useEffect } from "react";
import { Link, useFetcher } from "react-router";
import type { GetStaffProfileOutput } from "@/core/application/staff/getStaffProfile";
import { ModalCloseButton } from "./ModalCloseButton";
import { StaffAvatar } from "./StaffAvatar";

type StaffDetailModalProps = {
  staffId: string;
  urlPath: string;
  onClose: () => void;
};

export function StaffDetailModal({
  staffId,
  urlPath,
  onClose,
}: StaffDetailModalProps) {
  const fetcher = useFetcher();
  const fetcherSubmit = fetcher.submit;

  useEffect(() => {
    fetcherSubmit(
      { intent: "loadStaffProfile", staffProfileId: staffId },
      { method: "post" },
    );
  }, [staffId, fetcherSubmit]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const profile: GetStaffProfileOutput | null =
    fetcher.data?.intent === "loadStaffProfile" && fetcher.data.data
      ? fetcher.data.data.profile
      : null;
  const isLoading = fetcher.state !== "idle";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-label="スタッフ詳細"
    >
      <div className="relative max-h-[80vh] w-full max-w-[520px] overflow-y-auto rounded-xl bg-white p-8 shadow-lg">
        <ModalCloseButton onClose={onClose} />

        {isLoading ? (
          <p className="text-sm text-neutral-500">読み込み中...</p>
        ) : profile ? (
          <StaffProfileContent
            profile={profile}
            staffId={staffId}
            urlPath={urlPath}
          />
        ) : (
          <p className="text-sm text-neutral-500">
            スタッフ情報を取得できませんでした
          </p>
        )}
      </div>
      <button
        type="button"
        className="fixed inset-0 -z-10 cursor-default border-none bg-transparent"
        onClick={onClose}
        aria-label="閉じる"
      />
    </div>
  );
}

function StaffProfileContent({
  profile,
  staffId,
  urlPath,
}: {
  profile: GetStaffProfileOutput;
  staffId: string;
  urlPath: string;
}) {
  return (
    <>
      <div className="mb-6 flex items-center gap-4">
        <StaffAvatar
          displayName={profile.displayName}
          imageUrl={profile.imageUrl}
          size="lg"
        />
        <h3 className="font-heading text-xl font-semibold text-neutral-900">
          {profile.displayName}
        </h3>
      </div>

      {profile.bio && (
        <p className="mb-6 text-base text-neutral-600">{profile.bio}</p>
      )}

      {profile.assignedMenus.length > 0 && (
        <div className="mb-6">
          <h4 className="mb-2 text-sm font-medium text-neutral-500">
            担当メニュー
          </h4>
          <div className="flex flex-wrap gap-2">
            {profile.assignedMenus.map((m) => (
              <span
                key={m.id}
                className="rounded-sm bg-primary-lighter px-2 py-1 text-xs font-medium text-primary"
              >
                {m.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <Link
        to={`/shop/${urlPath}/reserve?staffId=${staffId}`}
        className="inline-flex h-12 w-full items-center justify-center rounded-md border-none bg-primary text-base font-medium text-white no-underline transition-[background] duration-150 hover:bg-primary-dark active:scale-[0.99]"
      >
        このスタッフで予約する
      </Link>
    </>
  );
}
