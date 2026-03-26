import type { GetTenantOutput } from "@/core/application/tenant/getTenant";

type AccessSectionProps = {
  tenant: GetTenantOutput;
};

export function AccessSection({ tenant }: AccessSectionProps) {
  const fullAddress = `${tenant.address.prefecture}${tenant.address.city}${tenant.address.street}`;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="mb-2 text-lg font-medium text-neutral-900">住所</h3>
        <p className="text-neutral-600">
          〒{tenant.postalCode}
          <br />
          {fullAddress}
        </p>
      </div>
      <div>
        <h3 className="mb-2 text-lg font-medium text-neutral-900">電話番号</h3>
        <p className="text-neutral-600">{tenant.phoneNumber}</p>
      </div>
    </div>
  );
}
