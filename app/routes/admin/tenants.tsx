import { data, Link, redirect } from "react-router";
import { listMemberTenants } from "@/core/application/member/listMemberTenants";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/tenants";

export async function loader({ request }: Route.LoaderArgs) {
  const { container } = await import("@/core/di/server");

  const session = await container.authProvider.getSession(request.headers);
  if (!session) {
    throw redirect("/admin/login");
  }

  const result = await handleUseCase(() =>
    listMemberTenants({
      container,
      headers: request.headers,
      input: { authUserId: session.user.id },
    }),
  ).match(
    (result) => result,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  return { tenants: result.items };
}

function getRoleLabel(role: string): { label: string; className: string } {
  switch (role) {
    case "admin":
      return { label: "管理者", className: "bg-primary-lighter text-primary" };
    case "staff":
      return {
        label: "スタッフ",
        className: "bg-secondary-lighter text-secondary-dark",
      };
    default:
      return {
        label: role,
        className: "bg-surface-secondary text-text-secondary",
      };
  }
}

export default function AdminTenantsPage({ loaderData }: Route.ComponentProps) {
  const { tenants } = loaderData;

  return (
    <div className="flex flex-1 items-center justify-center px-8 py-14">
      <div className="w-full max-w-[560px]">
        <h1 className="mb-2 text-center font-heading text-2xl font-semibold leading-tight tracking-tight text-neutral-900">
          テナントを選択
        </h1>
        <p className="mb-8 text-center text-sm text-neutral-500">
          管理するテナントを選択してください
        </p>

        {tenants.length === 0 ? (
          <div className="mb-10 rounded-lg border border-neutral-300 bg-white p-14 text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-200">
              <svg
                className="h-6 w-6 text-neutral-500"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.15c0 .415.336.75.75.75z"
                />
              </svg>
            </div>
            <p className="text-base text-neutral-500">
              所属テナントがありません
            </p>
          </div>
        ) : (
          <div className="mb-10 flex flex-col gap-4">
            {tenants.map((tenant) => {
              const role = getRoleLabel(tenant.role);
              return (
                <Link
                  key={tenant.tenantId}
                  to={`/admin/${tenant.tenantId}/dashboard`}
                  className="flex items-center justify-between rounded-lg border border-neutral-300 bg-white px-8 py-6 transition-[border-color,box-shadow] duration-150 hover:border-primary-light hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-neutral-200">
                      <svg
                        className="h-[22px] w-[22px] text-neutral-600"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.15c0 .415.336.75.75.75z"
                        />
                      </svg>
                    </div>
                    <span className="text-lg font-semibold tracking-tight text-neutral-800">
                      {tenant.tenantName}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${role.className}`}
                    >
                      {role.label}
                    </span>
                    <svg
                      className="h-[18px] w-[18px] text-neutral-500"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8.25 4.5l7.5 7.5-7.5 7.5"
                      />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Bottom Section */}
        <div className="border-t border-neutral-300 pt-8">
          <p className="mb-4 text-center text-sm text-neutral-500">
            テナント未所属の方・招待をお待ちの方
          </p>
          <div className="flex justify-center gap-8">
            <Link
              to="/admin/new-tenant"
              className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-primary transition-[background,color] duration-150 hover:bg-primary-lighter hover:text-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              テナントを新規登録
            </Link>
            <Link
              to="/admin/invitations"
              className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-primary transition-[background,color] duration-150 hover:bg-primary-lighter hover:text-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                />
              </svg>
              招待を確認
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
