const roleLabels: Record<string, string> = {
  owner: "オーナー",
  admin: "管理者",
  member: "メンバー",
};

type RoleBadgeProps = {
  role: string;
};

export function RoleBadge({ role }: RoleBadgeProps) {
  const isOwner = role === "owner" || role === "admin";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-[2px] text-xs font-medium ${
        isOwner
          ? "bg-accent-lighter text-accent-dark"
          : "bg-neutral-200 text-neutral-600"
      }`}
    >
      {roleLabels[role] ?? role}
    </span>
  );
}
