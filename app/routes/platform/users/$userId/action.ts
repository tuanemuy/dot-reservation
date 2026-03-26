import { z } from "zod";
import { deleteCustomer } from "@/core/application/customer/deleteCustomer";
import { reactivateCustomer } from "@/core/application/customer/reactivateCustomer";
import { suspendCustomer } from "@/core/application/customer/suspendCustomer";
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
  confirmText: z.string().min(1, "「削除」と入力してください"),
});

export const handlers = {
  suspend: defineHandler({
    schema: suspendSchema,
    handler: async (_value, args) => {
      const { container } = await import("@/core/di/server");
      const userId = args.params.userId as string;
      return handleUseCase(() =>
        suspendCustomer({
          container,
          headers: args.request.headers,
          input: { customerId: userId },
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
      const userId = args.params.userId as string;
      return handleUseCase(() =>
        reactivateCustomer({
          container,
          headers: args.request.headers,
          input: { customerId: userId },
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
      if (value.confirmText !== "削除") {
        return error({ confirmText: ["「削除」と入力してください"] });
      }
      const userId = args.params.userId as string;
      return handleUseCase(() =>
        deleteCustomer({
          container,
          headers: args.request.headers,
          input: { customerId: userId },
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
