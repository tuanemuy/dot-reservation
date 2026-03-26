import { useCallback, useEffect } from "react";
import { Link, useFetcher } from "react-router";
import type { MenuDetail } from "@/core/application/menu/listMenus";
import type { StaffProfileSummary } from "@/core/application/staff/listStaffProfiles";
import { ModalCloseButton } from "./ModalCloseButton";
import { StaffAvatar } from "./StaffAvatar";

type MenuDetailModalProps = {
  menu: MenuDetail;
  urlPath: string;
  onClose: () => void;
};

export function MenuDetailModal({
  menu,
  urlPath,
  onClose,
}: MenuDetailModalProps) {
  const fetcher = useFetcher();
  const fetcherSubmit = fetcher.submit;

  useEffect(() => {
    fetcherSubmit(
      { intent: "loadMenuStaff", menuId: menu.id },
      { method: "post" },
    );
  }, [menu.id, fetcherSubmit]);

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

  const assignableStaff: StaffProfileSummary[] =
    fetcher.data?.intent === "loadMenuStaff" && fetcher.data.data
      ? fetcher.data.data.staff
      : [];
  const isLoadingStaff = fetcher.state !== "idle";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-label={menu.name}
    >
      <div className="relative max-h-[80vh] w-full max-w-[520px] overflow-y-auto rounded-xl bg-white p-8 shadow-lg">
        <ModalCloseButton onClose={onClose} />

        <h3 className="mb-6 font-heading text-xl font-semibold text-neutral-900">
          {menu.name}
        </h3>

        {menu.description && (
          <p className="mb-6 text-base text-neutral-600">{menu.description}</p>
        )}

        <div className="mb-6 flex gap-8">
          <div>
            <span className="block text-xs font-medium text-neutral-500">
              所要時間
            </span>
            <span className="font-medium text-neutral-900">
              {menu.duration}分
            </span>
          </div>
          <div>
            <span className="block text-xs font-medium text-neutral-500">
              料金
            </span>
            <span className="text-lg font-semibold text-accent">
              &yen;{menu.price.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="mb-6">
          <h4 className="mb-2 text-sm font-medium text-neutral-500">
            担当可能スタッフ
          </h4>
          {isLoadingStaff ? (
            <p className="text-sm text-neutral-500">読み込み中...</p>
          ) : assignableStaff.length === 0 ? (
            <p className="text-sm text-neutral-500">
              担当スタッフが登録されていません
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {assignableStaff.map((s) => (
                <div key={s.id} className="flex items-center gap-2">
                  <StaffAvatar
                    displayName={s.displayName}
                    imageUrl={s.imageUrl}
                    size="sm"
                  />
                  <span className="text-sm">{s.displayName}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <Link
          to={`/shop/${urlPath}/reserve?menuId=${menu.id}`}
          className="inline-flex h-12 w-full items-center justify-center rounded-md border-none bg-primary text-base font-medium text-white no-underline transition-[background] duration-150 hover:bg-primary-dark active:scale-[0.99]"
        >
          このメニューで予約する
        </Link>
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
