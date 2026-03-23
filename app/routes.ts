import {
  index,
  layout,
  type RouteConfig,
  route,
} from "@react-router/dev/routes";

export default [
  // better-auth API
  route("api/auth/*", "routes/api.auth.$.ts"),

  // 公開ページ
  index("routes/index.tsx"),
  route("search", "routes/search.tsx"),
  route("shop/:urlPath", "routes/shop.$urlPath.tsx"),
  route("shop/:urlPath/reserve", "routes/shop.$urlPath.reserve.tsx"),

  // 顧客認証
  route("customer/register", "routes/customer/register.tsx"),
  route("customer/login", "routes/customer/login.tsx"),
  route("customer/verify-email", "routes/customer/verify-email.tsx"),
  route("customer/forgot-password", "routes/customer/forgot-password.tsx"),
  route("customer/reset-password", "routes/customer/reset-password.tsx"),
  route("customer/setup", "routes/customer/setup.tsx"),

  // 顧客マイページ
  layout("routes/mypage/layout.tsx", [
    route("mypage/reservations", "routes/mypage/reservations/index.tsx"),
    route(
      "mypage/reservations/:id",
      "routes/mypage/reservations/$id/index.tsx",
    ),
    route(
      "mypage/reservations/:id/edit",
      "routes/mypage/reservations/$id/edit.tsx",
    ),
    route("mypage/notifications", "routes/mypage/notifications/index.tsx"),
    route("mypage/profile", "routes/mypage/profile.tsx"),
    route(
      "mypage/notifications/settings",
      "routes/mypage/notifications/settings.tsx",
    ),
  ]),

  // 管理画面認証
  route("admin/register", "routes/admin/register.tsx"),
  route("admin/login", "routes/admin/login.tsx"),
  route("admin/verify-email", "routes/admin/verify-email.tsx"),
  route("admin/forgot-password", "routes/admin/forgot-password.tsx"),
  route("admin/reset-password", "routes/admin/reset-password.tsx"),
  route("admin/setup", "routes/admin/setup.tsx"),

  // 管理画面共通（認証済み）
  layout("routes/admin/layout.tsx", [
    route("admin/tenants", "routes/admin/tenants.tsx"),
    route("admin/invitations", "routes/admin/invitations.tsx"),
    route("admin/profile", "routes/admin/profile.tsx"),
    route("admin/notifications", "routes/admin/notifications/index.tsx"),
    route(
      "admin/notifications/settings",
      "routes/admin/notifications/settings.tsx",
    ),
  ]),

  // テナント管理（認証済み）
  layout("routes/admin/$tenantId/layout.tsx", [
    route("admin/:tenantId/dashboard", "routes/admin/$tenantId/dashboard.tsx"),
    route("admin/:tenantId/settings", "routes/admin/$tenantId/settings.tsx"),
    route("admin/:tenantId/members", "routes/admin/$tenantId/members.tsx"),
    route(
      "admin/:tenantId/business-hours",
      "routes/admin/$tenantId/business-hours.tsx",
    ),
    route("admin/:tenantId/menus", "routes/admin/$tenantId/menus/index.tsx"),
    route("admin/:tenantId/menus/new", "routes/admin/$tenantId/menus/new.tsx"),
    route(
      "admin/:tenantId/menus/:menuId",
      "routes/admin/$tenantId/menus/$menuId.tsx",
    ),
    route("admin/:tenantId/staff", "routes/admin/$tenantId/staff/index.tsx"),
    route(
      "admin/:tenantId/staff/:staffId",
      "routes/admin/$tenantId/staff/$staffId.tsx",
    ),
    route("admin/:tenantId/shifts", "routes/admin/$tenantId/shifts.tsx"),
    route(
      "admin/:tenantId/reservation-settings",
      "routes/admin/$tenantId/reservation-settings.tsx",
    ),
    route(
      "admin/:tenantId/reservations",
      "routes/admin/$tenantId/reservations/index.tsx",
    ),
    route(
      "admin/:tenantId/reservations/new",
      "routes/admin/$tenantId/reservations/new.tsx",
    ),
    route(
      "admin/:tenantId/reservations/:reservationId",
      "routes/admin/$tenantId/reservations/$reservationId.tsx",
    ),
    route(
      "admin/:tenantId/reservations/:reservationId/edit",
      "routes/admin/$tenantId/reservations/$reservationId.edit.tsx",
    ),
  ]),

  // テナント新規登録
  route("admin/new-tenant", "routes/admin/new-tenant.tsx"),

  // スタッフ画面
  layout("routes/staff/$tenantId/layout.tsx", [
    route("staff/:tenantId/dashboard", "routes/staff/$tenantId/dashboard.tsx"),
    route("staff/:tenantId/profile", "routes/staff/$tenantId/profile.tsx"),
    route("staff/:tenantId/menus", "routes/staff/$tenantId/menus.tsx"),
    route("staff/:tenantId/schedule", "routes/staff/$tenantId/schedule.tsx"),
    route(
      "staff/:tenantId/shift-requests",
      "routes/staff/$tenantId/shift-requests.tsx",
    ),
    route(
      "staff/:tenantId/reservations",
      "routes/staff/$tenantId/reservations/index.tsx",
    ),
    route(
      "staff/:tenantId/reservations/new",
      "routes/staff/$tenantId/reservations/new.tsx",
    ),
    route(
      "staff/:tenantId/reservations/:reservationId",
      "routes/staff/$tenantId/reservations/$reservationId.tsx",
    ),
    route(
      "staff/:tenantId/reservations/:reservationId/edit",
      "routes/staff/$tenantId/reservations/$reservationId.edit.tsx",
    ),
  ]),

  // プラットフォーム認証
  route("platform/login", "routes/platform/login.tsx"),
  route("platform/forgot-password", "routes/platform/forgot-password.tsx"),
  route("platform/reset-password", "routes/platform/reset-password.tsx"),

  // プラットフォーム管理
  layout("routes/platform/layout.tsx", [
    route("platform/dashboard", "routes/platform/dashboard.tsx"),
    route("platform/tenants", "routes/platform/tenants/index.tsx"),
    route(
      "platform/tenants/:tenantId",
      "routes/platform/tenants/$tenantId.tsx",
    ),
    route("platform/users", "routes/platform/users/index.tsx"),
    route("platform/users/:userId", "routes/platform/users/$userId.tsx"),
  ]),
] satisfies RouteConfig;
