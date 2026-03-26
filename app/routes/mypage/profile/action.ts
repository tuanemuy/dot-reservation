import { z } from "zod";
import { deleteCustomer } from "@/core/application/customer/deleteCustomer";
import { updateCustomerProfile } from "@/core/application/customer/updateCustomerProfile";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/index";

export const updateProfileSchema = z.object({
  customerId: z.string().min(1),
  displayName: z.string().min(1, "表示名を入力してください"),
  email: z
    .string()
    .min(1, "メールアドレスを入力してください")
    .email("有効なメールアドレスを入力してください"),
  phoneNumber: z.string().optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "現在のパスワードを入力してください"),
    newPassword: z.string().min(8, "パスワードは8文字以上で入力してください"),
    newPasswordConfirmation: z
      .string()
      .min(1, "パスワード（確認）を入力してください"),
  })
  .refine((val) => val.newPassword === val.newPasswordConfirmation, {
    message: "パスワードが一致しません",
    path: ["newPasswordConfirmation"],
  });

export const deleteAccountSchema = z.object({
  customerId: z.string().min(1),
  password: z.string().min(1, "パスワードを入力してください"),
});

export const handlers = {
  updateProfile: defineHandler({
    schema: updateProfileSchema,
    handler: async (value, args) => {
      const { container } = await import("@/core/di/server");

      return handleUseCase(() =>
        updateCustomerProfile({
          container,
          headers: args.request.headers,
          input: {
            customerId: value.customerId,
            displayName: value.displayName,
            phoneNumber: value.phoneNumber || null,
          },
        }),
      ).match(
        () => success(),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
  deleteAccount: defineHandler({
    schema: deleteAccountSchema,
    handler: async (value, args) => {
      const { container } = await import("@/core/di/server");

      const session = await container.authProvider.getSession(
        args.request.headers,
      );
      if (!session) {
        return error({ "": ["認証情報が取得できませんでした"] });
      }

      const isValid = await container.authProvider.verifyPassword(
        session.user.id,
        value.password,
      );
      if (!isValid) {
        return error({ password: ["パスワードが正しくありません"] });
      }

      return handleUseCase(() =>
        deleteCustomer({
          container,
          headers: args.request.headers,
          input: {
            customerId: value.customerId,
          },
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
