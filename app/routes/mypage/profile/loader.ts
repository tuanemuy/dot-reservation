import { data, redirect } from "react-router";
import { getCustomer } from "@/core/application/customer/getCustomer";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/index";

export async function loader({ request }: Route.LoaderArgs) {
  const { container } = await import("@/core/di/server");

  // NOTE: 本来はユースケース経由でアクセスすべき。専用ユースケース追加時に修正する
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
  const customerId = customer.id;

  const customerDetail = await handleUseCase(() =>
    getCustomer({
      container,
      headers: request.headers,
      input: { customerId },
    }),
  ).match(
    (r) => r,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  return {
    profile: {
      id: customerDetail.id,
      displayName: customerDetail.displayName,
      email: customerDetail.email,
      phoneNumber: customerDetail.phoneNumber,
    },
  };
}
