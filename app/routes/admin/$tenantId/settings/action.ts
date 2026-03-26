import { redirect } from "react-router";
import { z } from "zod";
import { deleteTenant } from "@/core/application/tenant/deleteTenant";
import { getTenant } from "@/core/application/tenant/getTenant";
import { updateTenantProfile } from "@/core/application/tenant/updateTenantProfile";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/index";

export const updateTenantSchema = z.object({
  name: z.string().min(1, "テナント名を入力してください"),
  category: z.string().min(1, "カテゴリーを選択してください"),
  urlPath: z.string().min(1, "URLパスを入力してください"),
  postalCode: z.string().min(1, "郵便番号を入力してください"),
  prefecture: z.string().min(1, "都道府県を入力してください"),
  city: z.string().min(1, "市区町村を入力してください"),
  street: z.string().min(1, "番地を入力してください"),
  phone: z.string().optional().default(""),
  description: z.string().optional().default(""),
  imageUrls: z.string().optional().default(""),
});

export const deleteTenantSchema = z.object({
  confirmName: z.string().min(1, "テナント名を入力してください"),
});

export const handlers = {
  updateTenant: defineHandler({
    schema: updateTenantSchema,
    handler: async (value, args) => {
      const { container } = await import("@/core/di/server");
      const existingImageUrls = value.imageUrls
        ? value.imageUrls
            .split("\n")
            .map((u: string) => u.trim())
            .filter(Boolean)
        : [];
      return handleUseCase(() =>
        updateTenantProfile({
          container,
          headers: args.request.headers,
          input: {
            tenantId: args.params.tenantId as string,
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
            description: value.description || null,
            imageUrls: existingImageUrls,
          },
        }),
      ).match(
        (result) => success({ tenant: result }),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
  uploadImage: defineHandler({
    handler: async (formData, args) => {
      const { container } = await import("@/core/di/server");
      const file = formData.get("file");
      if (!(file instanceof File) || file.size === 0) {
        return error({ "": ["画像ファイルを選択してください"] });
      }

      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
      ];
      if (!allowedTypes.includes(file.type)) {
        return error({
          "": ["対応していないファイル形式です（JPEG, PNG, WebP, GIF のみ）"],
        });
      }

      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        return error({ "": ["ファイルサイズは10MB以下にしてください"] });
      }

      const currentUrls = formData.get("currentImageUrls");
      const existingUrls =
        typeof currentUrls === "string" && currentUrls
          ? currentUrls.split("\n").filter(Boolean)
          : [];

      if (existingUrls.length >= 10) {
        return error({ "": ["画像は最大10枚までです"] });
      }

      const url = await handleUseCase(() =>
        container.storageManager.uploadImage(file),
      ).match(
        (uploadedUrl) => uploadedUrl,
        (e) => {
          throw new Error(e.message);
        },
      );

      const newUrls = [...existingUrls, url];

      const tenantId = args.params.tenantId as string;
      const tenantResult = await handleUseCase(() =>
        getTenant({
          container,
          headers: args.request.headers,
          input: { tenantId },
        }),
      ).match(
        (result) => result,
        (e) => {
          throw new Error(e.message);
        },
      );

      return handleUseCase(() =>
        updateTenantProfile({
          container,
          headers: args.request.headers,
          input: {
            tenantId,
            name: tenantResult.name,
            category: tenantResult.category,
            urlPath: tenantResult.urlPath,
            postalCode: tenantResult.postalCode,
            address: tenantResult.address,
            phoneNumber: tenantResult.phoneNumber,
            description: tenantResult.description,
            imageUrls: newUrls,
          },
        }),
      ).match(
        () => success({ imageUrls: newUrls }),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
  deleteImage: defineHandler({
    handler: async (formData, args) => {
      const { container } = await import("@/core/di/server");
      const imageUrl = formData.get("imageUrl");
      if (typeof imageUrl !== "string" || !imageUrl) {
        return error({ "": ["削除する画像が指定されていません"] });
      }

      const currentUrls = formData.get("currentImageUrls");
      const existingUrls =
        typeof currentUrls === "string" && currentUrls
          ? currentUrls.split("\n").filter(Boolean)
          : [];

      const newUrls = existingUrls.filter((u) => u !== imageUrl);

      const tenantId = args.params.tenantId as string;
      const tenantResult = await handleUseCase(() =>
        getTenant({
          container,
          headers: args.request.headers,
          input: { tenantId },
        }),
      ).match(
        (result) => result,
        (e) => {
          throw new Error(e.message);
        },
      );

      await handleUseCase(() =>
        container.storageManager.deleteImage(imageUrl),
      ).match(
        () => {},
        () => {},
      );

      return handleUseCase(() =>
        updateTenantProfile({
          container,
          headers: args.request.headers,
          input: {
            tenantId,
            name: tenantResult.name,
            category: tenantResult.category,
            urlPath: tenantResult.urlPath,
            postalCode: tenantResult.postalCode,
            address: tenantResult.address,
            phoneNumber: tenantResult.phoneNumber,
            description: tenantResult.description,
            imageUrls: newUrls,
          },
        }),
      ).match(
        () => success({ imageUrls: newUrls }),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
  reorderImages: defineHandler({
    handler: async (formData, args) => {
      const { container } = await import("@/core/di/server");
      const orderedUrls = formData.get("orderedImageUrls");
      const newUrls =
        typeof orderedUrls === "string" && orderedUrls
          ? orderedUrls.split("\n").filter(Boolean)
          : [];

      const tenantId = args.params.tenantId as string;
      const tenantResult = await handleUseCase(() =>
        getTenant({
          container,
          headers: args.request.headers,
          input: { tenantId },
        }),
      ).match(
        (result) => result,
        (e) => {
          throw new Error(e.message);
        },
      );

      return handleUseCase(() =>
        updateTenantProfile({
          container,
          headers: args.request.headers,
          input: {
            tenantId,
            name: tenantResult.name,
            category: tenantResult.category,
            urlPath: tenantResult.urlPath,
            postalCode: tenantResult.postalCode,
            address: tenantResult.address,
            phoneNumber: tenantResult.phoneNumber,
            description: tenantResult.description,
            imageUrls: newUrls,
          },
        }),
      ).match(
        () => success({ imageUrls: newUrls }),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
  deleteTenant: defineHandler({
    schema: deleteTenantSchema,
    handler: async (value, args) => {
      const { container } = await import("@/core/di/server");
      const tenantId = args.params.tenantId as string;

      const tenantResult = await handleUseCase(() =>
        getTenant({
          container,
          headers: args.request.headers,
          input: { tenantId },
        }),
      ).match(
        (result) => result,
        (e) => {
          throw new Error(e.message);
        },
      );

      if (value.confirmName !== tenantResult.name) {
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
  const result = await createCompositeAction(args, handlers);

  if (result.intent === "deleteTenant" && result.status === "success") {
    throw redirect("/admin/tenants");
  }

  return result;
}
