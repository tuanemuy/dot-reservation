import { data, Link, redirect } from "react-router";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
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

export default function AdminTenantsPage({ loaderData }: Route.ComponentProps) {
  const { tenants } = loaderData;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text">テナント選択</h1>
        <Link to="/admin/new-tenant">
          <Button>新規テナント登録</Button>
        </Link>
      </div>

      {tenants.length === 0 ? (
        <div className="rounded-lg border border-border bg-white p-12 text-center">
          <p className="text-text-secondary">所属テナントがありません</p>
          <p className="mt-2 text-sm text-text-muted">
            新しいテナントを登録するか、招待を確認してください。
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Link to="/admin/new-tenant">
              <Button>テナントを登録</Button>
            </Link>
            <Link to="/admin/invitations">
              <Button variant="outline">招待を確認</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tenants.map((tenant) => (
            <Link
              key={tenant.tenantId}
              to={`/admin/${tenant.tenantId}/dashboard`}
              className="group rounded-lg border border-border bg-white p-6 transition-shadow hover:shadow-md"
            >
              <h2 className="text-lg font-semibold text-text group-hover:text-primary">
                {tenant.tenantName}
              </h2>
              <Badge className="mt-2">{tenant.role}</Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
