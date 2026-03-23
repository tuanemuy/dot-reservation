import { Outlet, redirect } from "react-router";
import { PlatformLayout } from "@/components/layout/PlatformLayout";
import type { Route } from "./+types/layout";

export async function loader({ request }: Route.LoaderArgs) {
  const { container } = await import("@/core/di/server");
  const session = await container.authProvider.getSession(request.headers);

  if (!session) {
    throw redirect("/platform/login");
  }

  if (session.user.role !== "admin") {
    throw redirect("/platform/login");
  }

  return { user: session.user };
}

export default function PlatformLayoutRoute({
  loaderData,
}: Route.ComponentProps) {
  return (
    <PlatformLayout userEmail={loaderData.user.email}>
      <Outlet />
    </PlatformLayout>
  );
}
