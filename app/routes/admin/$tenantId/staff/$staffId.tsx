import { useState } from "react";
import { Form, Link, useNavigation, useParams } from "react-router";

// TODO: loader でスタッフ情報を取得
// TODO: action でスタッフ情報更新を実装

// 仮データ
const mockStaff = {
  name: "佐藤 花子",
  bio: "カラーが得意です。お気軽にご相談ください。",
  image: null as string | null,
};

const mockAllMenus = [
  { id: "1", name: "カット", isAssigned: true },
  { id: "2", name: "カラー", isAssigned: true },
  { id: "3", name: "パーマ", isAssigned: false },
  { id: "4", name: "カット＋カラー", isAssigned: true },
];

export default function TenantStaffDetailPage() {
  const { tenantId, staffId: _staffId } = useParams();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [assignedMenus, setAssignedMenus] = useState(
    mockAllMenus.map((m) => ({ ...m })),
  );

  const toggleMenu = (menuId: string) => {
    setAssignedMenus((prev) =>
      prev.map((m) =>
        m.id === menuId ? { ...m, isAssigned: !m.isAssigned } : m,
      ),
    );
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          to={`/admin/${tenantId}/staff`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; スタッフ一覧に戻る
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">スタッフ詳細</h1>
      </div>

      <div className="max-w-2xl space-y-8">
        {/* プロフィール編集 */}
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            プロフィール
          </h2>
          <Form method="post" className="space-y-4">
            <input type="hidden" name="intent" value="updateProfile" />

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                スタッフ表示名
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                defaultValue={mockStaff.name}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <span className="block text-sm font-medium text-gray-700">
                プロフィール画像
              </span>
              <div className="mt-1 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 text-gray-500">
                  {mockStaff.image ? (
                    <img
                      src={mockStaff.image}
                      alt={mockStaff.name}
                      className="h-16 w-16 rounded-full object-cover"
                    />
                  ) : (
                    <svg
                      className="h-8 w-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  )}
                </div>
                {/* TODO: 画像アップロード機能を実装 */}
                <button
                  type="button"
                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  画像を変更
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="bio"
                className="block text-sm font-medium text-gray-700"
              >
                自己紹介文
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={3}
                defaultValue={mockStaff.bio}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? "更新中..." : "プロフィールを更新"}
              </button>
            </div>
          </Form>
        </section>

        {/* 担当メニュー設定 */}
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            担当メニュー
          </h2>
          <Form method="post">
            <input type="hidden" name="intent" value="updateMenus" />
            <input
              type="hidden"
              name="assignedMenuIds"
              value={JSON.stringify(
                assignedMenus.filter((m) => m.isAssigned).map((m) => m.id),
              )}
            />

            <div className="space-y-3">
              {assignedMenus.map((menu) => (
                <label
                  key={menu.id}
                  className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={menu.isAssigned}
                    onChange={() => toggleMenu(menu.id)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-900">{menu.name}</span>
                </label>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? "保存中..." : "担当メニューを保存"}
              </button>
            </div>
          </Form>
        </section>
      </div>
    </div>
  );
}
