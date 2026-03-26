import { useRef, useState } from "react";
import { toast } from "sonner";
import { useCompositeAction } from "@/lib/compositeAction";
import type { handlers } from "@/routes/admin/$tenantId/settings/action";
import { labelClass } from "./styles";

type ImageManagerProps = {
  imageUrls: string[];
};

export function ImageManager({ imageUrls }: ImageManagerProps) {
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
      <div className="mb-2 flex items-center justify-between">
        <span className={labelClass}>店舗画像</span>
        <span className="text-xs text-neutral-500">
          {localImageUrls.length} / 10
        </span>
      </div>

      {localImageUrls.length > 0 && (
        <div className="mb-4 space-y-2">
          {localImageUrls.map((url, index) => (
            <div
              key={url}
              className="flex items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 p-2"
            >
              <img
                src={url}
                alt={`店舗画像 ${index + 1}`}
                className="h-16 w-16 shrink-0 rounded-sm border border-neutral-200 object-cover"
              />
              <span className="min-w-0 flex-1 truncate text-xs text-neutral-500">
                {index + 1}枚目
              </span>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  disabled={index === 0 || isProcessing}
                  onClick={() => handleMoveUp(index)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-neutral-300 bg-white text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-30"
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
                  className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-neutral-300 bg-white text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-30"
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
                  className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-error bg-white text-error transition-colors hover:bg-error hover:text-white disabled:opacity-30"
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
            className="w-full rounded-md border-2 border-dashed border-neutral-300 bg-white p-6 text-center transition-colors hover:border-neutral-400 hover:bg-neutral-50 disabled:opacity-50"
          >
            <p className="text-sm text-neutral-500">
              {isPendingUpload
                ? "アップロード中..."
                : "クリックして画像をアップロード"}
            </p>
          </button>
        </div>
      ) : (
        <p className="rounded-md border border-neutral-200 bg-neutral-50 p-4 text-center text-sm text-neutral-500">
          画像の上限(10枚)に達しています
        </p>
      )}

      <input type="hidden" name="imageUrls" value={currentImageUrlsValue} />
    </div>
  );
}
