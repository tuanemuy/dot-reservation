import { checkUrlPathAvailability } from "@/core/application/tenant/checkUrlPathAvailability";
import { container } from "@/core/di/server";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/api.check-url-path";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const urlPath = url.searchParams.get("urlPath");
  const excludeTenantId = url.searchParams.get("excludeTenantId");

  if (!urlPath) {
    return Response.json({ error: "urlPath is required" }, { status: 400 });
  }

  const result = await handleUseCase(() =>
    checkUrlPathAvailability({
      container,
      headers: request.headers,
      input: {
        urlPath,
        excludeTenantId,
      },
    }),
  ).match(
    (output) => Response.json({ available: output.available }),
    (e) =>
      Response.json(
        { available: false, error: e.message },
        { status: e.status },
      ),
  );

  return result;
}
