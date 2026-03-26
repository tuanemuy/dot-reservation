import { redirect } from "react-router";
import { z } from "zod";
import { createTenant } from "@/core/application/tenant/createTenant";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/index";

export const createTenantSchema = z.object({
  name: z.string().min(1, "テナント名を入力してください"),
  category: z.string().min(1, "カテゴリーを選択してください"),
  urlPath: z.string().min(1, "URLパスを入力してください"),
  postalCode: z.string().min(1, "郵便番号を入力してください"),
  prefecture: z.string().min(1, "都道府県を入力してください"),
  city: z.string().min(1, "市区町村を入力してください"),
  street: z.string().min(1, "番地を入力してください"),
  phone: z.string().min(1, "電話番号を入力してください"),
});

export const step1Schema = z.object({
  name: z.string().min(1, "テナント名を入力してください"),
  category: z.string().min(1, "カテゴリーを選択してください"),
  urlPath: z.string().min(1, "URLパスを入力してください"),
});

export const step2Schema = z.object({
  postalCode: z.string().min(1, "郵便番号を入力してください"),
  prefecture: z.string().min(1, "都道府県を入力してください"),
  city: z.string().min(1, "市区町村を入力してください"),
  street: z.string().min(1, "番地を入力してください"),
  phone: z.string().min(1, "電話番号を入力してください"),
});

export const handlers = {
  createTenant: defineHandler({
    schema: createTenantSchema,
    handler: async (value, args) => {
      const { container } = await import("@/core/di/server");

      const session = await container.authProvider.getSession(
        args.request.headers,
      );
      if (!session) {
        throw redirect("/admin/login");
      }

      return handleUseCase(() =>
        createTenant({
          container,
          headers: args.request.headers,
          input: {
            authUserId: session.user.id,
            name: value.name,
            category: value.category,
            urlPath: value.urlPath,
            postalCode: value.postalCode,
            address: {
              prefecture: value.prefecture,
              city: value.city,
              street: value.street,
            },
            phoneNumber: value.phone,
            creatorName: session.user.name,
            creatorEmail: session.user.email,
          },
        }),
      ).match(
        (result) => success({ tenantId: result.id }),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}
