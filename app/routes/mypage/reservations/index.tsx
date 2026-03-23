import { data, Link, redirect, useSearchParams } from "react-router";
import { Pagination } from "@/components/ui/Pagination";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { listReservations } from "@/core/application/reservation/listReservations";
import { getTenant } from "@/core/application/tenant/getTenant";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/index";

const ITEMS_PER_PAGE = 10;

export async function loader({ request }: Route.LoaderArgs) {
  const { container } = await import("@/core/di/server");
  const url = new URL(request.url);
  const tab = url.searchParams.get("tab") ?? "upcoming";
  const page = Number(url.searchParams.get("page") ?? "1");

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

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const result = await handleUseCase(() =>
    listReservations({
      container,
      headers: request.headers,
      input: {
        customerId,
        status: null,
        startDate: tab === "upcoming" ? todayStr : null,
        endDate: tab === "past" ? todayStr : null,
        page,
        limit: ITEMS_PER_PAGE,
      },
    }),
  ).match(
    (r) => r,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  const tenantUrlPaths: Record<string, string> = {};
  const uniqueTenantIds = [...new Set(result.items.map((r) => r.tenantId))];
  for (const tenantId of uniqueTenantIds) {
    const tenant = await handleUseCase(() =>
      getTenant({
        container,
        headers: request.headers,
        input: { tenantId },
      }),
    ).match(
      (r) => r,
      () => null,
    );
    if (tenant) {
      tenantUrlPaths[tenantId] = tenant.urlPath;
    }
  }

  return {
    reservations: result.items,
    tenantUrlPaths,
    tab,
    page,
    totalPages: Math.ceil(result.totalCount / ITEMS_PER_PAGE),
  };
}

function formatReservationDate(dateStr: string, startTime: string): string {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  return `${year}年${month}月${day}日（${dayOfWeek}） ${startTime}`;
}

export default function ReservationsIndexPage({
  loaderData,
}: Route.ComponentProps) {
  const { reservations, tenantUrlPaths, tab, page, totalPages } = loaderData;
  const [searchParams, setSearchParams] = useSearchParams();

  const handleTabChange = (newTab: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", newTab);
    params.delete("page");
    setSearchParams(params);
  };

  return (
    <div>
      <h1
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "var(--text-2xl)",
          fontWeight: "var(--weight-semibold)",
          color: "var(--color-neutral-900)",
          letterSpacing: "var(--tracking-tight)",
          lineHeight: "var(--leading-tight)",
          marginBottom: "var(--space-lg)",
        }}
      >
        予約一覧
      </h1>

      {/* Tabs */}
      <div
        className="flex"
        style={{
          borderBottom: "1px solid var(--color-neutral-300)",
          marginBottom: "var(--space-lg)",
          gap: "0",
        }}
      >
        {[
          { id: "upcoming", label: "今後の予約" },
          { id: "past", label: "過去の予約" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => handleTabChange(t.id)}
            style={{
              padding: "var(--space-sm) var(--space-lg)",
              fontSize: "var(--text-base)",
              fontWeight: "var(--weight-medium)",
              color:
                tab === t.id
                  ? "var(--color-neutral-900)"
                  : "var(--color-neutral-500)",
              position: "relative",
              transition: "color var(--transition-default)",
              cursor: "pointer",
              border: "none",
              background: "none",
              fontFamily: "inherit",
              borderBottom:
                tab === t.id
                  ? "2px solid var(--color-primary)"
                  : "2px solid transparent",
              marginBottom: "-1px",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Reservation List */}
      {reservations.length === 0 ? (
        <p
          className="py-12 text-center"
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--color-neutral-500)",
          }}
        >
          予約はありません
        </p>
      ) : (
        <div className="flex flex-col" style={{ gap: "var(--space-md)" }}>
          {reservations.map((reservation) => (
            <Link
              key={reservation.id}
              to={`/mypage/reservations/${reservation.id}`}
              className="grid items-center border border-neutral-300 bg-[var(--color-bg-card)] no-underline transition-[border-color,box-shadow] duration-[0.15s] ease-[ease] hover:border-neutral-400 hover:shadow-[var(--shadow-sm)]"
              style={{
                gridTemplateColumns: "1fr auto",
                gap: "var(--space-xl)",
                padding: "var(--space-lg) var(--space-xl)",
                borderRadius: "var(--radius-lg)",
                color: "inherit",
                cursor: "pointer",
              }}
            >
              <div className="flex flex-col" style={{ gap: "var(--space-sm)" }}>
                {/* Status Badge */}
                <div
                  className="flex items-center"
                  style={{ gap: "var(--space-sm)" }}
                >
                  <StatusBadge
                    status={reservation.status}
                    variant="reservation"
                  />
                </div>

                {/* Tenant Name */}
                {reservation.tenantName && (
                  <div
                    style={{
                      fontSize: "var(--text-sm)",
                      fontWeight: "var(--weight-medium)",
                      color: "var(--color-neutral-500)",
                      letterSpacing: "var(--tracking-wide)",
                    }}
                  >
                    {reservation.tenantName}
                  </div>
                )}

                {/* Menu Name */}
                <div
                  style={{
                    fontSize: "var(--text-lg)",
                    fontWeight: "var(--weight-medium)",
                    color: "var(--color-neutral-800)",
                    letterSpacing: "var(--tracking-tight)",
                  }}
                >
                  {reservation.menuName}
                </div>

                {/* Meta: staff + date */}
                <div
                  className="flex flex-wrap"
                  style={{
                    gap: "var(--space-md)",
                    fontSize: "var(--text-sm)",
                    color: "var(--color-neutral-600)",
                  }}
                >
                  {reservation.staffName && (
                    <span
                      className="flex items-center"
                      style={{ gap: "var(--space-xs)" }}
                    >
                      <svg
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        style={{
                          width: "14px",
                          height: "14px",
                          color: "var(--color-neutral-500)",
                        }}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                        />
                      </svg>
                      {reservation.staffName}
                    </span>
                  )}
                  <span
                    className="flex items-center"
                    style={{ gap: "var(--space-xs)" }}
                  >
                    <svg
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      style={{
                        width: "14px",
                        height: "14px",
                        color: "var(--color-neutral-500)",
                      }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                      />
                    </svg>
                    {formatReservationDate(
                      reservation.date,
                      reservation.startTime,
                    )}
                  </span>
                </div>
              </div>

              {/* Arrow + Re-reserve */}
              <div
                className="flex flex-col items-end"
                style={{ gap: "var(--space-sm)" }}
              >
                <div style={{ color: "var(--color-neutral-500)" }}>
                  <svg
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    style={{ width: "20px", height: "20px" }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 4.5l7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </div>
                {reservation.status === "completed" &&
                  tenantUrlPaths[reservation.tenantId] && (
                    <Link
                      to={`/shop/${tenantUrlPaths[reservation.tenantId]}/reserve`}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        fontSize: "var(--text-xs)",
                        fontWeight: "var(--weight-medium)",
                        color: "var(--color-primary)",
                        textDecoration: "none",
                        whiteSpace: "nowrap",
                      }}
                    >
                      再予約
                    </Link>
                  )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-6">
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          baseUrl="/mypage/reservations"
          searchParams={searchParams}
        />
      </div>
    </div>
  );
}
