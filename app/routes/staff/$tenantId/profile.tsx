import { Form } from "react-router";
import type { Route } from "./+types/profile";

// TODO: 認証チェック
export async function loader({ params }: Route.LoaderArgs) {
  const _tenantId = params.tenantId;

  // TODO: スタッフプロフィール取得
  return {
    profile: {
      displayName: "",
      bio: "",
      profileImageUrl: null as string | null,
    },
  };
}

// TODO: 認証チェック
export async function action({ params, request }: Route.ActionArgs) {
  const _tenantId = params.tenantId;
  const _formData = await request.formData();

  // TODO: プロフィール更新処理
  return { success: true };
}

export default function StaffProfilePage({ loaderData }: Route.ComponentProps) {
  const { profile } = loaderData;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">プロフィール編集</h1>

      <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <Form method="post" className="space-y-5">
          <div>
            <label
              htmlFor="displayName"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              スタッフ表示名
            </label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              defaultValue={profile.displayName}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="profileImage"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              プロフィール画像
            </label>
            {profile.profileImageUrl && (
              <div className="mb-2">
                <img
                  src={profile.profileImageUrl}
                  alt="プロフィール画像"
                  className="h-20 w-20 rounded-full object-cover"
                />
              </div>
            )}
            <input
              type="file"
              id="profileImage"
              name="profileImage"
              accept="image/*"
              className="block w-full text-sm text-gray-500 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
            />
          </div>

          <div>
            <label
              htmlFor="bio"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              自己紹介文
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={4}
              defaultValue={profile.bio}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none"
            >
              保存
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}
