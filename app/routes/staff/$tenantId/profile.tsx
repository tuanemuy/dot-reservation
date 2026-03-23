import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { data, redirect } from "react-router";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
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

  // Get authenticated staff profile
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
      // Profile updated
    },
    onHandlerError: ({ error: err }) => {
      console.error("Profile update failed:", err);
    },
  });

  const isPendingProfile = fetcher.isPending("updateProfile");

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-text">プロフィール編集</h1>

      <Card>
        <CardBody>
          <fetcher.Form method="post" {...getFormProps(profileForm)}>
            <input type="hidden" name="intent" value="updateProfile" />
            <input type="hidden" name="staffProfileId" value={profile.id} />

            <div className="space-y-5">
              <FormField
                label="スタッフ表示名"
                htmlFor={profileFields.displayName.id}
                error={profileFields.displayName.errors}
                required
              >
                <Input
                  {...getInputProps(profileFields.displayName, {
                    type: "text",
                  })}
                  error={profileFields.displayName.errors?.[0]}
                />
              </FormField>

              {profile.profileImageUrl && (
                <div className="space-y-1.5">
                  <span className="block text-sm font-medium text-text">
                    プロフィール画像
                  </span>
                  <div>
                    <img
                      src={profile.profileImageUrl}
                      alt="プロフィール画像"
                      className="h-20 w-20 rounded-full object-cover"
                    />
                  </div>
                </div>
              )}

              <FormField label="自己紹介文" htmlFor={profileFields.bio.id}>
                <textarea
                  id={profileFields.bio.id}
                  name={profileFields.bio.name}
                  rows={4}
                  defaultValue={profile.bio}
                  className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm transition-colors placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </FormField>

              {profileForm.errors && (
                <p className="text-xs text-destructive">{profileForm.errors}</p>
              )}

              <div className="flex justify-end">
                <Button type="submit" disabled={isPendingProfile}>
                  {isPendingProfile ? "保存中..." : "保存"}
                </Button>
              </div>
            </div>
          </fetcher.Form>
        </CardBody>
      </Card>
    </div>
  );
}
