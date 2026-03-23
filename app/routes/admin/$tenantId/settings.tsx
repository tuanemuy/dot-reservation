import {
  getFormProps,
  getInputProps,
  getTextareaProps,
  useForm,
} from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { useCallback, useEffect, useRef, useState } from "react";
import { data, redirect } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { deleteTenant } from "@/core/application/tenant/deleteTenant";
import { getTenant } from "@/core/application/tenant/getTenant";
import { updateTenantProfile } from "@/core/application/tenant/updateTenantProfile";
import { container } from "@/core/di/server";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
  useCompositeAction,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/settings";

export async function loader({ params, request }: Route.LoaderArgs) {
  const tenantResult = await handleUseCase(() =>
    getTenant({
      container,
      headers: request.headers,
      input: { tenantId: params.tenantId },
    }),
  ).match(
    (result) => result,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  return { tenant: tenantResult };
}

const updateTenantSchema = z.object({
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

const deleteTenantSchema = z.object({
  confirmName: z.string().min(1, "テナント名を入力してください"),
});

export const handlers = {
  updateTenant: defineHandler({
    schema: updateTenantSchema,
    handler: async (value, args) => {
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
      const file = formData.get("file");
      if (!(file instanceof File) || file.size === 0) {
        return error({ "": ["画像ファイルを選択してください"] });
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
    handler: async (_value, args) => {
      return handleUseCase(() =>
        deleteTenant({
          container,
          headers: args.request.headers,
          input: { tenantId: args.params.tenantId as string },
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

const inputClass =
  "h-11 w-full rounded-[var(--radius-md)] border border-neutral-300 bg-white px-[var(--space-md)] font-[var(--font-body)] text-[length:var(--text-base)] text-neutral-800 placeholder:text-neutral-500 transition-[border-color,box-shadow] duration-[0.15s] ease-[ease] hover:border-neutral-400 focus:border-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary";

const labelClass =
  "mb-[var(--space-sm)] block text-[length:var(--text-sm)] font-[var(--weight-medium)] text-neutral-700";

function useUrlPathCheck(tenantId: string) {
  const [urlPathStatus, setUrlPathStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const checkUrlPath = useCallback(
    (value: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      if (!value || value.length < 3) {
        setUrlPathStatus("idle");
        return;
      }

      setUrlPathStatus("checking");

      debounceRef.current = setTimeout(async () => {
        const params = new URLSearchParams({
          urlPath: value,
          excludeTenantId: tenantId,
        });
        const res = await fetch(`/api/check-url-path?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          setUrlPathStatus(json.available ? "available" : "taken");
        } else {
          setUrlPathStatus("idle");
        }
      }, 400);
    },
    [tenantId],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return { urlPathStatus, checkUrlPath };
}

function UrlPathIndicator({
  status,
}: {
  status: "idle" | "checking" | "available" | "taken";
}) {
  if (status === "idle") return null;

  if (status === "checking") {
    return (
      <p className="mt-[var(--space-xs)] text-[length:var(--text-xs)] text-neutral-500">
        確認中...
      </p>
    );
  }

  if (status === "available") {
    return (
      <p className="mt-[var(--space-xs)] flex items-center gap-1 text-[length:var(--text-xs)] text-green-600">
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 12.75l6 6 9-13.5"
          />
        </svg>
        利用可能
      </p>
    );
  }

  return (
    <p className="mt-[var(--space-xs)] flex items-center gap-1 text-[length:var(--text-xs)] text-error">
      <svg
        className="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
      既に使用されています
    </p>
  );
}

function ImageManager({ imageUrls }: { imageUrls: string[] }) {
  const fetcher = useCompositeAction<typeof handlers>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localImageUrls, setLocalImageUrls] = useState<string[]>(imageUrls);

  const currentImageUrlsValue = localImageUrls.join("\n");

  const isPendingUpload = fetcher.isPending("uploadImage");
  const isPendingDelete = fetcher.isPending("deleteImage");
  const isPendingReorder = fetcher.isPending("reorderImages");
  const isProcessing = isPendingUpload || isPendingDelete || isPendingReorder;

  fetcher.register("uploadImage", {
    onSuccess: ({ data: result }) => {
      setLocalImageUrls(result.imageUrls);
      toast.success("画像をアップロードしました");
    },
    onHandlerError: ({ error: err }) => {
      toast.error(err?.[""]?.[0] ?? "アップロードに失敗しました");
    },
  });

  fetcher.register("deleteImage", {
    onSuccess: ({ data: result }) => {
      setLocalImageUrls(result.imageUrls);
      toast.success("画像を削除しました");
    },
    onHandlerError: ({ error: err }) => {
      toast.error(err?.[""]?.[0] ?? "削除に失敗しました");
    },
  });

  fetcher.register("reorderImages", {
    onSuccess: ({ data: result }) => {
      setLocalImageUrls(result.imageUrls);
    },
    onHandlerError: ({ error: err }) => {
      toast.error(err?.[""]?.[0] ?? "並び替えに失敗しました");
    },
  });

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.set("intent", "uploadImage");
    formData.set("file", file);
    formData.set("currentImageUrls", currentImageUrlsValue);

    fetcher.submit(formData, {
      method: "post",
      encType: "multipart/form-data",
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDelete = (url: string) => {
    const formData = new FormData();
    formData.set("intent", "deleteImage");
    formData.set("imageUrl", url);
    formData.set("currentImageUrls", currentImageUrlsValue);

    fetcher.submit(formData, { method: "post" });
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newUrls = [...localImageUrls];
    [newUrls[index - 1], newUrls[index]] = [newUrls[index], newUrls[index - 1]];
    setLocalImageUrls(newUrls);

    const formData = new FormData();
    formData.set("intent", "reorderImages");
    formData.set("orderedImageUrls", newUrls.join("\n"));
    fetcher.submit(formData, { method: "post" });
  };

  const handleMoveDown = (index: number) => {
    if (index >= localImageUrls.length - 1) return;
    const newUrls = [...localImageUrls];
    [newUrls[index], newUrls[index + 1]] = [newUrls[index + 1], newUrls[index]];
    setLocalImageUrls(newUrls);

    const formData = new FormData();
    formData.set("intent", "reorderImages");
    formData.set("orderedImageUrls", newUrls.join("\n"));
    fetcher.submit(formData, { method: "post" });
  };

  return (
    <div>
      <div className="mb-[var(--space-sm)] flex items-center justify-between">
        <span className={labelClass}>店舗画像</span>
        <span className="text-[length:var(--text-xs)] text-neutral-500">
          {localImageUrls.length} / 10
        </span>
      </div>

      {localImageUrls.length > 0 && (
        <div className="mb-[var(--space-md)] space-y-[var(--space-sm)]">
          {localImageUrls.map((url, index) => (
            <div
              key={url}
              className="flex items-center gap-[var(--space-sm)] rounded-[var(--radius-md)] border border-neutral-200 bg-neutral-50 p-[var(--space-sm)]"
            >
              <img
                src={url}
                alt={`店舗画像 ${index + 1}`}
                className="h-16 w-16 shrink-0 rounded-[var(--radius-sm)] border border-neutral-200 object-cover"
              />
              <span className="min-w-0 flex-1 truncate text-[length:var(--text-xs)] text-neutral-500">
                {index + 1}枚目
              </span>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  disabled={index === 0 || isProcessing}
                  onClick={() => handleMoveUp(index)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-neutral-300 bg-white text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-30"
                  title="上に移動"
                >
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 15.75l7.5-7.5 7.5 7.5"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  disabled={index >= localImageUrls.length - 1 || isProcessing}
                  onClick={() => handleMoveDown(index)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-neutral-300 bg-white text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-30"
                  title="下に移動"
                >
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleDelete(url)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-error bg-white text-error transition-colors hover:bg-error hover:text-white disabled:opacity-30"
                  title="削除"
                >
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {localImageUrls.length < 10 ? (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            disabled={isProcessing}
            onClick={handleFileSelect}
            className="w-full rounded-[var(--radius-md)] border-2 border-dashed border-neutral-300 bg-white p-[var(--space-lg)] text-center transition-colors hover:border-neutral-400 hover:bg-neutral-50 disabled:opacity-50"
          >
            <p className="text-[length:var(--text-sm)] text-neutral-500">
              {isPendingUpload
                ? "アップロード中..."
                : "クリックして画像をアップロード"}
            </p>
          </button>
        </div>
      ) : (
        <p className="rounded-[var(--radius-md)] border border-neutral-200 bg-neutral-50 p-[var(--space-md)] text-center text-[length:var(--text-sm)] text-neutral-500">
          画像の上限(10枚)に達しています
        </p>
      )}

      <input type="hidden" name="imageUrls" value={currentImageUrlsValue} />
    </div>
  );
}

export default function TenantSettingsPage({
  loaderData,
}: Route.ComponentProps) {
  const { tenant } = loaderData;
  const fetcher = useCompositeAction<typeof handlers>();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");

  const { urlPathStatus, checkUrlPath } = useUrlPathCheck(tenant.id);

  const [updateForm, updateFields] = useForm({
    id: "update-tenant-form",
    lastResult:
      fetcher.data?.intent === "updateTenant" ? fetcher.data : undefined,
    constraint: getZodConstraint(handlers.updateTenant.schema),
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    defaultValue: {
      name: tenant.name,
      category: tenant.category,
      urlPath: tenant.urlPath,
      postalCode: tenant.postalCode,
      prefecture: tenant.address.prefecture,
      city: tenant.address.city,
      street: tenant.address.street,
      phone: tenant.phoneNumber,
      description: tenant.description ?? "",
      imageUrls: tenant.imageUrls.join("\n"),
    },
    onValidate({ formData }) {
      return parseWithZod(formData, {
        schema: handlers.updateTenant.schema,
      });
    },
  });

  const [deleteForm, deleteFields] = useForm({
    id: "delete-tenant-form",
    lastResult:
      fetcher.data?.intent === "deleteTenant" ? fetcher.data : undefined,
    constraint: getZodConstraint(handlers.deleteTenant.schema),
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, {
        schema: handlers.deleteTenant.schema,
      });
    },
  });

  fetcher.register("updateTenant", {
    onSuccess: () => {
      toast.success("テナント情報を更新しました");
    },
    onHandlerError: ({ error: err }) => {
      toast.error(err?.[""]?.[0] ?? "更新に失敗しました");
    },
  });

  fetcher.register("deleteTenant", {
    onHandlerError: ({ error: err }) => {
      toast.error(err?.[""]?.[0] ?? "削除に失敗しました");
    },
  });

  const isPendingUpdate = fetcher.isPending("updateTenant");
  const isPendingDelete = fetcher.isPending("deleteTenant");

  return (
    <div>
      <h1 className="mb-[var(--space-xl)] font-[var(--font-heading)] text-[length:var(--text-2xl)] font-[var(--weight-semibold)] leading-[var(--leading-tight)] tracking-[var(--tracking-tight)] text-neutral-900">
        テナント設定
      </h1>

      <div className="max-w-2xl space-y-[var(--space-xl)]">
        <section className="rounded-[var(--radius-lg)] border border-neutral-300 bg-white p-[var(--space-lg)]">
          <h2 className="mb-[var(--space-md)] font-[var(--font-heading)] text-[length:var(--text-lg)] font-[var(--weight-semibold)] tracking-[var(--tracking-tight)] text-neutral-800">
            基本情報
          </h2>
          <fetcher.Form
            method="post"
            {...getFormProps(updateForm)}
            className="space-y-4"
          >
            <input type="hidden" name="intent" value="updateTenant" />

            <div>
              <label htmlFor={updateFields.name.id} className={labelClass}>
                テナント名
              </label>
              <input
                {...getInputProps(updateFields.name, { type: "text" })}
                className={inputClass}
              />
              {updateFields.name.errors && (
                <p className="mt-1 text-[length:var(--text-xs)] text-error">
                  {updateFields.name.errors}
                </p>
              )}
            </div>

            <div>
              <label htmlFor={updateFields.category.id} className={labelClass}>
                カテゴリー
              </label>
              <select
                {...getInputProps(updateFields.category, { type: "text" })}
                className={`${inputClass} cursor-pointer appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='2' stroke='%23B8B5B1'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5' /%3E%3C/svg%3E")] bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-10`}
              >
                <option value="" disabled>
                  カテゴリーを選択
                </option>
                <option value="seitai">整体院</option>
                <option value="gym">ジム</option>
                <option value="biyoin">美容院</option>
                <option value="nail">ネイルサロン</option>
                <option value="esthe">エステサロン</option>
                <option value="relaxation">リラクゼーションサロン</option>
                <option value="other">その他</option>
              </select>
              {updateFields.category.errors && (
                <p className="mt-1 text-[length:var(--text-xs)] text-error">
                  {updateFields.category.errors}
                </p>
              )}
            </div>

            <div>
              <label htmlFor={updateFields.urlPath.id} className={labelClass}>
                URLパス
              </label>
              <div className="flex items-center overflow-hidden rounded-[var(--radius-md)] border border-neutral-300 transition-[border-color] duration-[0.15s] ease-[ease] hover:border-neutral-400 focus-within:border-primary focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary">
                <span className="flex h-11 shrink-0 items-center border-r border-neutral-300 bg-neutral-100 px-[var(--space-md)] text-[length:var(--text-sm)] text-neutral-500">
                  dot-reservation.com/
                </span>
                <input
                  {...getInputProps(updateFields.urlPath, { type: "text" })}
                  onChange={(e) => {
                    checkUrlPath(e.target.value);
                  }}
                  className="h-11 min-w-0 flex-1 border-none bg-white px-[var(--space-md)] font-[var(--font-body)] text-[length:var(--text-base)] text-neutral-800 placeholder:text-neutral-500 focus:outline-none"
                />
              </div>
              <UrlPathIndicator status={urlPathStatus} />
              <p className="mt-[var(--space-xs)] text-[length:var(--text-xs)] text-neutral-500">
                英数字とハイフンのみ使用できます。公開ページのURLになります。
              </p>
              {updateFields.urlPath.errors && (
                <p className="mt-1 text-[length:var(--text-xs)] text-error">
                  {updateFields.urlPath.errors}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor={updateFields.postalCode.id}
                className={labelClass}
              >
                郵便番号
              </label>
              <input
                {...getInputProps(updateFields.postalCode, { type: "text" })}
                placeholder="123-4567"
                className={`${inputClass} w-48`}
              />
              {updateFields.postalCode.errors && (
                <p className="mt-1 text-[length:var(--text-xs)] text-error">
                  {updateFields.postalCode.errors}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor={updateFields.prefecture.id}
                className={labelClass}
              >
                都道府県
              </label>
              <input
                {...getInputProps(updateFields.prefecture, { type: "text" })}
                placeholder="東京都"
                className={inputClass}
              />
              {updateFields.prefecture.errors && (
                <p className="mt-1 text-[length:var(--text-xs)] text-error">
                  {updateFields.prefecture.errors}
                </p>
              )}
            </div>

            <div>
              <label htmlFor={updateFields.city.id} className={labelClass}>
                市区町村
              </label>
              <input
                {...getInputProps(updateFields.city, { type: "text" })}
                placeholder="渋谷区"
                className={inputClass}
              />
              {updateFields.city.errors && (
                <p className="mt-1 text-[length:var(--text-xs)] text-error">
                  {updateFields.city.errors}
                </p>
              )}
            </div>

            <div>
              <label htmlFor={updateFields.street.id} className={labelClass}>
                番地
              </label>
              <input
                {...getInputProps(updateFields.street, { type: "text" })}
                placeholder="神南1-2-3"
                className={inputClass}
              />
              {updateFields.street.errors && (
                <p className="mt-1 text-[length:var(--text-xs)] text-error">
                  {updateFields.street.errors}
                </p>
              )}
            </div>

            <div>
              <label htmlFor={updateFields.phone.id} className={labelClass}>
                電話番号
              </label>
              <input
                {...getInputProps(updateFields.phone, { type: "tel" })}
                placeholder="03-1234-5678"
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor={updateFields.description.id}
                className={labelClass}
              >
                紹介文
              </label>
              <textarea
                {...getTextareaProps(updateFields.description)}
                rows={4}
                className="min-h-[88px] w-full rounded-[var(--radius-md)] border border-neutral-300 bg-white px-[var(--space-md)] py-[var(--space-sm)] text-[length:var(--text-base)] text-neutral-800 transition-[border-color] duration-[0.15s] ease-[ease] hover:border-neutral-400 focus:border-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary"
              />
            </div>

            <ImageManager imageUrls={tenant.imageUrls} />

            {updateForm.errors && (
              <p className="text-[length:var(--text-xs)] text-error">
                {updateForm.errors}
              </p>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isPendingUpdate}
                className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] bg-primary px-[var(--space-lg)] text-[length:var(--text-sm)] font-[var(--weight-medium)] tracking-[var(--tracking-wide)] text-white transition-[background,transform] duration-[0.15s] ease-[ease] hover:bg-primary-dark active:scale-[0.99] disabled:opacity-50"
              >
                {isPendingUpdate ? "更新中..." : "更新する"}
              </button>
            </div>
          </fetcher.Form>
        </section>

        {/* テナント削除 */}
        <section className="rounded-[var(--radius-lg)] border border-error bg-white p-[var(--space-lg)]">
          <h2 className="mb-[var(--space-md)] font-[var(--font-heading)] text-[length:var(--text-lg)] font-[var(--weight-semibold)] tracking-[var(--tracking-tight)] text-error">
            テナント削除
          </h2>
          <p className="mb-[var(--space-md)] text-[length:var(--text-sm)] text-neutral-600">
            テナントを削除すると、すべてのデータ（メニュー、スタッフ、予約など）が完全に削除されます。この操作は取り消せません。
          </p>

          {showDeleteConfirm ? (
            <fetcher.Form
              method="post"
              {...getFormProps(deleteForm)}
              className="space-y-4"
            >
              <input type="hidden" name="intent" value="deleteTenant" />
              <div>
                <label
                  htmlFor={deleteFields.confirmName.id}
                  className={labelClass}
                >
                  確認のためテナント名「{tenant.name}」を入力
                </label>
                <input
                  {...getInputProps(deleteFields.confirmName, { type: "text" })}
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
                  className="h-11 w-full rounded-[var(--radius-md)] border border-neutral-300 bg-white px-[var(--space-md)] text-[length:var(--text-base)] text-neutral-800 transition-[border-color] duration-[0.15s] ease-[ease] focus:border-error focus:outline-2 focus:outline-offset-2 focus:outline-error"
                />
                {deleteFields.confirmName.errors && (
                  <p className="mt-1 text-[length:var(--text-xs)] text-error">
                    {deleteFields.confirmName.errors}
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={
                    isPendingDelete || deleteConfirmName !== tenant.name
                  }
                  className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] border border-error bg-white px-[var(--space-lg)] text-[length:var(--text-sm)] font-[var(--weight-medium)] text-error transition-[background,color] hover:bg-error hover:text-white disabled:opacity-50"
                >
                  {isPendingDelete ? "削除中..." : "テナントを削除"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmName("");
                  }}
                  className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] border border-neutral-300 bg-white px-[var(--space-lg)] text-[length:var(--text-sm)] font-[var(--weight-medium)] text-neutral-600 transition-colors hover:bg-neutral-200"
                >
                  キャンセル
                </button>
              </div>
            </fetcher.Form>
          ) : (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] border border-error bg-white px-[var(--space-lg)] text-[length:var(--text-sm)] font-[var(--weight-medium)] text-error transition-[background,color] hover:bg-error hover:text-white"
            >
              テナントを削除する
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
