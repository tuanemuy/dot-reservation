import { RoleBadge } from "@/components/platform/RoleBadge";

type Member = {
  id: string;
  name: string;
  role: string;
  joinedAt: string;
};

type MemberTableProps = {
  members: Member[];
};

export function MemberTable({ members }: MemberTableProps) {
  if (members.length === 0) {
    return (
      <p className="px-6 pb-6 text-sm text-neutral-500">メンバーがいません</p>
    );
  }

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr>
          {["名前", "役割", "参加日"].map((header) => (
            <th
              key={header}
              className="border-b border-neutral-300 bg-neutral-50 px-6 py-2 text-left text-xs font-medium tracking-wide text-neutral-500"
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {members.map((member, index) => (
          <tr
            key={member.id}
            className="transition-colors duration-150 hover:bg-neutral-50"
          >
            <td
              className={`px-6 py-2 text-sm text-neutral-700 ${
                index < members.length - 1 ? "border-b border-neutral-200" : ""
              }`}
            >
              {member.name}
            </td>
            <td
              className={`px-6 py-2 text-sm ${
                index < members.length - 1 ? "border-b border-neutral-200" : ""
              }`}
            >
              <RoleBadge role={member.role} />
            </td>
            <td
              className={`px-6 py-2 text-sm text-neutral-700 ${
                index < members.length - 1 ? "border-b border-neutral-200" : ""
              }`}
            >
              {member.joinedAt}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
