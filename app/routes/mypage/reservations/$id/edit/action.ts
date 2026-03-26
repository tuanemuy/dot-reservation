import { z } from "zod";
import type { AvailableSlot } from "@/core/application/reservation/getAvailableSlots";
import { getAvailableSlots } from "@/core/application/reservation/getAvailableSlots";
import { updateReservation } from "@/core/application/reservation/updateReservation";
import type { StaffProfileSummary } from "@/core/application/staff/listStaffProfiles";
import { listStaffsByMenu } from "@/core/application/staff/listStaffsByMenu";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/index";

export const updateReservationSchema = z.object({
  reservationId: z.string().min(1),
  menuId: z.string().min(1, "メニューを選択してください"),
  staffProfileId: z.string().optional(),
  date: z.string().min(1, "日付を選択してください"),
  startTime: z.string().min(1, "開始時刻を選択してください"),
  note: z.string().optional(),
});

export const handlers = {
  updateReservation: defineHandler({
    schema: updateReservationSchema,
    handler: async (value, args) => {
      const { container } = await import("@/core/di/server");

      return handleUseCase(() =>
        updateReservation({
          container,
          headers: args.request.headers,
          input: {
            reservationId: value.reservationId,
            menuId: value.menuId,
            staffProfileId: value.staffProfileId || null,
            date: value.date,
            startTime: value.startTime,
            note: value.note || null,
            modifiedBy: "customer",
          },
        }),
      ).match(
        (r) => success({ id: r.id }),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
  loadStaff: defineHandler({
    handler: async (formData, _args) => {
      const { container } = await import("@/core/di/server");
      const tenantId = formData.get("tenantId") as string;
      const menuId = formData.get("menuId") as string;

      const result = await handleUseCase(() =>
        listStaffsByMenu({
          container,
          headers: _args.request.headers,
          input: { tenantId, menuId },
        }),
      ).match(
        (r) => r,
        () => ({ items: [] as StaffProfileSummary[] }),
      );

      return success({ staff: result.items });
    },
  }),
  loadSlots: defineHandler({
    handler: async (formData, _args) => {
      const { container } = await import("@/core/di/server");
      const tenantId = formData.get("tenantId") as string;
      const menuId = formData.get("menuId") as string;
      const staffProfileId = formData.get("staffProfileId") as string | null;
      const dateStr = formData.get("date") as string;

      const result = await handleUseCase(() =>
        getAvailableSlots({
          container,
          headers: _args.request.headers,
          input: {
            tenantId,
            menuId,
            staffProfileId: staffProfileId || null,
            date: dateStr,
          },
        }),
      ).match(
        (r) => r,
        () => ({ slots: [] as AvailableSlot[] }),
      );

      return success({ slots: result.slots });
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}
