import { data, Link } from "react-router";
import { listStaffProfiles } from "@/core/application/staff/listStaffProfiles";
import { container } from "@/core/di/server";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/index";

export async function loader({ params, request }: Route.LoaderArgs) {
  const staffResult = await handleUseCase(() =>
    listStaffProfiles({
      container,
      headers: request.headers,
      input: { tenantId: params.tenantId },
    }),
  ).match(
    (result) => result,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  return { staff: staffResult.items };
}

export default function TenantStaffPage({
  loaderData,
  params,
}: Route.ComponentProps) {
  const { staff } = loaderData;
  const tenantId = params.tenantId;

  return (
    <div className="p-8">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">スタッフ管理</h1>

      {staff.length === 0 ? (
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
          {staff.map((member) => (
            <Link
              key={member.id}
              to={`/admin/${tenantId}/staff/${member.id}`}
              className="group rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-gray-500">
                  {member.imageUrl ? (
                    <img
                      src={member.imageUrl}
                      alt={member.displayName}
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
                    {member.displayName}
                  </h2>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
