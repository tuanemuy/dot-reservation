import { data } from "react-router";
import { getCustomer } from "@/core/application/customer/getCustomer";
import { createReservation } from "@/core/application/reservation/createReservation";
import type { AvailableSlot } from "@/core/application/reservation/getAvailableSlots";
import { getAvailableSlots } from "@/core/application/reservation/getAvailableSlots";
import type { StaffProfileSummary } from "@/core/application/staff/listStaffProfiles";
import { listStaffsByMenu } from "@/core/application/staff/listStaffsByMenu";
import { getTenant } from "@/core/application/tenant/getTenant";
import {
  createCompositeAction,
  defineHandler,
  success,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/index";

async function resolveTenant(headers: Headers, urlPath: string) {
  const { container } = await import("@/core/di/server");
  return handleUseCase(() =>
    getTenant({
      container,
      headers,
      input: { urlPath },
    }),
  ).match(
    (r) => r,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );
}

export const handlers = {
  loadStaff: defineHandler({
    handler: async (formData, args) => {
      const { container } = await import("@/core/di/server");
      const menuId = formData.get("menuId") as string;
      const tenant = await resolveTenant(
        args.request.headers,
        (args as Route.ActionArgs).params.urlPath,
      );

      const result = await handleUseCase(() =>
        listStaffsByMenu({
          container,
          headers: args.request.headers,
          input: { tenantId: tenant.id, menuId },
        }),
      ).match(
        (r) => r,
        () => ({ items: [] as StaffProfileSummary[] }),
      );

      return success({ staff: result.items });
    },
  }),
  loadSlots: defineHandler({
    handler: async (formData, args) => {
      const { container } = await import("@/core/di/server");
      const menuId = formData.get("menuId") as string;
      const staffId = formData.get("staffId") as string | null;
      const dateStr = formData.get("date") as string;
      const tenant = await resolveTenant(
        args.request.headers,
        (args as Route.ActionArgs).params.urlPath,
      );

      const result = await handleUseCase(() =>
        getAvailableSlots({
          container,
          headers: args.request.headers,
          input: {
            tenantId: tenant.id,
            menuId,
            staffProfileId: staffId || null,
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
  createReservation: defineHandler({
    handler: async (formData, args) => {
      const { container } = await import("@/core/di/server");
      const menuId = formData.get("menuId") as string;
      const staffId = formData.get("staffId") as string | null;
      const dateStr = formData.get("date") as string;
      const startTime = formData.get("startTime") as string;
      const note = formData.get("note") as string;

      const tenant = await resolveTenant(
        args.request.headers,
        (args as Route.ActionArgs).params.urlPath,
      );

      const session = await container.authProvider.getSession(
        args.request.headers,
      );
      if (!session) {
        return success({
          id: null as string | null,
          status: null as string | null,
          error: "予約するにはログインが必要です",
          needsLogin: true,
        });
      }

      const customerResult = await handleUseCase(() =>
        getCustomer({
          container,
          headers: args.request.headers,
          input: { authUserId: session.user.id },
        }),
      ).match(
        (r) => ({ customerId: r.id, error: null }),
        () => ({
          customerId: null,
          error: "予約するにはログインが必要です",
        }),
      );

      if (!customerResult.customerId) {
        return success({
          id: null as string | null,
          status: null as string | null,
          error: customerResult.error,
          needsLogin: true,
        });
      }
      const customerId = customerResult.customerId;

      const result = await handleUseCase(() =>
        createReservation({
          container,
          headers: args.request.headers,
          input: {
            tenantId: tenant.id,
            customerId,
            menuId,
            staffProfileId: staffId || null,
            date: dateStr,
            startTime,
            note: note || null,
          },
        }),
      ).match(
        (r) => ({
          ...r,
          error: null as string | null,
          needsLogin: false,
        }),
        (e) => ({
          id: null as string | null,
          status: null as string | null,
          error: e.message,
          needsLogin: false,
        }),
      );

      return success(result);
    },
  }),
};

export type ActionData = ReturnType<
  typeof createCompositeAction<typeof handlers>
>;

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}
