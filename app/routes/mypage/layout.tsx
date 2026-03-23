import { data, redirect } from "react-router";
import { MypageLayout } from "@/components/layout/MypageLayout";
import type { Route } from "./+types/layout";

export async function loader({ request }: Route.LoaderArgs) {
  const { container } = await import("@/core/di/server");
  const session = await container.authProvider.getSession(request.headers);

  if (!session) {
    throw redirect("/customer/login");
  }

  const customer = await container.customerRepository.findByAuthUserId(
    session.user.id,
  );

  if (!customer) {
    throw redirect("/customer/setup");
  }

  if (customer.status === "suspended") {
    throw data({ message: "アカウントが停止されています。" }, { status: 403 });
  }

  return { customer };
}

export default function MypageLayoutRoute(_props: Route.ComponentProps) {
  return <MypageLayout />;
}
