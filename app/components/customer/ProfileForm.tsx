import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import type { useCompositeAction } from "@/lib/compositeAction";
import {
  type handlers,
  updateProfileSchema,
} from "@/routes/mypage/profile/action";
import { cardClass, cardTitleClass } from "./styles";

type ProfileFormProps = {
  profile: {
    id: string;
    displayName: string;
    email: string;
    phoneNumber: string | null;
  };
  fetcher: ReturnType<typeof useCompositeAction<typeof handlers>>;
};

export function ProfileForm({ profile, fetcher }: ProfileFormProps) {
  const isPendingProfile = fetcher.isPending("updateProfile");

  const [profileForm, profileFields] = useForm({
    id: "profile-form",
    defaultValue: {
      customerId: profile.id,
      displayName: profile.displayName,
      email: profile.email,
      phoneNumber: profile.phoneNumber ?? "",
    },
    lastResult:
      fetcher.data?.intent === "updateProfile" ? fetcher.data : undefined,
    constraint: getZodConstraint(updateProfileSchema),
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, {
        schema: updateProfileSchema,
      });
    },
  });

  return (
    <div className={cardClass}>
      <h2 className={cardTitleClass}>基本情報</h2>
      <fetcher.Form method="post" {...getFormProps(profileForm)}>
        <input type="hidden" name="intent" value="updateProfile" />
        <input type="hidden" name="customerId" value={profile.id} />

        <FormField
          label="表示名"
          htmlFor={profileFields.displayName.id}
          error={profileFields.displayName.errors}
          required
        >
          <Input
            {...getInputProps(profileFields.displayName, { type: "text" })}
            error={profileFields.displayName.errors?.[0]}
          />
        </FormField>

        <FormField
          label="メールアドレス"
          htmlFor={profileFields.email.id}
          error={profileFields.email.errors}
          required
        >
          <Input
            {...getInputProps(profileFields.email, { type: "email" })}
            error={profileFields.email.errors?.[0]}
            disabled
          />
        </FormField>

        <FormField label="電話番号" htmlFor={profileFields.phoneNumber.id}>
          <Input
            {...getInputProps(profileFields.phoneNumber, { type: "tel" })}
            placeholder="090-1234-5678"
          />
          <p className="mt-1 text-xs text-neutral-500">
            予約確認の連絡に使用されます
          </p>
        </FormField>

        {profileForm.errors && (
          <p className="mb-4 text-sm text-error">{profileForm.errors}</p>
        )}

        <div className="mt-8">
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isPendingProfile}
            className="gap-2"
          >
            <svg
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
            {isPendingProfile ? "保存中..." : "保存する"}
          </Button>
        </div>
      </fetcher.Form>
    </div>
  );
}
