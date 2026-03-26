import type { FieldMetadata } from "@conform-to/react";
import { getInputProps } from "@conform-to/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { labelClass } from "./styles";

type UrlPathStatus = "idle" | "checking" | "available" | "taken";

export function useUrlPathCheck(tenantId?: string) {
  const [urlPathStatus, setUrlPathStatus] = useState<UrlPathStatus>("idle");
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
        const params = new URLSearchParams({ urlPath: value });
        if (tenantId) {
          params.set("excludeTenantId", tenantId);
        }
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

function UrlPathIndicator({ status }: { status: UrlPathStatus }) {
  if (status === "idle") return null;

  if (status === "checking") {
    return <p className="mt-1 text-xs text-neutral-500">確認中...</p>;
  }

  if (status === "available") {
    return (
      <p className="mt-1 flex items-center gap-1 text-xs text-success">
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
    <p className="mt-1 flex items-center gap-1 text-xs text-error">
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

type UrlPathFieldProps = {
  field: FieldMetadata<string>;
  urlPathStatus: UrlPathStatus;
  onUrlPathChange: (value: string) => void;
  showRequired?: boolean;
  placeholder?: string;
};

export function UrlPathField({
  field,
  urlPathStatus,
  onUrlPathChange,
  showRequired = false,
  placeholder = "salon-calm",
}: UrlPathFieldProps) {
  return (
    <div>
      <label htmlFor={field.id} className={labelClass}>
        URLパス
        {showRequired && (
          <span className="ml-1 text-xs font-medium text-error">必須</span>
        )}
      </label>
      <div className="flex items-center overflow-hidden rounded-md border border-neutral-300 transition-[border-color] duration-150 hover:border-neutral-400 focus-within:border-primary focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary">
        <span className="flex h-11 shrink-0 items-center border-r border-neutral-300 bg-neutral-100 px-4 text-sm text-neutral-500">
          dot-reservation.com/
        </span>
        <input
          {...getInputProps(field, { type: "text" })}
          placeholder={placeholder}
          onChange={(e) => {
            onUrlPathChange(e.target.value);
          }}
          className="h-11 min-w-0 flex-1 border-none bg-white px-4 font-body text-base text-neutral-800 placeholder:text-neutral-500 focus:outline-none"
        />
      </div>
      <UrlPathIndicator status={urlPathStatus} />
      <p className="mt-1 text-xs text-neutral-500">
        英数字とハイフンのみ使用できます。公開ページのURLになります。
      </p>
      {field.errors && (
        <p className="mt-1 text-xs text-error">{field.errors}</p>
      )}
    </div>
  );
}
