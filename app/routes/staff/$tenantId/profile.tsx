import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { data, redirect } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { getStaffProfileByMemberId } from "@/core/application/staff/getStaffProfileByMemberId";
import { updateStaffProfile } from "@/core/application/staff/updateStaffProfile";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
  useCompositeAction,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/profile";

const updateProfileSchema = z.object({
  staffProfileId: z.string().min(1),
  displayName: z.string().min(1, "表示名を入力してください"),
  bio: z.string().optional(),
});

const handlers = {
  updateProfile: defineHandler({
    schema: updateProfileSchema,
    handler: async (value, args) => {
      const { container } = await import("@/core/di/server");

      return handleUseCase(() =>
        updateStaffProfile({
          container,
          headers: args.request.headers,
          input: {
            staffProfileId: value.staffProfileId,
            displayName: value.displayName,
            imageUrl: null,
            bio: value.bio ?? null,
          },
        }),
      ).match(
        (result) => success({ displayName: result.displayName }),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { container } = await import("@/core/di/server");
  const tenantId = params.tenantId;

  const session = await container.authProvider.getSession(request.headers);
  if (!session) {
    throw redirect("/admin/login");
  }

  const members = await container.memberRepository.findByAuthUserId(
    session.user.id,
  );
  const currentMember = members.find((m) => m.tenantId === tenantId);
  if (!currentMember) {
    throw redirect("/admin/tenants");
  }

  const myProfile = await handleUseCase(() =>
    getStaffProfileByMemberId({
      container,
      headers: request.headers,
      input: { memberId: currentMember.id },
    }),
  ).match(
    (result) => result,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  return {
    profile: {
      id: myProfile.id,
      displayName: myProfile.displayName,
      bio: myProfile.bio ?? "",
      profileImageUrl: myProfile.imageUrl,
    },
  };
}

export default function StaffProfilePage({ loaderData }: Route.ComponentProps) {
  const { profile } = loaderData;
  const fetcher = useCompositeAction<typeof handlers>();

  const [profileForm, profileFields] = useForm({
    id: "profile-form",
    defaultValue: {
      staffProfileId: profile.id,
      displayName: profile.displayName,
      bio: profile.bio,
    },
    lastResult:
      fetcher.data?.intent === "updateProfile" ? fetcher.data : undefined,
    constraint: getZodConstraint(handlers.updateProfile.schema),
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, {
        schema: handlers.updateProfile.schema,
      });
    },
  });

  fetcher.register("updateProfile", {
    onSuccess: () => {
      toast.success("プロフィールを更新しました");
    },
    onHandlerError: ({ error: err }) => {
      toast.error(err?.[""]?.[0] ?? "更新に失敗しました");
    },
  });

  const isPendingProfile = fetcher.isPending("updateProfile");
  const nameInitial = profile.displayName.charAt(0) || "S";

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-neutral-900">
          プロフィール編集
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          お客様に表示されるプロフィール情報を編集します
        </p>
      </div>

      {/* Form Card */}
      <div className="max-w-[640px] rounded-[14px] border border-border bg-white p-8">
        <fetcher.Form method="post" {...getFormProps(profileForm)}>
          <input type="hidden" name="intent" value="updateProfile" />
          <input type="hidden" name="staffProfileId" value={profile.id} />

          {/* Display Name */}
          <div className="mb-8">
            <label
              htmlFor={profileFields.displayName.id}
              className="mb-2 block text-sm font-medium text-text"
            >
              スタッフ表示名
            </label>
            <input
              {...getInputProps(profileFields.displayName, { type: "text" })}
              placeholder="表示名を入力してください"
              className="h-11 w-full rounded-[10px] border border-border bg-white px-4 font-body text-base text-text transition-colors duration-150 hover:border-neutral-400 focus:border-primary focus:outline-2 focus:outline-primary"
            />
            {profileFields.displayName.errors && (
              <p className="mt-1 text-xs text-error">
                {profileFields.displayName.errors[0]}
              </p>
            )}
          </div>

          {/* Profile Image */}
          <div className="mb-8">
            <span className="mb-2 block text-sm font-medium text-text">
              プロフィール画像
            </span>
            <div className="flex items-center gap-6">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-secondary-lighter to-secondary-light text-xl font-semibold text-secondary">
                {profile.profileImageUrl ? (
                  <img
                    src={profile.profileImageUrl}
                    alt="プロフィール画像"
                    className="h-20 w-20 rounded-full object-cover"
                  />
                ) : (
                  nameInitial
                )}
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs text-text-muted">
                  JPEG、PNG、WebP / 最大 2MB
                </span>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="mb-8">
            <label
              htmlFor={profileFields.bio.id}
              className="mb-2 block text-sm font-medium text-text"
            >
              自己紹介文
            </label>
            <textarea
              id={profileFields.bio.id}
              name={profileFields.bio.name}
              rows={5}
              defaultValue={profile.bio}
              placeholder="お客様に表示される自己紹介文を入力してください"
              className="w-full resize-y rounded-[10px] border border-border bg-white p-4 font-body text-base leading-[1.7] text-text transition-colors duration-150 hover:border-neutral-400 focus:border-primary focus:outline-2 focus:outline-primary"
            />
          </div>

          {profileForm.errors && (
            <p className="mb-4 text-xs text-error">{profileForm.errors}</p>
          )}

          {/* Submit */}
          <div className="mt-8">
            <button
              type="submit"
              disabled={isPendingProfile}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border-none bg-primary px-8 text-sm font-medium tracking-wide text-white transition-colors duration-150 hover:bg-primary-dark active:scale-[0.99] disabled:opacity-60"
            >
              {isPendingProfile ? "保存中..." : "保存する"}
            </button>
          </div>
        </fetcher.Form>
      </div>
    </div>
  );
}
