type StatusClasses = {
  badge: string;
  dot: string;
};

const reservationStyles: Record<string, StatusClasses> = {
  confirmed: {
    badge: "bg-success/10 text-success",
    dot: "bg-success",
  },
  pending: {
    badge: "bg-warning/10 text-warning",
    dot: "bg-warning",
  },
  completed: {
    badge: "bg-neutral-200 text-neutral-600",
    dot: "bg-neutral-500",
  },
  cancelled: {
    badge: "bg-error/8 text-error",
    dot: "bg-error",
  },
  rejected: {
    badge: "bg-error/8 text-error",
    dot: "bg-error",
  },
};

const reservationLabels: Record<string, string> = {
  confirmed: "確定",
  pending: "承認待ち",
  completed: "完了",
  cancelled: "キャンセル",
  rejected: "却下",
};

const tenantStyles: Record<string, StatusClasses> = {
  active: {
    badge: "bg-success/10 text-success",
    dot: "bg-success",
  },
  suspended: {
    badge: "bg-error/8 text-error",
    dot: "bg-error",
  },
};

const tenantLabels: Record<string, string> = {
  active: "アクティブ",
  suspended: "停止中",
};

const customerStyles: Record<string, StatusClasses> = {
  active: {
    badge: "bg-success/10 text-success",
    dot: "bg-success",
  },
  suspended: {
    badge: "bg-error/8 text-error",
    dot: "bg-error",
  },
  banned: {
    badge: "bg-error/8 text-error",
    dot: "bg-error",
  },
};

const customerLabels: Record<string, string> = {
  active: "アクティブ",
  suspended: "停止中",
  banned: "利用停止",
};

const invitationStyles: Record<string, StatusClasses> = {
  pending: {
    badge: "bg-warning/10 text-warning",
    dot: "bg-warning",
  },
  accepted: {
    badge: "bg-success/10 text-success",
    dot: "bg-success",
  },
  declined: {
    badge: "bg-error/8 text-error",
    dot: "bg-error",
  },
  expired: {
    badge: "bg-neutral-200 text-neutral-600",
    dot: "bg-neutral-500",
  },
  cancelled: {
    badge: "bg-neutral-200 text-neutral-600",
    dot: "bg-neutral-500",
  },
};

const invitationLabels: Record<string, string> = {
  pending: "未対応",
  accepted: "承認済み",
  declined: "辞退",
  expired: "期限切れ",
  cancelled: "取消済み",
};

type StatusBadgeVariant =
  | "reservation"
  | "tenant"
  | "customer"
  | "invitation"
  | "default";

const stylesByVariant: Record<
  StatusBadgeVariant,
  Record<string, StatusClasses>
> = {
  reservation: reservationStyles,
  tenant: tenantStyles,
  customer: customerStyles,
  invitation: invitationStyles,
  default: { ...reservationStyles, ...tenantStyles },
};

const labelsByVariant: Record<StatusBadgeVariant, Record<string, string>> = {
  reservation: reservationLabels,
  tenant: tenantLabels,
  customer: customerLabels,
  invitation: invitationLabels,
  default: { ...reservationLabels, ...tenantLabels },
};

const defaultClasses: StatusClasses = {
  badge: "bg-neutral-200 text-neutral-600",
  dot: "bg-neutral-500",
};

type StatusBadgeProps = {
  status: string;
  variant?: StatusBadgeVariant;
};

export function StatusBadge({ status, variant = "default" }: StatusBadgeProps) {
  const styles = stylesByVariant[variant];
  const labels = labelsByVariant[variant];
  const s = styles[status] ?? defaultClasses;
  const label = labels[status] ?? status;

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap gap-1 px-3 py-1 rounded-full text-xs font-medium ${s.badge}`}
    >
      <span aria-hidden="true" className={`size-1.5 rounded-full ${s.dot}`} />
      {label}
    </span>
  );
}
