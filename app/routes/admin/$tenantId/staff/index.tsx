import { Link, useParams } from "react-router";

// TODO: loader でスタッフ一覧を取得

// 仮データ
const mockStaff = [
  {
    id: "1",
    name: "佐藤 花子",
    image: null,
    menuCount: 3,
  },
  {
    id: "2",
    name: "田中 次郎",
    image: null,
    menuCount: 2,
  },
];

export default function TenantStaffPage() {
  const { tenantId } = useParams();

  return (
    <div className="p-8">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">スタッフ管理</h1>

      {mockStaff.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">スタッフが登録されていません</p>
          <p className="mt-2 text-sm text-gray-400">
            メンバー管理からメンバーを招待し、スタッフとして登録してください。
          </p>
          <Link
            to={`/admin/${tenantId}/members`}
            className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            メンバー管理へ
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mockStaff.map((staff) => (
            <Link
              key={staff.id}
              to={`/admin/${tenantId}/staff/${staff.id}`}
              className="group rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-gray-500">
                  {staff.image ? (
                    <img
                      src={staff.image}
                      alt={staff.name}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <svg
                      className="h-6 w-6"
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
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                    {staff.name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    担当メニュー: {staff.menuCount}件
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
