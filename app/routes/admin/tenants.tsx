import { Link } from "react-router";

// TODO: loader でテナント一覧を取得
// export async function loader({ request }: Route.LoaderArgs) {
//   const tenants = await handleUseCase(() => listTenants({ container, headers: request.headers, input: undefined }));
//   return { tenants };
// }

// 仮データ
const mockTenants = [
  { id: "1", name: "サロン A", role: "管理者" },
  { id: "2", name: "クリニック B", role: "スタッフ" },
];

export default function AdminTenantsPage() {
  const tenants = mockTenants;

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">テナント選択</h1>
        <Link
          to="/admin/new-tenant"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          新規テナント登録
        </Link>
      </div>

      {tenants.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">所属テナントがありません</p>
          <p className="mt-2 text-sm text-gray-400">
            新しいテナントを登録するか、招待を確認してください。
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Link
              to="/admin/new-tenant"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              テナントを登録
            </Link>
            <Link
              to="/admin/invitations"
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              招待を確認
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tenants.map((tenant) => (
            <Link
              key={tenant.id}
              to={`/admin/${tenant.id}/dashboard`}
              className="group rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
            >
              <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                {tenant.name}
              </h2>
              <span className="mt-2 inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                {tenant.role}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
