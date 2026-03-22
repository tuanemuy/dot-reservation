import { MypageLayout } from "@/components/layout/MypageLayout";
import type { Route } from "./+types/layout";

export async function loader(_args: Route.LoaderArgs) {
  // authProvider 実装後: 認証チェックを行い、未ログインの場合はリダイレクトする
  // const { container } = await import("@/core/di/server");
  // const currentUser = await container.authProvider.getCurrentUser(_args.request.headers);
  // if (!currentUser) {
  //   throw redirect("/customer/login");
  // }
  // return { currentUser };
  return {};
}

export default function MypageLayoutRoute(_props: Route.ComponentProps) {
  return <MypageLayout />;
}
