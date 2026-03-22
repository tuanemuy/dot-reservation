import { Outlet } from "react-router";
import { AdminLayout } from "@/components/layout/AdminLayout";
import type { Route } from "./+types/layout";

export async function loader({ request: _request }: Route.LoaderArgs) {
  // TODO: 認証チェック
  // const currentUser = await container.authProvider.getCurrentUser(request.headers);
  // if (!currentUser) {
  //   throw redirect("/admin/login");
  // }
  // return { currentUser };
  return {};
}

export default function AdminCommonLayout(_props: Route.ComponentProps) {
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}
