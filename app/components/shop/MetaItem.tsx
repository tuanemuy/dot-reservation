type MetaItemProps = {
  label: string;
  value: string;
  icon: "location" | "phone" | "clock";
};

const iconPaths: Record<MetaItemProps["icon"], string> = {
  location:
    "M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z",
  phone:
    "M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z",
  clock: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z",
};

export function MetaItem({ label, value, icon }: MetaItemProps) {
  return (
    <div className="flex items-center gap-4 text-base text-neutral-700">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
        <svg
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
        >
          <title>{label}</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d={iconPaths[icon]}
          />
        </svg>
      </div>
      <div>
        <div className="mb-px text-xs font-medium uppercase tracking-[0.06em] text-neutral-500">
          {label}
        </div>
        {value}
      </div>
    </div>
  );
}
