import { z } from "zod";
import { deleteTenant } from "@/core/application/tenant/deleteTenant";
import { getTenant } from "@/core/application/tenant/getTenant";
import { reactivateTenant } from "@/core/application/tenant/reactivateTenant";
import { suspendTenant } from "@/core/application/tenant/suspendTenant";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/index";

const suspendSchema = z.object({
  reason: z.string().optional(),
});

const resumeSchema = z.object({});

const deleteSchema = z.object({
  confirmName: z.string().min(1, "テナント名を入力してください"),
});

export const handlers = {
  suspend: defineHandler({
    schema: suspendSchema,
    handler: async (_value, args) => {
      const { container } = await import("@/core/di/server");
      const tenantId = args.params.tenantId as string;
      return handleUseCase(() =>
        suspendTenant({
          container,
          headers: args.request.headers,
          input: { tenantId },
        }),
      ).match(
        () => success(),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
  resume: defineHandler({
    schema: resumeSchema,
    handler: async (_value, args) => {
      const { container } = await import("@/core/di/server");
      const tenantId = args.params.tenantId as string;
      return handleUseCase(() =>
        reactivateTenant({
          container,
          headers: args.request.headers,
          input: { tenantId },
        }),
      ).match(
        () => success(),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
  delete: defineHandler({
    schema: deleteSchema,
    handler: async (value, args) => {
      const { container } = await import("@/core/di/server");
      const tenantId = args.params.tenantId as string;

      const tenantResult = await handleUseCase(() =>
        getTenant({
          container,
          headers: args.request.headers,
          input: { tenantId },
        }),
      );

      if (tenantResult.isErr()) {
        return error({ "": [tenantResult.error.message] });
      }

      if (value.confirmName !== tenantResult.value.name) {
        return error({ confirmName: ["テナント名が一致しません"] });
      }

      return handleUseCase(() =>
        deleteTenant({
          container,
          headers: args.request.headers,
          input: { tenantId },
        }),
      ).match(
        () => success(),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}
