import type { Route } from "./+types/api.auth.$";

export async function loader({ request }: Route.LoaderArgs) {
  const { auth } = await import("@/core/di/server");
  return auth.handler(request);
}

export async function action({ request }: Route.ActionArgs) {
  const { auth } = await import("@/core/di/server");
  return auth.handler(request);
}
