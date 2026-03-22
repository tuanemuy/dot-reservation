import { Outlet } from "react-router";
import { PlatformLayout } from "@/components/layout/PlatformLayout";
import type { Route } from "./+types/layout";

export async function loader({ request: _request }: Route.LoaderArgs) {
  // TODO: 認証チェック
  // const currentUser = await container.authProvider.getCurrentUser(request.headers);
  // if (!currentUser) {
  //   throw redirect("/platform/login");
  // }
  // return { currentUser };
  return {};
}

export default function PlatformLayoutRoute(_props: Route.ComponentProps) {
  return (
    <PlatformLayout>
      <Outlet />
    </PlatformLayout>
  );
}
