import { Outlet } from "react-router";
import { CustomerLayout } from "./CustomerLayout";

export function MypageLayout() {
  return (
    <CustomerLayout>
      <Outlet />
    </CustomerLayout>
  );
}
