import { MypageLayout } from "@/components/layout/MypageLayout";
import type { Route } from "./+types/layout";

export async function loader(_args: Route.LoaderArgs) {
  // TODO: 認証チェック
  // const currentUser = await container.authProvider.getCurrentUser(_args.request.headers);
  // if (!currentUser) {
  //   throw redirect("/customer/login");
  // }
  return {};
}

export default function MypageLayoutRoute(_props: Route.ComponentProps) {
  return <MypageLayout />;
}
