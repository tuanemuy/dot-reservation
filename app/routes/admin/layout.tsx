import { Outlet, redirect } from "react-router";
import { AdminLayout } from "@/components/layout/AdminLayout";
import type { Route } from "./+types/layout";

export async function loader({ request }: Route.LoaderArgs) {
  const { container } = await import("@/core/di/server");
  const session = await container.authProvider.getSession(request.headers);

  if (!session) {
    throw redirect("/admin/login");
  }

  const members = await container.memberRepository.findByAuthUserId(
    session.user.id,
  );

  if (members.length === 0) {
    throw redirect("/admin/setup");
  }

  return { user: session.user, members };
}

export default function AdminCommonLayout(_props: Route.ComponentProps) {
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}
