import type { MenuDetail } from "@/core/application/menu/listMenus";
import type { AvailableSlot } from "@/core/application/reservation/getAvailableSlots";
import type { StaffProfileSummary } from "@/core/application/staff/listStaffProfiles";
import type { GetTenantOutput } from "@/core/application/tenant/getTenant";

export type ReservationState = {
  menuId: string | null;
  staffId: string | null;
  date: string | null;
  startTime: string | null;
  note: string;
};

export type { AvailableSlot, MenuDetail, StaffProfileSummary, GetTenantOutput };
