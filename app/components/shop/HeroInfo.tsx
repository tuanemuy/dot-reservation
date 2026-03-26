import { Link } from "react-router";
import type { GetTenantOutput } from "@/core/application/tenant/getTenant";
import { MetaItem } from "./MetaItem";

type HeroInfoProps = {
  tenant: GetTenantOutput;
  menuCount: number;
  staffCount: number;
};

export function HeroInfo({ tenant, menuCount, staffCount }: HeroInfoProps) {
  const fullAddress = `${tenant.address.prefecture}${tenant.address.city}${tenant.address.street}`;

  const firstOpenDay = Object.entries(tenant.businessHours).find(
    ([dayIndex, hours]) =>
      hours !== null && !tenant.regularHolidays.includes(Number(dayIndex)),
  );
  const businessHoursDisplay = firstOpenDay
    ? `${firstOpenDay[1]?.open} - ${firstOpenDay[1]?.close}`
    : "営業時間はお問い合わせください";

  const openDaysPerWeek = Object.entries(tenant.businessHours).filter(
    ([dayIndex, h]) =>
      h !== null && !tenant.regularHolidays.includes(Number(dayIndex)),
  ).length;

  return (
    <div className="py-2">
      <span className="mb-4 inline-flex items-center gap-1 rounded-sm bg-primary-lighter px-4 py-1 text-xs font-medium tracking-wide text-primary">
        {tenant.category}
      </span>
      <h1 className="mb-2 font-heading text-3xl font-semibold leading-tight tracking-tight text-neutral-900">
        {tenant.name}
      </h1>
      {tenant.description && (
        <p className="mb-8 text-base font-light text-neutral-600">
          {tenant.description}
        </p>
      )}

      <div className="mb-8 flex flex-col gap-4">
        <MetaItem label="Address" value={fullAddress} icon="location" />
        <MetaItem label="Phone" value={tenant.phoneNumber} icon="phone" />
        <MetaItem label="Hours" value={businessHoursDisplay} icon="clock" />
      </div>

      <div className="flex flex-col gap-4">
        <Link
          to={`/shop/${tenant.urlPath}/reserve`}
          className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-md border-none bg-primary px-8 font-body text-lg font-medium tracking-wide text-white no-underline transition-[background] duration-150 hover:bg-primary-dark active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <svg
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <title>予約</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
            />
          </svg>
          予約する
        </Link>
        <p className="text-center text-xs text-neutral-500">
          24時間オンライン予約受付中
        </p>
      </div>

      <HeroStats
        menuCount={menuCount}
        staffCount={staffCount}
        openDaysPerWeek={openDaysPerWeek}
      />
    </div>
  );
}

function HeroStats({
  menuCount,
  staffCount,
  openDaysPerWeek,
}: {
  menuCount: number;
  staffCount: number;
  openDaysPerWeek: number;
}) {
  return (
    <div className="mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-lg bg-neutral-300">
      <StatItem value={menuCount} label="メニュー" colorClass="text-primary" />
      <StatItem
        value={staffCount}
        label="スタッフ"
        colorClass="text-secondary"
      />
      <StatItem
        value={openDaysPerWeek}
        label="営業日/週"
        colorClass="text-accent"
      />
    </div>
  );
}

function StatItem({
  value,
  label,
  colorClass,
}: {
  value: number;
  label: string;
  colorClass: string;
}) {
  return (
    <div className="bg-neutral-100 p-4 text-center">
      <div
        className={`font-heading text-xl font-semibold tracking-tight ${colorClass}`}
      >
        {value}
      </div>
      <div className="mt-0.5 text-xs font-normal text-neutral-500">{label}</div>
    </div>
  );
}
