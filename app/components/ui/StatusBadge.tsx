type StatusStyle = {
  background: string;
  color: string;
  dotColor: string;
};

const reservationStyles: Record<string, StatusStyle> = {
  confirmed: {
    background: "oklch(0.55 0.12 145 / 0.1)",
    color: "var(--color-success)",
    dotColor: "var(--color-success)",
  },
  pending: {
    background: "oklch(0.72 0.14 70 / 0.1)",
    color: "var(--color-warning)",
    dotColor: "var(--color-warning)",
  },
  completed: {
    background: "var(--color-neutral-200)",
    color: "var(--color-neutral-600)",
    dotColor: "var(--color-neutral-500)",
  },
  cancelled: {
    background: "oklch(0.55 0.16 25 / 0.08)",
    color: "var(--color-error)",
    dotColor: "var(--color-error)",
  },
  rejected: {
    background: "oklch(0.55 0.16 25 / 0.08)",
    color: "var(--color-error)",
    dotColor: "var(--color-error)",
  },
};

const reservationLabels: Record<string, string> = {
  confirmed: "確定",
  pending: "承認待ち",
  completed: "完了",
  cancelled: "キャンセル",
  rejected: "却下",
};

const tenantStyles: Record<string, StatusStyle> = {
  active: {
    background: "oklch(0.55 0.12 145 / 0.1)",
    color: "var(--color-success)",
    dotColor: "var(--color-success)",
  },
  suspended: {
    background: "oklch(0.55 0.16 25 / 0.08)",
    color: "var(--color-error)",
    dotColor: "var(--color-error)",
  },
};

const tenantLabels: Record<string, string> = {
  active: "アクティブ",
  suspended: "停止中",
};

const customerStyles: Record<string, StatusStyle> = {
  active: {
    background: "oklch(0.55 0.12 145 / 0.1)",
    color: "var(--color-success)",
    dotColor: "var(--color-success)",
  },
  suspended: {
    background: "oklch(0.55 0.16 25 / 0.08)",
    color: "var(--color-error)",
    dotColor: "var(--color-error)",
  },
  banned: {
    background: "oklch(0.55 0.16 25 / 0.08)",
    color: "var(--color-error)",
    dotColor: "var(--color-error)",
  },
};

const customerLabels: Record<string, string> = {
  active: "アクティブ",
  suspended: "停止中",
  banned: "利用停止",
};

const invitationStyles: Record<string, StatusStyle> = {
  pending: {
    background: "oklch(0.72 0.14 70 / 0.1)",
    color: "var(--color-warning)",
    dotColor: "var(--color-warning)",
  },
  accepted: {
    background: "oklch(0.55 0.12 145 / 0.1)",
    color: "var(--color-success)",
    dotColor: "var(--color-success)",
  },
  declined: {
    background: "oklch(0.55 0.16 25 / 0.08)",
    color: "var(--color-error)",
    dotColor: "var(--color-error)",
  },
  expired: {
    background: "var(--color-neutral-200)",
    color: "var(--color-neutral-600)",
    dotColor: "var(--color-neutral-500)",
  },
  cancelled: {
    background: "var(--color-neutral-200)",
    color: "var(--color-neutral-600)",
    dotColor: "var(--color-neutral-500)",
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
  Record<string, StatusStyle>
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

const defaultStyle: StatusStyle = {
  background: "var(--color-neutral-200)",
  color: "var(--color-neutral-600)",
  dotColor: "var(--color-neutral-500)",
};

type StatusBadgeProps = {
  status: string;
  variant?: StatusBadgeVariant;
};

export function StatusBadge({ status, variant = "default" }: StatusBadgeProps) {
  const styles = stylesByVariant[variant];
  const labels = labelsByVariant[variant];
  const s = styles[status] ?? defaultStyle;
  const label = labels[status] ?? status;

  return (
    <span
      className="inline-flex items-center whitespace-nowrap"
      style={{
        gap: "4px",
        padding: "4px 12px",
        borderRadius: "var(--radius-full)",
        fontSize: "var(--text-xs)",
        fontWeight: 500,
        background: s.background,
        color: s.color,
      }}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "var(--radius-full)",
          background: s.dotColor,
        }}
      />
      {label}
    </span>
  );
}
