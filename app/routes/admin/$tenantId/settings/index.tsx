import { DeleteTenantSection } from "@/components/tenant/DeleteTenantSection";
import { TenantProfileForm } from "@/components/tenant/TenantProfileForm";
import type { Route } from "./+types/index";

export { action } from "./action";
export { loader } from "./loader";

export default function TenantSettingsPage({
  loaderData,
}: Route.ComponentProps) {
  const { tenant } = loaderData;

  return (
    <div>
      <h1 className="mb-8 font-heading text-2xl font-semibold leading-tight tracking-tight text-neutral-900">
        テナント設定
      </h1>

      <div className="max-w-2xl space-y-8">
        <TenantProfileForm tenant={tenant} />
        <DeleteTenantSection tenantName={tenant.name} />
      </div>
    </div>
  );
}
