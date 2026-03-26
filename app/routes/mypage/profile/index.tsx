import { toast } from "sonner";
import { DeleteAccountSection } from "@/components/customer/DeleteAccountSection";
import { PasswordChangeForm } from "@/components/customer/PasswordChangeForm";
import { ProfileForm } from "@/components/customer/ProfileForm";
import { useCompositeAction } from "@/lib/compositeAction";
import type { Route } from "./+types/index";
import type { handlers } from "./action";

export { action } from "./action";
export { loader } from "./loader";

export default function ProfilePage({ loaderData }: Route.ComponentProps) {
  const { profile } = loaderData;
  const fetcher = useCompositeAction<typeof handlers>();

  fetcher.register("updateProfile", {
    onSuccess: () => {
      toast.success("プロフィールを更新しました");
    },
    onHandlerError: ({ error: err }) => {
      toast.error(err?.[""]?.[0] ?? "更新に失敗しました");
    },
  });

  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold text-neutral-900 tracking-tight leading-tight mb-8">
        プロフィール設定
      </h1>

      <ProfileForm profile={profile} fetcher={fetcher} />
      <PasswordChangeForm />
      <DeleteAccountSection profileId={profile.id} fetcher={fetcher} />
    </div>
  );
}
