import { data } from "react-router";
import type { GetStaffProfileOutput } from "@/core/application/staff/getStaffProfile";
import { getStaffProfile } from "@/core/application/staff/getStaffProfile";
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

export const handlers = {
  loadStaffProfile: defineHandler({
    handler: async (formData, args) => {
      const { container } = await import("@/core/di/server");
      const staffProfileId = formData.get("staffProfileId") as string;

      const result = await handleUseCase(() =>
        getStaffProfile({
          container,
          headers: args.request.headers,
          input: { staffProfileId },
        }),
      ).match(
        (r) => ({
          profile: r as GetStaffProfileOutput | null,
          error: null as string | null,
        }),
        (e) => ({
          profile: null as GetStaffProfileOutput | null,
          error: e.message as string | null,
        }),
      );

      return success(result);
    },
  }),
  loadMenuStaff: defineHandler({
    handler: async (formData, args) => {
      const { container } = await import("@/core/di/server");
      const menuId = formData.get("menuId") as string;

      const tenant = await handleUseCase(() =>
        getTenant({
          container,
          headers: args.request.headers,
          input: { urlPath: (args as Route.ActionArgs).params.urlPath },
        }),
      ).match(
        (r) => r,
        (e) => {
          throw data({ message: e.message }, { status: e.status });
        },
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
};

export type ActionData = ReturnType<
  typeof createCompositeAction<typeof handlers>
>;

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}
